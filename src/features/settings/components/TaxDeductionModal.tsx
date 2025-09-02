import React, { useEffect, useMemo, useState } from 'react';
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import {
    useCreateDeductionRuleMutation,
    useUpsertPercentRuleMutation,
    useUpdatePercentRuleByIdMutation,
    useDeleteDeductionRuleMutation,
} from '../../../services/salaryDeductionRuleServices';

type RuleModeUI = 'fixed' | 'percent_of_basic' | 'percent_of_gross';
type Slab = { from?: number; to?: number; rate?: number };

type Props = {
    isOpen: boolean;
    onClose: () => void;
    editingRule?: {
        _id?: string;
        name: string;
        code: string;
        active: boolean;
        compute?: { mode: RuleModeUI; fixedAmount?: number; percent?: number };
        tax_slab?: Slab[];
        is_applicable?: boolean;
    } | null;
};

const emptyForm = {
    is_applicable: true,
    name: '',
    code: '',
    active: true,
    compute: {
        mode: 'fixed' as RuleModeUI,
        fixedAmount: undefined as number | undefined,
        percent: undefined as number | undefined,
    },
    tax_slab: [] as Slab[],
};

export default function TaxDeductionModal({ isOpen, onClose, editingRule }: Props) {
    const [form, setForm] = useState(emptyForm);

    // RTK Query hooks aligned to allowed routes
    const [createRule, { isLoading: creating }] = useCreateDeductionRuleMutation();
    const [upsertPercent, { isLoading: upsertingPercent }] = useUpsertPercentRuleMutation();
    const [updatePercentById, { isLoading: updatingPercent }] = useUpdatePercentRuleByIdMutation();
    const [deleteRule, { isLoading: deleting }] = useDeleteDeductionRuleMutation();

    const isEditing = Boolean(editingRule?._id);
    const isSaving = creating || upsertingPercent || updatingPercent || deleting;
    const slabOnly = form.is_applicable === true;


    useEffect(() => {
        if (!editingRule) {
            setForm(emptyForm);
            return;
        }

        const mode: RuleModeUI = editingRule.compute?.mode ?? 'fixed';
        const isPercentOfGross =
            editingRule.compute?.mode === 'percent_of_gross' &&
            typeof editingRule.compute?.percent === 'number';

        // ✅ Prefer server value; fallback to your old inference
        const initialIsApplicable =
            typeof editingRule.is_applicable === 'boolean'
                ? editingRule.is_applicable
                : !isPercentOfGross;

        setForm({
            is_applicable: initialIsApplicable,
            name: editingRule.name ?? '',
            code: editingRule.code ?? '',
            active: editingRule.active ?? true,
            compute: {
                mode,
                fixedAmount: mode === 'fixed' ? (editingRule.compute?.fixedAmount ?? 0) : undefined,
                percent: mode !== 'fixed' ? (editingRule.compute?.percent ?? 0) : undefined,
            },
            // ✅ This now comes through correctly
            tax_slab: editingRule.tax_slab ?? [],
        });
    }, [editingRule]);





    const canSubmit = useMemo(() => {
        if (!form.name.trim() || !form.code.trim()) return false;
        if (form.is_applicable) return true; // slab-only: no calc fields required
        if (form.compute.mode === 'fixed') {
            return form.compute.fixedAmount !== undefined && form.compute.fixedAmount >= 0;
        }
        return form.compute.percent !== undefined && form.compute.percent >= 0 && form.compute.percent <= 100;
    }, [form]);


    const set = (key: string, value: any) => {
        setForm((prev) => {
            const next: any = { ...prev };
            if (key.startsWith('compute.')) {
                const [, sub] = key.split('.');
                next.compute = { ...prev.compute, [sub]: value };
            } else {
                (next as any)[key] = value;
            }
            return next;
        });
    };

    const onChangeMode = (mode: RuleModeUI) => {
        setForm((prev: any) => ({
            ...prev,
            compute: {
                mode,
                fixedAmount: mode === 'fixed' ? (prev.compute.fixedAmount ?? 0) : undefined,
                percent: mode !== 'fixed' ? (prev.compute.percent ?? 0) : undefined,
            },
        }));
    };

    const addSlab = () => setForm((p) => ({ ...p, tax_slab: [...p.tax_slab, { from: 0, to: 0, rate: 0 }] }));
    const updateSlab = (idx: number, patch: Partial<Slab>) =>
        setForm((p) => {
            const arr = [...p.tax_slab];
            arr[idx] = { ...arr[idx], ...patch };
            return { ...p, tax_slab: arr };
        });
    const removeSlab = (idx: number) =>
        setForm((p) => {
            const arr = [...p.tax_slab];
            arr.splice(idx, 1);
            return { ...p, tax_slab: arr };
        });

    const handleSave = async () => {
        if (!canSubmit) return;

        const payloadBase = {
            name: form.name.trim(),
            code: form.code.trim().toLowerCase(),
            is_applicable: !!form.is_applicable,
            active: !!form.active,
            tax_slab: form.tax_slab,
        };

        try {
            if (isEditing && editingRule?._id) {
                if (slabOnly) {
                    // use percent route with percent=0; slabs carry the logic
                    await updatePercentById({
                        id: editingRule._id,
                        percent: 0,
                        ...payloadBase,
                    }).unwrap();
                } else if (form.compute.mode !== 'fixed') {
                    await updatePercentById({
                        id: editingRule._id,
                        percent: Number(form.compute.percent || 0),
                        ...payloadBase,
                    }).unwrap();
                } else {
                    // no /:id/fixed; fallback: delete then create
                    await deleteRule(editingRule._id).unwrap();
                    await createRule({
                        code: payloadBase.code,
                        name: payloadBase.name,
                        calculation_mode: 'fixed',
                        amount: Number(form.compute.fixedAmount || 0),
                        is_applicable: payloadBase.is_applicable,
                        active: payloadBase.active,
                        tax_slab: payloadBase.tax_slab,
                    }).unwrap();
                }
            } else {
                // CREATE
                if (slabOnly) {
                    await upsertPercent({
                        code: payloadBase.code,
                        name: payloadBase.name,
                        percent: 0,
                        is_applicable: payloadBase.is_applicable,
                        active: payloadBase.active,
                        tax_slab: payloadBase.tax_slab,
                    }).unwrap();
                } else if (form.compute.mode !== 'fixed') {
                    await upsertPercent({
                        code: payloadBase.code,
                        name: payloadBase.name,
                        percent: Number(form.compute.percent || 0),
                        is_applicable: payloadBase.is_applicable,
                        active: payloadBase.active,
                        tax_slab: payloadBase.tax_slab,
                    }).unwrap();
                } else {
                    await createRule({
                        code: payloadBase.code,
                        name: payloadBase.name,
                        calculation_mode: 'fixed',
                        amount: Number(form.compute.fixedAmount || 0),
                        is_applicable: payloadBase.is_applicable,
                        active: payloadBase.active,
                        tax_slab: payloadBase.tax_slab,
                    }).unwrap();
                }
            }

            onClose();
        } catch (e: any) {
            alert(e?.data?.error || e?.message || 'Failed to save');
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-[#129990] relative">
                    <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {isEditing ? 'Edit Tax Deduction' : 'Add New Tax Deduction'}
                    </h3>
                    <p className="text-sm text-teal-100 mt-1">
                        {isEditing ? 'Update tax deduction details' : 'Create a new tax deduction rule for payroll'}
                    </p>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="text-white hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed absolute right-2 top-2 m-2"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Applicable With Salary Slab? *
                            </label>
                            <select
                                value={form.is_applicable ? 'yes' : 'no'}
                                onChange={(e) => set('is_applicable', e.target.value === 'yes')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                            >
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Deduction Name *
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => set('name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                placeholder="e.g., Income Tax"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Deduction Code *
                            </label>
                            <input
                                type="text"
                                value={form.code.toUpperCase()}
                                onChange={(e) => set('code', e.target.value.toUpperCase().replace(/\s+/g, ''))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                placeholder="e.g., IT"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={form.active ? 'active' : 'inactive'}
                                onChange={(e) => set('active', e.target.value === 'active')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Calculation Method */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        {/* Calculation Method (hidden when slab-only) */}
                        {!slabOnly && (
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Calculation Method</h4>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Calculation Mode *
                                    </label>
                                    <select
                                        value={form.compute.mode}
                                        onChange={(e) => onChangeMode(e.target.value as RuleModeUI)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                    >
                                        <option value="fixed">Fixed Amount</option>
                                        <option value="percent_of_basic">Percentage</option>
                                    </select>
                                </div>

                                {form.compute.mode === 'fixed' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fixed Amount (₹) *
                                        </label>
                                        <input
                                            type="text"
                                            min={0}
                                            step="0.01"
                                            value={form.compute.fixedAmount ?? ''}
                                            onChange={(e) =>
                                                set('compute.fixedAmount', e.target.value === '' ? undefined : Number(e.target.value))
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                )}

                                {form.compute.mode !== 'fixed' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Percentage (%) *
                                        </label>
                                        <input
                                            type="text"
                                            min={0}
                                            max={100}
                                            step="0.01"
                                            value={form.compute.percent ?? ''}
                                            onChange={(e) =>
                                                set('compute.percent', e.target.value === '' ? undefined : Number(e.target.value))
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        )}


                        {/* Optional: Tax Slabs (saved to tax_slab array; your backend already accepts it) */}
                        {/* Tax Slabs (always visible; when slab-only this is the only section shown) */}
                        {slabOnly && (
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-gray-700">
                                        Tax Slabs {slabOnly && '(required)'}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={addSlab}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#129990] border border-[#129990] rounded-md hover:bg-teal-50"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Slab
                                    </button>
                                </div>

                                {form.tax_slab.length === 0 ? (
                                    <p className="text-xs text-gray-500">No slabs added.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {form.tax_slab.map((slab, index) => (
                                            <div
                                                key={index}
                                                className="grid grid-cols-4 gap-2 items-center p-3 border rounded-md bg-white"
                                            >
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        From
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="0"
                                                        value={slab.from ?? ''}
                                                        onChange={(e) =>
                                                            updateSlab(index, { from: Number(e.target.value || 0) })
                                                        }
                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        To
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="0"
                                                        value={slab.to ?? ''}
                                                        onChange={(e) =>
                                                            updateSlab(index, { to: Number(e.target.value || 0) })
                                                        }
                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Rate ₹
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="0"
                                                        value={slab.rate ?? ''}
                                                        onChange={(e) =>
                                                            updateSlab(index, { rate: Number(e.target.value || 0) })
                                                        }
                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                    />
                                                </div>
                                                <div className="text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSlab(index)}
                                                        className="p-1 text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={!canSubmit || isSaving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isEditing ? 'Update Tax Deduction' : 'Create Tax Deduction'}
                    </button>
                </div>
            </div>
        </div>
    );
}
