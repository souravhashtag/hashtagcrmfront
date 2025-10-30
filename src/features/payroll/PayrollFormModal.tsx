import React, { useEffect, useMemo, useState } from 'react';
import { X, Calculator } from 'lucide-react';
import {
    useCreatePayrollMutation,
    useUpdatePayrollMutation,
    PayrollDoc,
    useGetPayrollsQuery,
} from '../../services/payrollServices';
import { useGetEmployeesQuery } from '../../services/employeeServices';
import { useListDeductionRulesQuery } from '../../services/salaryDeductionRuleServices';
import { useGetAttendanceForallEmployeeQuery } from '../../services/AttendanceRedxService';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    initial?: Partial<PayrollDoc> | null;
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

const months = [
    { name: 'January', value: 1 },
    { name: 'February', value: 2 },
    { name: 'March', value: 3 },
    { name: 'April', value: 4 },
    { name: 'May', value: 5 },
    { name: 'June', value: 6 },
    { name: 'July', value: 7 },
    { name: 'August', value: 8 },
    { name: 'September', value: 9 },
    { name: 'October', value: 10 },
    { name: 'November', value: 11 },
    { name: 'December', value: 12 },
];

const numberOrEmpty = (v: any) => (v === 0 || v ? String(v) : '');

function calculateSalaryStructure(grossSalary: number) {
    const gross = Number(grossSalary) || 0;
    const basic = (gross * 50) / 100;
    const hra = (gross * 30) / 100;
    const da = gross - basic - hra;
    return { basic, hra, allowances: da };
}

function getBases(form: any) {
    const s = form?.salaryStructure || {};
    const baseBasic = Number(form?.grossSalary) || 0;
    const basic = Number(s.basic) || 0;
    const gross = baseBasic;
    return { basic, gross };
}

function computeAmountForRule(rule: DeductionRule, bases: { basic: number; gross: number }) {
    if (rule.is_applicable && Array.isArray(rule.tax_slab) && rule.tax_slab.length > 0) {
        const base = bases.gross;
        const matched = rule.tax_slab.find((s: any) =>
            (s.from == null || base >= Number(s.from)) &&
            (s.to == null || base <= Number(s.to))
        );
        if (matched) {
            const amt = Number(matched.rate) || 0;
            return Math.max(0, amt);
        }
        return 0;
    }

    const { mode, fixedAmount = 0, percent = 0 } = rule.compute || {};
    if (mode === 'fixed') return Math.max(0, Number(fixedAmount) || 0);
    if (mode === 'percent_of_basic') return Math.max(0, ((Number(percent) || 0) / 100) * bases.basic);
    if (mode === 'percent_of_gross') return Math.max(0, ((Number(percent) || 0) / 100) * bases.gross);
    return 0;
}

export default function PayrollFormModal({ isOpen, onClose, editId, initial, onSuccess }: Props) {
    const isEdit = Boolean(editId);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const enabledMonths = [currentMonth, previousMonth];
    const [form, setForm] = useState<PayrollDoc>(() => ({
        employeeId: '',
        month: isEdit ? (initial?.month || currentMonth) : currentMonth,
        year: new Date().getFullYear(),
        grossSalary: '',
        salaryStructure: {},
        deductions: [],
    } as any));
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const startDate = new Date(form.year, form.month - 1, 1);
    const endDate = new Date(form.year, form.month, 0);

    // Fetch employees and extract userId
    const { data: employees = [], isLoading: loadingEmployees } = useGetEmployeesQuery({
        page: 1,
        limit: 1000,
        search: ''
    });
    const selectedEmployee = employees?.data?.find((emp: any) => emp._id === form.employeeId);
    const userId = selectedEmployee?.userId?._id;

    // Fetch attendance data
    const {
        data: attendanceResponse,
        isLoading: attendanceLoading
    } = useGetAttendanceForallEmployeeQuery({
        employeeId: userId,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
    }, { skip: !userId || !form.month || !form.year });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [createPayroll, { isLoading: creating }] = useCreatePayrollMutation();
    const [updatePayroll, { isLoading: updating }] = useUpdatePayrollMutation();
    const { data: payrolls } = useGetPayrollsQuery({
        month: form.month,
        year: form.year,
    });
    const { data: rulesResp } = useListDeductionRulesQuery();
    const activeRules: DeductionRule[] = (rulesResp?.data || []).filter((r) => r.active);
    const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

    const existingPayrollEmployeeIds = new Set(
        (payrolls?.items ?? []).map((p: any) => p.employeeId?._id)
    );

    function findRuleIdForSavedDeduction(d: any, rules: DeductionRule[]) {
        let rule = rules.find(r => r.name?.trim() && r.name.trim() === (d.description || '').trim());
        if (rule) return rule._id;
        rule = rules.find(r => r.type && r.type === d.type);
        if (rule) return rule._id;
        rule = rules.find(r => r.code && r.code === d.type);
        if (rule) return rule._id;
        return undefined;
    }

    const hydratedRef = React.useRef(false);

    useEffect(() => {
        if (!isOpen) { hydratedRef.current = false; return; }
        if (!(isEdit && initial)) return;
        if (hydratedRef.current) return;

        const enrichedDeds = (initial.deductions ?? []).map((d: any) => {
            const fromRuleId = findRuleIdForSavedDeduction(d, activeRules);
            const fromAttendance = !fromRuleId && (d.type === 'LOP' || (d.description || '').includes('Loss of Pay'));
            return {
                type: d.type || '',
                amount: numberOrEmpty(d.amount),
                description: d.description || '',
                _fromRule: fromRuleId,
                _fromAttendance: fromAttendance,
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
            enrichedDeds.filter((d: any) => d._fromRule).map((d: any) => d._fromRule) as string[]
        );

        setErrors({});
        hydratedRef.current = true;

        // NEW: trigger deduction recalculation after hydration
        setTimeout(() => {
            setForm(prev => ({ ...prev })); // This will trigger the deduction recalculation useEffect
        }, 0);
    }, [isOpen, isEdit, initial, activeRules, rulesResp]);

    function sameDeductions(a: any[] = [], b: any[] = []) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i].type !== b[i].type) return false;
            if (Number(a[i].amount) !== Number(b[i].amount)) return false;
            if ((a[i].description || '') !== (b[i].description || '')) return false;
        }
        return true;
    }

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

    // Calculate total days in the selected month
    const totalDays = useMemo(() => {
        if (form.year && form.month) {
            return new Date(form.year, form.month, 0).getDate();
        }
        return 0;
    }, [form.year, form.month]);

    // Calculate attended days by checking valid date and clockIn
    const attendedDays = useMemo(() => {
        if (!attendanceResponse?.data?.[0]?.attendance) return 0;
        const attendance = attendanceResponse.data[0].attendance;
        const start = new Date(form.year, form.month - 1, 1);
        const end = new Date(form.year, form.month, 0);

        return Object.keys(attendance).reduce((count, dateKey) => {
            const record = attendance[dateKey];
            const recordDate = record.date ? new Date(record.date) : null;
            // Check if the record is within the selected month and has valid date and clockIn
            if (
                recordDate &&
                record.clockIn &&
                recordDate >= start &&
                recordDate <= end
            ) {
                return count + 1;
            }
            return count;
        }, 0);
    }, [attendanceResponse, form.year, form.month]);

    // Calculate absent days
    const absentDays = totalDays ? totalDays - attendedDays : 0;

    useEffect(() => {
        const bases = getBases(form);
        const chosen = activeRules.filter(r => selectedRuleIds.includes(r._id));

        // Calculate rule-based deductions
        const ruleDeductions = chosen.map((r) => {
            let amount = computeAmountForRule(r, bases);
            if (r.code?.toLowerCase() === "esi" && bases.gross >= 21000) {
                amount = 0;
            }
            return {
                type: r.type,
                amount: Number(amount.toFixed(2)),
                description: r.name,
                _fromRule: r._id,
            };
        });

        // Determine if attendance data is available to compute LOP.
        const attendanceAvailable = !attendanceLoading && !!attendanceResponse && !!userId && totalDays > 0;

        // Calculate LOP deduction only when attendance data is available.
        let lopDeduction: any[] = [];
        if (attendanceAvailable) {
            const perDay = bases.gross / totalDays;
            const lopAmount = absentDays * perDay;
            if (lopAmount > 0) {
                lopDeduction = [{
                    type: 'LOP',
                    amount: Number(lopAmount.toFixed(2)),
                    description: `Loss of Pay for ${absentDays} absent day${absentDays !== 1 ? 's' : ''}`,
                    _fromAttendance: true,
                }];
            }
        }

        // Preserve manual deductions.
        // If attendance is available we will recompute attendance-driven deductions, so exclude _fromAttendance.
        // If attendance is NOT available (e.g., during edit before user/attendance loaded), keep existing _fromAttendance so LOP remains visible.
        const manualKeepers = (form.deductions ?? []).filter((d: any) =>
            d && !d._fromRule && (attendanceAvailable ? !d._fromAttendance : true)
        );

        // Combine all deductions
        const next = [...ruleDeductions, ...lopDeduction, ...manualKeepers];

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
        attendanceResponse,
        attendanceLoading,
        totalDays,
        attendedDays,
        absentDays,
        userId,
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

    const totals = useMemo(() => {
        const s: any = form.salaryStructure || {};
        const basic = Number(s.basic) || 0;
        const hra = Number(s.hra) || 0;
        const allowances = Number(s.allowances) || 0;
        const baseSalary = basic + hra + allowances;
        const structureBonus = Number(s.bonus) || 0;
        const structureOvertime = Number(s.overtime) || 0;
        const structureOtherEarnings = Number(s.otherEarnings) || 0;
        const topLevelBonus = Number(form.bonus) || 0;
        const topLevelOvertime = Number(form.overtimePay) || 0;
        const totalEarnings = baseSalary + structureBonus + structureOvertime + structureOtherEarnings + topLevelBonus + topLevelOvertime;
        const totalDeductions = (form.deductions ?? []).reduce((acc: number, d: any) => acc + (Number(d.amount) || 0), 0);
        const netPayable = Math.max(0, totalEarnings - totalDeductions);

        return {
            earnings: Math.max(0, baseSalary),
            deductions: Math.max(0, totalDeductions),
            net: netPayable,
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

    const disabledClass = 'bg-gray-100 text-gray-600 cursor-not-allowed';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-6 mx-auto w-full max-w-5xl bg-white rounded-lg shadow-lg border">
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold">{isEdit ? 'Edit Payroll' : 'Create Payroll'}</h2>
                        <p className="text-gray-600">Enter period and gross salary. Structure and deductions auto-calculate.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            .filter((emp: any) => !existingPayrollEmployeeIds.has(emp._id))
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
                            <select
                                value={form.month || ''}
                                onChange={(e) => {
                                    const newMonth = Number(e.target.value);
                                    let newYear = form.year;
                                    if (newMonth === previousMonth && currentMonth === 1) {
                                        newYear = previousYear;
                                    } else {
                                        newYear = currentYear;
                                    }
                                    handle('month', newMonth);
                                    if (newYear !== form.year) {
                                        handle('year', newYear);
                                    }
                                }}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${hasErr('month') ? 'border-red-500 focus:ring-red-500' : ''}`}
                            >
                                <option value="">Select month</option>
                                {enabledMonths.map((monthValue) => {
                                    const month = months.find(m => m.value === monthValue);
                                    if (!month) return null;
                                    return (
                                        <option key={month.value} value={month.value}>
                                            {month.name}
                                        </option>
                                    );
                                })}
                            </select>
                            {errors.month && <p className="text-sm text-red-600 mt-1">{errors.month}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Year *</label>
                            <input
                                type="number"
                                value={(form as any).year}
                                onChange={(e) => handle('year', Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                min="1900"
                                max="2100"
                            />
                            {errors.year && <p className="text-sm text-red-600 mt-1">{errors.year}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Gross Salary *</label>
                            <input
                                type="text"
                                value={numberOrEmpty((form as any).grossSalary)}
                                disabled={true}
                                onChange={(e) => handle('grossSalary', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed ${hasErr('grossSalary') ? 'border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="Auto-Filled gross salary"
                            />
                            {err('grossSalary') && <p className="text-sm text-red-600 mt-1">{err('grossSalary')}</p>}
                        </div>
                    </div>

                    {userId && form.month && form.year && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Attendance Summary for {form.month}/{form.year}</h3>
                            {attendanceLoading ? (
                                <p className="text-gray-600">Loading attendance data...</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600">Total Days</div>
                                        <div className="text-xl font-semibold">{totalDays}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">Attended</div>
                                        <div className="text-xl font-semibold text-green-600">{attendedDays}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">Absent</div>
                                        <div className="text-xl font-semibold text-red-600">{absentDays}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Salary Structure</h3>
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
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${hasErr(path) ? 'border-red-500 focus:ring-red-500' : ''} ${isAutoCalculated ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
                                            placeholder={isAutoCalculated ? 'Auto-calculated' : `Enter ${k}`}
                                        />
                                        {err(path) && <p className="text-sm text-red-600 mt-1">{err(path)}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {form.employeeId && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold">
                                    Deductions
                                    <span className="text-sm text-blue-600 font-normal ml-2">
                                        (Custom rules and LOP)
                                    </span>
                                </h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const bases = getBases(form);
                                            const selectable = activeRules.filter(r => {
                                                let amount = computeAmountForRule(r, bases);
                                                if (r.code?.toLowerCase() === "esi" && bases.gross >= 21000) {
                                                    amount = 0;
                                                }
                                                return amount > 0;
                                            });
                                            setSelectedRuleIds(selectable.map(r => r._id));
                                        }}
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
                                            if (r.code?.toLowerCase() === "ptax") {
                                                const amount = computeAmountForRule(r, bases);
                                                if (amount === 0) return false;
                                            }
                                            return true;
                                        }).map((r: any) => {
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

                            {form.deductions && form.deductions.length > 0 && (
                                <div className="border rounded-lg p-3">
                                    <h4 className="font-medium mb-2">Current Deductions:</h4>
                                    <div className="space-y-2">
                                        {form.deductions.map((d: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded text-xs ${d._fromRule
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : d._fromAttendance
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {d._fromRule ? 'Rule' : d._fromAttendance ? 'LOP' : 'Manual'}
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
                    </div>

                    {errors.submit && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{errors.submit}</div>
                    )}
                </div>

                <div className="flex gap-3 p-6 border-t">
                    <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 hover:bg-gray-50">Cancel</button>
                    <button
                        onClick={submit}
                        disabled={creating || updating || attendanceLoading}
                        className="flex-1 bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {creating || updating ? 'Saving…' : isEdit ? 'Update Payroll' : 'Create Payroll'}
                    </button>
                </div>
            </div>
        </div>
    );
}