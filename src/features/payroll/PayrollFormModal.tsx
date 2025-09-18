import React, { useEffect, useMemo, useState } from 'react';
import { X, Calculator } from 'lucide-react';
import {
    useCreatePayrollMutation,
    useUpdatePayrollMutation,
    PayrollDoc,
    useGetPayrollsQuery,
} from '../../services/payrollServices';
import { useGetEmployeesQuery } from '../../services/employeeServices';
import { useGetCompanyPartOfSalaryQuery } from '../../services/companyDetailsServices';
import { useListDeductionRulesQuery } from '../../services/salaryDeductionRuleServices';


interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    initial?: Partial<PayrollDoc> | null; // when editing, pass fetched doc
    onSuccess?: () => void;
}

type RuleMode = 'fixed' | 'percent_of_basic' | 'percent_of_gross';
type DeductionRule = {
    _id: string;
    name: string;
    code: string;
    type: string;
    active: boolean;
    is_applicable?: boolean;
    tax_slab?: any[];
    compute: { mode: RuleMode; fixedAmount?: number; percent?: number };
};

const numberOrEmpty = (v: any) => (v === 0 || v ? String(v) : '');

// Updated salary structure calculation based on your handwritten notes
function calculateSalaryStructure(grossSalary: number) {
    const gross = Number(grossSalary) || 0;

    // Based on your notes:
    // 50% of Gross = Basic
    // 30% of Gross = HRA
    // Gross - Basic + HRA = DA (Dearness Allowance)
    const basic = (gross * 50) / 100;
    const hra = (gross * 30) / 100;
    const da = gross - basic - hra; // This is the remaining 20%

    return {
        basic,
        hra,
        allowances: da, // Using allowances field for DA
    };
}

// Remove automatic standard deductions - they're handled by custom rules
function calculateStandardDeductions(grossSalary: number, basic: number) {
    // Return empty array - no automatic deductions
    return [];
}

function getBases(form: any) {
    const s = form?.salaryStructure || {};
    const baseBasic = Number(form?.grossSalary) || 0;
    const basic = Number(s.basic) || 0;
    const gross = baseBasic;
    return { basic, gross };
}

function computeAmountForRule(
    rule: DeductionRule,
    bases: { basic: number; gross: number }
) {
    // ✅ Slab-first: rate is a FIXED AMOUNT
    if (rule.is_applicable && Array.isArray(rule.tax_slab) && rule.tax_slab.length > 0) {
        const base = bases.gross; // or bases.basic if your slabs apply to basic
        const matched = rule.tax_slab.find((s: any) =>
            (s.from == null || base >= Number(s.from)) &&
            (s.to == null || base <= Number(s.to))
        );
        if (matched) {
            const amt = Number(matched.rate) || 0; // ← fixed amount
            return Math.max(0, amt);
        }
        return 0;
    }

    // Fallbacks for non-slab rules
    const { mode, fixedAmount = 0, percent = 0 } = rule.compute || {};
    if (mode === 'fixed') return Math.max(0, Number(fixedAmount) || 0);
    if (mode === 'percent_of_basic') return Math.max(0, ((Number(percent) || 0) / 100) * bases.basic);
    if (mode === 'percent_of_gross') return Math.max(0, ((Number(percent) || 0) / 100) * bases.gross);
    return 0;
}


export default function PayrollFormModal({ isOpen, onClose, editId, initial, onSuccess }: Props) {
    const isEdit = Boolean(editId);
    const [form, setForm] = useState<PayrollDoc>(() => ({
        employeeId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        grossSalary: '',
        salaryStructure: {},
        deductions: [],
    } as any));

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [createPayroll, { isLoading: creating }] = useCreatePayrollMutation();
    const [updatePayroll, { isLoading: updating }] = useUpdatePayrollMutation();
    const fmtMoney = (n: number) => `₹ ${Number(n || 0).toFixed(2)}`;
    const { data: employees = [], isLoading: loadingEmployees } = useGetEmployeesQuery({
        page: 1,
        limit: 1000,
        search: ''
    });

    const { data: payrolls } = useGetPayrollsQuery({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    });
    const { data: rulesResp } = useListDeductionRulesQuery();
    const activeRules: DeductionRule[] = (rulesResp?.data || []).filter((r) => r.active);
    const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

    const existingPayrollEmployeeIds = new Set(
        (payrolls?.items ?? []).map((p: any) => p.employeeId?._id)
    );

    // helper: try to find the rule that created a saved deduction
    function findRuleIdForSavedDeduction(d: any, rules: DeductionRule[]) {
        // 1) match by rule name stored in description
        let rule = rules.find(r => r.name?.trim() && r.name.trim() === (d.description || '').trim());
        if (rule) return rule._id;

        // 2) match by type
        rule = rules.find(r => r.type && r.type === d.type);
        if (rule) return rule._id;

        // 3) match by code (if you used code in 'type' previously)
        rule = rules.find(r => r.code && r.code === d.type);
        if (rule) return rule._id;

        return undefined;
    }

    const hydratedRef = React.useRef(false);

    useEffect(() => {
        if (!isOpen) { hydratedRef.current = false; return; }
        if (!(isEdit && initial)) return;
        if (hydratedRef.current) return;            // <-- prevents re-runs

        const enrichedDeds = (initial.deductions ?? []).map((d: any) => {
            const fromRuleId = findRuleIdForSavedDeduction(d, activeRules);
            return {
                type: d.type || '',
                amount: numberOrEmpty(d.amount),
                description: d.description || '',
                _fromRule: fromRuleId,
            };
        });

        setForm({
            ...initial,
            grossSalary: numberOrEmpty(initial.grossSalary),
            salaryStructure: {
                basic: numberOrEmpty(initial.salaryStructure?.basic),
                hra: numberOrEmpty(initial.salaryStructure?.hra),
                allowances: numberOrEmpty(initial.salaryStructure?.allowances),
                bonus: numberOrEmpty(initial.salaryStructure?.bonus),
                overtime: numberOrEmpty(initial.salaryStructure?.overtime),
                otherEarnings: numberOrEmpty(initial.salaryStructure?.otherEarnings),
            },
            deductions: enrichedDeds,
        } as any);


        setSelectedRuleIds(
            enrichedDeds.map((d: any) => d._fromRule).filter(Boolean) as string[]
        );

        setErrors({});
        hydratedRef.current = true;                 // <-- lock it to one-time init
    }, [isOpen, isEdit, initial, activeRules, rulesResp]);

    // helper: shallow compare (type+amount+description) so we don't set state unnecessarily
    function sameDeductions(a: any[] = [], b: any[] = []) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i].type !== b[i].type) return false;
            // compare as numbers (avoid "100" vs 100 diffs)
            if (Number(a[i].amount) !== Number(b[i].amount)) return false;
            if ((a[i].description || '') !== (b[i].description || '')) return false;
        }
        return true;
    }

    // Auto-calculate salary structure when gross salary changes
    useEffect(() => {
        const gross = Number(form.grossSalary) || 0;
        if (gross > 0 && !isEdit) {
            const calculated = calculateSalaryStructure(gross);
            setForm(prev => ({
                ...prev,
                salaryStructure: {
                    ...prev.salaryStructure,
                    basic: String(calculated.basic),
                    hra: String(calculated.hra),
                    allowances: String(calculated.allowances),
                }
            }));
        }
    }, [form.grossSalary, isEdit]);

    // mark rule rows so we can remove them when deselected
    useEffect(() => {
        const bases = getBases(form);

        const chosen = activeRules.filter(r => selectedRuleIds.includes(r._id));


        // build fresh rule deductions (tag each with _fromRule)
        const ruleDeductions = chosen.map((r) => ({
            type: r.type,
            amount: Number(computeAmountForRule(r, bases).toFixed(2)),
            description: r.name,
            _fromRule: r._id,
        }));


        // Add standard deductions (disabled - using custom rules only)
        const standardDeductions: any[] = [];

        // Keep existing manual rows (ones NOT created by rules)
        const manualKeepers = (form.deductions ?? []).filter((d: any) =>
            d && !d._fromRule
        );

        const next = [...standardDeductions, ...ruleDeductions, ...manualKeepers];

        if (!sameDeductions(next, form.deductions as any[])) {
            setForm(prev => ({ ...prev, deductions: next }));
        }

    }, [
        selectedRuleIds,
        activeRules,
        form.grossSalary,
        form.salaryStructure?.basic,
        form.salaryStructure?.hra,
        form.salaryStructure?.allowances,
        form.salaryStructure?.bonus,
        form.salaryStructure?.overtime,
        form.salaryStructure?.otherEarnings,
    ]);

    const handle = (path: string, value: any) => {
        setForm((prev: any) => {
            const copy: any = { ...prev };
            const parts = path.split('.');
            let cur: any = copy;
            for (let i = 0; i < parts.length - 1; i++) {
                cur[parts[i]] = cur[parts[i]] ?? {};
                cur = cur[parts[i]];
            }
            cur[parts[parts.length - 1]] = value;
            return copy;
        });
    };

    // Client-side totals preview (mirrors backend calc)
    const totals = useMemo(() => {
        const s: any = form.salaryStructure || {};

        // Base salary components (Basic + HRA + DA)
        const basic = Number(s.basic) || 0;
        const hra = Number(s.hra) || 0;
        const allowances = Number(s.allowances) || 0;
        const baseSalary = basic + hra + allowances;

        // Additional earnings from salary structure
        const structureBonus = Number(s.bonus) || 0;
        const structureOvertime = Number(s.overtime) || 0;
        const structureOtherEarnings = Number(s.otherEarnings) || 0;

        // Top-level bonus and overtime (if you want to include these as well)
        const topLevelBonus = Number(form.bonus) || 0;
        const topLevelOvertime = Number(form.overtimePay) || 0;

        // Total earnings = base salary + all additional earnings
        const totalEarnings = baseSalary + structureBonus + structureOvertime + structureOtherEarnings + topLevelBonus + topLevelOvertime;

        // Total deductions
        const totalDeductions = (form.deductions ?? []).reduce((acc: number, d: any) => acc + (Number(d.amount) || 0), 0);

        // Net payable = total earnings - total deductions
        const netPayable = Math.max(0, totalEarnings - totalDeductions);

        return {
            earnings: Math.max(0, baseSalary),
            deductions: Math.max(0, totalDeductions),
            net: netPayable,
            // Breakdown for display
            breakdown: {
                basic,
                hra,
                allowances,
                structureBonus,
                structureOvertime,
                structureOtherEarnings,
            }
        };
    }, [
        form.salaryStructure?.basic,
        form.salaryStructure?.hra,
        form.salaryStructure?.allowances,
        form.salaryStructure?.bonus,
        form.salaryStructure?.overtime,
        form.salaryStructure?.otherEarnings,
        form.deductions
    ]);


    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.employeeId) e.employeeId = 'Employee is required';
        if (!form.month || form.month < 1 || form.month > 12) e.month = 'Month 1-12';
        if (!form.year) e.year = 'Year is required';
        if (!form.grossSalary) e.grossSalary = 'Gross salary is required';

        // require these inside salaryStructure
        const reqKeys = ['basic', 'hra', 'allowances'] as const;
        reqKeys.forEach((k) => {
            const v = (form as any)?.salaryStructure?.[k];
            if (v === '' || v === undefined || v === null) {
                e[`salaryStructure.${k}`] = `${k.toUpperCase()} is required`;
            }
        });

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const err = (path: string) => errors[path];
    const hasErr = (path: string) => Boolean(errors[path]);

    const submit = async () => {
        if (!validate()) return;
        const payload: any = { ...form };
        // Coerce numbers to match backend normalizePayload
        ['month', 'year', 'grossSalary', 'bonus', 'overtimePay'].forEach((k) => {
            if ((payload as any)[k] !== undefined && (payload as any)[k] !== '') {
                (payload as any)[k] = Number((payload as any)[k]);
            } else if ((payload as any)[k] === '') {
                delete (payload as any)[k];
            }
        });
        if (payload.salaryStructure) {
            Object.keys(payload.salaryStructure).forEach((k) => {
                const v = (payload.salaryStructure as any)[k];
                if (v === '' || v === undefined) delete (payload.salaryStructure as any)[k];
                else (payload.salaryStructure as any)[k] = Number(v);
            });
            if (Object.keys(payload.salaryStructure).length === 0) delete payload.salaryStructure;
        }
        if (Array.isArray(payload.deductions)) {
            payload.deductions = payload.deductions
                .filter((d: any) => d && (d.type || d.amount))
                .map((d: any) => ({
                    type: d.type?.trim() || 'deduction',
                    amount: Number(d.amount) || 0,
                    description: d.description?.trim() || '',
                }));
        }

        try {
            if (isEdit && editId) await updatePayroll({ id: editId, data: payload }).unwrap();
            else await createPayroll(payload).unwrap();
            onSuccess?.();
            onClose();
        } catch (err: any) {
            setErrors((p) => ({ ...p, submit: err?.data?.error || 'Failed to save payroll' }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-6 mx-auto w-full max-w-5xl bg-white rounded-lg shadow-lg border">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold">{isEdit ? 'Edit Payroll' : 'Create Payroll'}</h2>
                        <p className="text-gray-600">Enter period and gross salary. Structure and deductions auto-calculate.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Row: Employee / Period */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Employee *</label>
                            {isEdit ? (
                                <div className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700">
                                    {initial?.employeeId?.userId?.firstName} {initial?.employeeId?.userId?.lastName}
                                </div>
                            ) : (
                                loadingEmployees ? (
                                    <div className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700">Loading...</div>
                                ) : (
                                    <select
                                        value={form.employeeId || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            handle('employeeId', value);

                                            if (!isEdit) {
                                                const selected = (employees?.data ?? []).find((emp: any) => emp._id === value);
                                                const grossAmount = selected?.salary?.amount;

                                                if (grossAmount) {
                                                    const calculated = calculateSalaryStructure(grossAmount);
                                                    setForm(prev => ({
                                                        ...prev,
                                                        grossSalary: String(grossAmount),
                                                        salaryStructure: {
                                                            basic: String(calculated.basic),
                                                            hra: String(calculated.hra),
                                                            allowances: String(calculated.allowances),
                                                            bonus: '',
                                                            overtime: '',
                                                            otherEarnings: '',
                                                        },
                                                    }));
                                                }
                                            }
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select employee</option>
                                        {(employees.data ?? [])
                                            .filter((emp: any) => !existingPayrollEmployeeIds.has(emp._id)) // 🚀 hide employees with payroll this month
                                            .map((emp: any) => (
                                                <option key={emp._id} value={emp._id}>
                                                    {emp.userId?.firstName} {emp.userId?.lastName}
                                                </option>
                                            ))}
                                    </select>

                                )
                            )}
                            {errors.employeeId && <p className="text-sm text-red-600 mt-1">{errors.employeeId}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1">Month *</label>
                            <input type="text" min={1} max={12}
                                value={(form as any).month}
                                onChange={(e) => handle('month', Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                            {errors.month && <p className="text-sm text-red-600 mt-1">{errors.month}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Year *</label>
                            <input type="text"
                                value={(form as any).year}
                                onChange={(e) => handle('year', Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                            {errors.year && <p className="text-sm text-red-600 mt-1">{errors.year}</p>}
                        </div>
                    </div>

                    {/* Row: Gross Salary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Gross Salary *</label>
                            <input
                                type="text"
                                value={numberOrEmpty((form as any).grossSalary)}
                                disabled={true}
                                onChange={(e) => handle('grossSalary', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed ${hasErr('grossSalary') ? 'border-red-500 focus:ring-red-500' : ''
                                    }`}
                                placeholder="Auto-Filled gross salary"
                            />
                            {err('grossSalary') && <p className="text-sm text-red-600 mt-1">{err('grossSalary')}</p>}
                        </div>
                    </div>

                    {/* Salary Structure */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">
                            Salary Structure
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {['basic', 'hra', 'allowances', 'bonus', 'overtime', 'otherEarnings'].map((k) => {
                                const path = `salaryStructure.${k}`;
                                const isAutoCalculated = ['basic', 'hra', 'allowances'].includes(k);
                                const displayName = k === 'allowances' ? 'DA (Allowances)' :
                                    k === 'otherEarnings' ? 'Other Earnings' :
                                        k.toUpperCase();

                                return (
                                    <div key={k}>
                                        <label className="block text-sm font-semibold mb-1">
                                            {displayName}
                                            {isAutoCalculated && <span className="text-red-500"> *</span>}
                                        </label>
                                        <input
                                            value={numberOrEmpty((form as any).salaryStructure?.[k as any])}
                                            onChange={(e) => handle(path, e.target.value)}
                                            disabled={isAutoCalculated}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${hasErr(path) ? 'border-red-500 focus:ring-red-500' : ''
                                                } ${isAutoCalculated ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
                                            placeholder={isAutoCalculated ? 'Auto-calculated' : `Enter ${k}`}
                                        />
                                        {err(path) && <p className="text-sm text-red-600 mt-1">{err(path)}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Deductions */}
                    {form.employeeId && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold">
                                    Deductions
                                    <span className="text-sm text-blue-600 font-normal ml-2">
                                        (Custom rules only)
                                    </span>
                                </h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRuleIds(activeRules.map(r => r._id))}
                                        className="px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                                    >
                                        Select all rules
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRuleIds([])}
                                        className="px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                                    >
                                        Clear rules
                                    </button>
                                </div>
                            </div>

                            {/* Show available rules info */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                <h4 className="font-medium text-green-800 mb-2">Custom Deduction Rules:</h4>
                                <div className="text-sm text-green-700">
                                    Select from the available deduction rules below. All deductions are managed through your custom rule system.
                                </div>
                            </div>

                            {/* Available active rules to choose */}
                            <div className="border rounded-lg p-3 mb-4">
                                {activeRules.length === 0 ? (
                                    <div className="text-sm text-gray-500">No additional deduction rules available.</div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-2">
                                        {activeRules.filter((r: any) => {
                                            const bases = getBases(form);
                                            if (r.code?.toLowerCase() === "esi" && bases.gross >= 21000) {
                                                return false;
                                            }
                                            return true;
                                        })
                                            .map((r: any) => {
                                                const bases = getBases(form);
                                                const amount = computeAmountForRule(r, bases);
                                                const checked = selectedRuleIds.includes(r._id);

                                                const isSlab = r.is_applicable && Array.isArray(r.tax_slab) && r.tax_slab.length > 0;
                                                let matched: any;
                                                if (isSlab) {
                                                    matched = r.tax_slab.find((s: any) =>
                                                        (s.from == null || bases.gross >= Number(s.from)) &&
                                                        (s.to == null || bases.gross <= Number(s.to))
                                                    );
                                                }

                                                return (
                                                    <label
                                                        key={r._id}
                                                        className="flex items-center justify-between gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4"
                                                                checked={checked}
                                                                onChange={(e) => {
                                                                    setSelectedRuleIds((prev) =>
                                                                        e.target.checked ? [...prev, r._id] : prev.filter(id => id !== r._id)
                                                                    );
                                                                }}
                                                            />
                                                            <div className="font-medium">{r.name}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {isSlab ? (
                                                                    <>
                                                                        <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 mr-1">
                                                                            Slab-based
                                                                        </span>
                                                                        {matched
                                                                            ? `(${matched.from ?? 0} - ${matched.to ?? '∞'} @ ₹${Number(matched.rate) || 0} fixed)`
                                                                            : `(no matching slab for ₹${bases.gross})`}
                                                                    </>
                                                                ) : r.compute.mode === 'fixed' ? (
                                                                    `Fixed ₹${Number(r.compute.fixedAmount) || 0}`
                                                                ) : r.compute.mode === 'percent_of_basic' ? (
                                                                    `${r.compute.percent ?? 0}% of Basic`
                                                                ) : (
                                                                    `${r.compute.percent ?? 0}% of Gross`
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-semibold">₹{Number(amount || 0).toFixed(2)}</div>
                                                    </label>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>

                            {/* Current Deductions Summary */}
                            {form.deductions && form.deductions.length > 0 && (
                                <div className="border rounded-lg p-3">
                                    <h4 className="font-medium mb-2">Current Deductions:</h4>
                                    <div className="space-y-2">
                                        {form.deductions.map((d: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded text-xs ${d._fromRule
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {d._fromRule ? 'Rule' : 'Manual'}
                                                    </span>
                                                    <span className="font-medium">{d.description || d.type}</span>
                                                </div>
                                                <span className="font-semibold">₹{Number(d.amount || 0).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Totals Preview */}
                    <div className="p-4 rounded-lg border bg-blue-50">
                        <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                            <Calculator className="w-4 h-4" />
                            Payroll Summary
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="text-gray-600">Gross Earnings</div>
                                <div className="text-xl font-semibold text-green-600">₹ {totals.earnings.toFixed(2)}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Basic: ₹{Number(form.salaryStructure?.basic || 0).toFixed(2)}<br />
                                    HRA: ₹{Number(form.salaryStructure?.hra || 0).toFixed(2)}<br />
                                    DA: ₹{Number(form.salaryStructure?.allowances || 0).toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-600">Total Deductions</div>
                                <div className="text-xl font-semibold text-red-600">₹ {totals.deductions.toFixed(2)}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {form.deductions?.length || 0} deduction(s) applied
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-600">Net Salary</div>
                                <div className="text-2xl font-bold text-blue-600">₹ {totals.net.toFixed(2)}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Take-home amount
                                </div>
                            </div>
                        </div>

                        {/* Employer Contributions Info - removed since using custom rules */}
                    </div>

                    {errors.submit && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{errors.submit}</div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t">
                    <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 hover:bg-gray-50">Cancel</button>
                    <button onClick={submit} disabled={creating || updating}
                        className="flex-1 bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700 disabled:opacity-50">
                        {creating || updating ? 'Saving…' : isEdit ? 'Update Payroll' : 'Create Payroll'}
                    </button>
                </div>
            </div>
        </div>
    );
}