import React, { useEffect, useMemo, useState } from 'react';
import { X, Calculator } from 'lucide-react';
import {
    useCreatePayrollMutation,
    useUpdatePayrollMutation,
    PayrollDoc,
} from '../../services/payrollServices';
import { useGetEmployeesQuery } from '../../services/employeeServices';
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
    compute: { mode: RuleMode; fixedAmount?: number; percent?: number };
};

const numberOrEmpty = (v: any) => (v === 0 || v ? String(v) : '');


function getBases(form: any) {
    const s = form?.salaryStructure || {};
    const baseBasic = Number(form?.basicSalary) || 0;
    const basic = Number(s.basic ?? baseBasic) || 0;
    const hra = Number(s.hra) || 0;
    const allowances = Number(s.allowances) || 0;
    const sBonus = Number(s.bonus) || 0;
    const sOT = Number(s.overtime) || 0;
    const other = Number(s.otherEarnings) || 0;
    const tBonus = Number(form?.bonus) || 0;
    const tOT = Number(form?.overtimePay) || 0;
    const gross = basic + hra + allowances + sBonus + sOT + other + tBonus + tOT;
    return { basic, gross };
}

function computeAmountForRule(rule: DeductionRule, bases: { basic: number; gross: number }) {
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
        basicSalary: '',
        bonus: '',
        overtimePay: '',
        salaryStructure: {},
        deductions: [],
    } as any));

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [createPayroll, { isLoading: creating }] = useCreatePayrollMutation();
    const [updatePayroll, { isLoading: updating }] = useUpdatePayrollMutation();
    const { data: employees = [], isLoading: loadingEmployees } = useGetEmployeesQuery({
        page: 1,
        limit: 1000,
        search: ''
    });
    const { data: rulesResp } = useListDeductionRulesQuery({ activeOnly: true });
    const activeRules: DeductionRule[] = (rulesResp?.data || []).filter((r: any) => r.active);

    const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);


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

        // (optional) if you need rules to be present first:
        // if (!rulesResp) return;

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
            basicSalary: numberOrEmpty(initial.basicSalary),
            bonus: numberOrEmpty(initial.bonus),
            overtimePay: numberOrEmpty(initial.overtimePay),
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

        // if you DON'T support manual rows, just use ruleDeductions:
        // const next = ruleDeductions;

        // if you DO want to keep manual rows, keep only ones NOT created by rules:
        const manualKeepers = (form.deductions ?? []).filter((d: any) => d && !d._fromRule);
        const next = [...ruleDeductions, ...manualKeepers];

        if (!sameDeductions(next, form.deductions as any[])) {
            setForm(prev => ({ ...prev, deductions: next }));
        }

    }, [
        selectedRuleIds,
        activeRules,
        form.basicSalary,
        form.bonus, form.overtimePay,
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
        const baseBasic = Number(form.basicSalary) || 0;
        const basic = Number(s.basic ?? baseBasic) || 0;
        const hra = Number(s.hra) || 0;
        const allowances = Number(s.allowances) || 0;
        const sBonus = Number(s.bonus) || 0;
        const sOvertime = Number(s.overtime) || 0;
        const otherEarnings = Number(s.otherEarnings) || 0;
        const tBonus = Number(form.bonus) || 0;
        const tOT = Number(form.overtimePay) || 0;

        const earnings = basic + hra + allowances + sBonus + sOvertime + otherEarnings + tBonus + tOT;
        const ded = (form.deductions ?? []).reduce((acc: number, d: any) => acc + (Number(d.amount) || 0), 0);
        const gross = Math.max(0, earnings);
        const net = Math.max(0, gross - Math.max(0, ded));
        return { earnings: gross, deductions: Math.max(0, ded), net };
    }, [form]);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.employeeId) e.employeeId = 'Employee is required';
        if (!form.month || form.month < 1 || form.month > 12) e.month = 'Month 1-12';
        if (!form.year) e.year = 'Year is required';

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
        ['month', 'year', 'basicSalary', 'bonus', 'overtimePay'].forEach((k) => {
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
                        <p className="text-gray-600">Enter period, earnings, and deductions. Totals preview updates live.</p>
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
                                    <div className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700" > Loading...</div>
                                ) : (
                                    <select
                                        value={form.employeeId || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            handle('employeeId', value);

                                            if (!isEdit) {
                                                const selected = (employees?.data ?? []).find((emp: any) => emp._id === value);
                                                const amt = selected?.salary?.amount;

                                                setForm(prev => ({
                                                    ...prev,
                                                    basicSalary: amt != null ? String(amt) : '',
                                                    salaryStructure: {
                                                        ...(prev.salaryStructure ?? {}),
                                                        basic: amt != null ? String(amt) : ''
                                                    },
                                                }));
                                            }
                                        }}


                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select employee</option>
                                        {(employees.data ?? []).map((emp: any) => (
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
                            <input type="number" min={1} max={12}
                                value={(form as any).month}
                                onChange={(e) => handle('month', Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                            {errors.month && <p className="text-sm text-red-600 mt-1">{errors.month}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Year *</label>
                            <input type="number"
                                value={(form as any).year}
                                onChange={(e) => handle('year', Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                            {errors.year && <p className="text-sm text-red-600 mt-1">{errors.year}</p>}
                        </div>
                    </div>

                    {/* Row: Base + Top-level */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Basic Salary</label>
                            <input disabled value={numberOrEmpty((form as any).basicSalary)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-100 text-gray-600 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Bonus (Top-level)</label>
                            <input value={numberOrEmpty((form as any).bonus)} onChange={(e) => handle('bonus', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Overtime Pay (Top-level)</label>
                            <input value={numberOrEmpty((form as any).overtimePay)} onChange={(e) => handle('overtimePay', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>

                    {/* Salary Structure */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Salary Structure</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {['basic', 'hra', 'allowances', 'bonus', 'overtime', 'otherEarnings'].map((k) => {
                                const path = `salaryStructure.${k}`;
                                const isBasic = k === 'basic';
                                return (
                                    <div key={k}>
                                        <label className="block text-sm font-semibold mb-1">
                                            {k === 'otherEarnings' ? 'Other Earnings' : k.toUpperCase()}
                                        </label>

                                        <input
                                            value={numberOrEmpty((form as any).salaryStructure?.[k as any])}
                                            onChange={(e) => handle(path, e.target.value)}
                                            disabled={isBasic}   // <<<<<< LOCK BASIC HERE
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${hasErr(path) ? 'border-red-500 focus:ring-red-500' : ''
                                                } ${isBasic ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
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
                                <h3 className="text-lg font-semibold">Deductions</h3>
                                <div className="flex items-center gap-3">
                                    {/* Optional: Select All / None */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRuleIds(activeRules.map(r => r._id))}
                                        className="px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                                    >
                                        Select all
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRuleIds([])}
                                        className="px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Available active rules to choose */}

                            <div className="border rounded-lg p-3 mb-4">
                                {activeRules.length === 0 && form.employeeId ? (
                                    <div className="text-sm text-gray-500">No active deduction rules available.</div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-2">
                                        {activeRules.map((r) => {
                                            const bases = getBases(form);
                                            const amount = computeAmountForRule(r, bases);
                                            const checked = selectedRuleIds.includes(r._id);
                                            return (
                                                <label key={r._id} className="flex items-center justify-between gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
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
                                                            {r.compute.mode === 'fixed'
                                                                ? 'Fixed'
                                                                : r.compute.mode === 'percent_of_basic'
                                                                    ? `${r.compute.percent}% of Basic`
                                                                    : `${r.compute.percent}% of Gross`}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-semibold">{(Number(amount || 0))}</div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Totals Preview */}
                    <div className="p-4 rounded-lg border bg-blue-50">
                        <div className="flex items-center gap-2 text-blue-800 font-medium mb-2"><Calculator className="w-4 h-4" /> Totals (Preview)</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="text-gray-600">Gross / Earnings</div>
                                <div className="text-xl font-semibold">₹ {totals.earnings.toFixed(2)}</div>
                            </div>
                            <div>
                                <div className="text-gray-600">Total Deductions</div>
                                <div className="text-xl font-semibold">₹ {totals.deductions.toFixed(2)}</div>
                            </div>
                            <div>
                                <div className="text-gray-600">Net Salary</div>
                                <div className="text-xl font-semibold">₹ {totals.net.toFixed(2)}</div>
                            </div>
                        </div>
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
        </div >
    );
}