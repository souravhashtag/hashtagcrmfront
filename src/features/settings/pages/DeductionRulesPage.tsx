import React, { useMemo, useState } from 'react';
import { Plus, Edit3, Trash2, RefreshCw, Loader2, Search } from 'lucide-react';
import TaxDeductionModal from '../components/TaxDeductionModal';
import {
    useListDeductionRulesQuery,
    useDeleteDeductionRuleMutation,
} from '../../../services/salaryDeductionRuleServices';

// If you exported the UI type from the service, import it; otherwise infer.
type RuleModeUI = 'fixed' | 'percent_of_basic' | 'percent_of_gross';
type UICompute = { mode: RuleModeUI; fixedAmount?: number; percent?: number };
type UIDeductionRule = {
    _id: string;
    name: string;
    code: string;
    type: string;
    active: boolean;
    is_applicable: boolean;
    tax_slab: any[];
    compute: UICompute;
};

const DeductionRulesPage: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<UIDeductionRule | null>(null);

    const [search, setSearch] = useState('');
    const [activeOnly, setActiveOnly] = useState<boolean>(false);

    const { data, isLoading, isFetching, refetch } = useListDeductionRulesQuery();
    const [deleteRule, { isLoading: isDeleting }] = useDeleteDeductionRuleMutation();

    const rules: any[] = data?.data ?? [];


    const filtered = useMemo(() => {
        let arr = rules;
        if (activeOnly) arr = arr.filter(r => r.active);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            arr = arr.filter(r =>
                r.name.toLowerCase().includes(q) ||
                r.code.toLowerCase().includes(q)
            );
        }
        return arr;
    }, [rules, activeOnly, search]);

    const onCreate = () => {
        setEditingRule(null);
        setShowModal(true);
    };

    const onEdit = (r: UIDeductionRule) => {
        setEditingRule(r);
        setShowModal(true);
    };

    const onDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete deduction rule "${name}"?`)) return;
        try {
            await deleteRule(id).unwrap();
        } catch (err: any) {
            alert(err?.data?.error || err?.message || 'Failed to delete');
        }
    };

    const isBusy = isLoading || isFetching;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#00544d]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Salary Deduction Rules
                    </h1>
                    <p className="text-sm text-gray-600">Create and manage payroll deduction rules</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        disabled={isBusy}
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${isBusy ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={onCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#129990] text-white text-sm font-semibold rounded-md hover:bg-[#0f7a73] focus:outline-none focus:ring-2 focus:ring-[#129990] focus:ring-offset-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Deduction
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or code..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            id="activeOnly"
                            type="checkbox"
                            checked={activeOnly}
                            onChange={(e) => setActiveOnly(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <label htmlFor="activeOnly" className="text-sm text-gray-700">Active only</label>
                    </div>
                </div>
            </div>

            {/* Table / List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-600">
                    <div className="col-span-3">Name</div>
                    <div className="col-span-2">Code</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-1 text-center">Active</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-[#129990]" />
                        <span className="ml-2 text-gray-600">Loading...</span>
                    </div>
                )}

                {!isLoading && filtered.length === 0 && (
                    <div className="p-6 text-center text-gray-600">No deduction rules found.</div>
                )}

                {!isLoading && filtered.map((r) => {

                    return (
                        <div key={r._id} className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-4 border-b last:border-b-0">
                            <div className="md:col-span-3">
                                <div className="font-semibold text-gray-900">{r.name}</div>
                                <div className="text-xs text-gray-500">#{r._id.slice(-6)}</div>
                            </div>
                            <div className="md:col-span-2">
                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-semibold">{r.code}</span>
                            </div>
                            <div className="md:col-span-2 capitalize text-gray-800">{r.type}</div>
                            <div className="md:col-span-2 text-gray-800">{r.compute.percent === 0 ? "Salary Slab" : `${r.compute.percent}%`} </div>
                            <div className="md:col-span-1 flex items-center justify-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {r.active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="md:col-span-2 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => onEdit(r)}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-md transition-colors"
                                    title="Edit"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(r._id, r.name)}
                                    disabled={isDeleting}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-md transition-colors disabled:opacity-50"
                                    title="Delete"
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal */}
            <TaxDeductionModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingRule(null); }}
                editingRule={editingRule}
            />
        </div>
    );
};

export default DeductionRulesPage;
