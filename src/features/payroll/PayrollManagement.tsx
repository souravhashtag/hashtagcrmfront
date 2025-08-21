import React, { useState } from 'react';
import { Search, Eye, Edit, Trash2, Download, Check, Plus } from 'lucide-react';
import { useGetPayrollsQuery, useDeletePayrollMutation, useSetPaymentStatusMutation } from '../../services/payrollServices';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import PayrollFormModal from './PayrollFormModal';
import PaymentStatusModal from './PaymentStatusModal';

export default function PayrollManagement() {
    const navigate = useNavigate();
    const [query, setQuery] = useState({ q: '', month: '', year: '', status: '' });
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [showForm, setShowForm] = useState(false);

    const { data, isLoading, refetch } = useGetPayrollsQuery({
        page,
        limit,
        q: query.q || undefined,
        month: query.month || undefined,
        year: query.year || undefined,
        status: query.status || undefined,
        sort: 'year:desc,month:desc,createdAt:desc',
    });

    const [del] = useDeletePayrollMutation();

    const items = data?.items ?? [];
    const pages = data?.pages ?? 1;

    const exportExcel = () => {
        const rows = items.map((p: any, i: number) => ({
            'S.No': (page - 1) * limit + i + 1,
            'EmployeeId': typeof p.employeeId === 'object' ? p.employeeId?.employeeId || p.employeeId?._id : p.employeeId,
            'Month': p.month,
            'Year': p.year,
            'Gross': p.grossSalary ?? '',
            'Deductions': p.totalDeductions ?? '',
            'Net': p.netSalary ?? '',
            'Status': (p.paymentStatus || 'unpaid').toUpperCase(),
            'Txn Id': p.transactionId || '-',
            'Method': p.paymentMethod || '-',
            'Paid On': p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-',
            'Created': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-',
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [
            { wch: 6 }, { wch: 22 }, { wch: 6 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
        const filename = `payroll-${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    const [open, setOpen] = useState(false);
    const [setPaymentStatus, { isLoading: settingStatus }] = useSetPaymentStatusMutation();
    const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);

    const handleConfirmPaid = async (p: { paymentMethod: any; transactionId: string; paymentDate?: string }) => {
        if (!selectedPayrollId) return;

        await setPaymentStatus({
            id: selectedPayrollId,
            data: {
                paymentStatus: 'paid',
                paymentMethod: p.paymentMethod,
                transactionId: p.transactionId,
                ...(p.paymentDate ? { paymentDate: p.paymentDate } : {}),
            },
        }).unwrap();

        setOpen(false);
        setSelectedPayrollId(null);
        refetch();
    };


    const handleDelete = async (id: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this payroll record? This action cannot be undone.');
        if (!confirmed) return;

        try {
            await del({ id }).unwrap();
            refetch();
        } catch (error) {
            console.error('Failed to delete payroll:', error);
        }
    };


    return (
        <div className="p-6 bg-gray-50 min-h-fit">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
                    <p className="text-gray-600">Track, create, and manage monthly payrolls</p>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    <Plus className="w-4 h-4" /> New Payroll
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border mb-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={query.q} onChange={(e) => setQuery((p) => ({ ...p, q: e.target.value }))}
                            placeholder="Search by employee/transaction id"
                            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <input type="number" placeholder="Month" min={1} max={12} value={query.month}
                        onChange={(e) => setQuery((p) => ({ ...p, month: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                    <input type="number" placeholder="Year" value={query.year}
                        onChange={(e) => setQuery((p) => ({ ...p, year: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                    <select value={query.status} onChange={(e) => setQuery((p) => ({ ...p, status: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                    </select>
                    <div className="flex gap-2">
                        <button onClick={() => { setPage(1); refetch(); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Refresh</button>
                        <button onClick={exportExcel} className="px-4 py-2 bg-[#129990] text-white rounded-lg hover:bg-[#1dbfb4]"><Download className="w-4 h-4 inline mr-1" />Export</button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Period</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Gross</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Deductions</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Net</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">Loading…</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">No payrolls found.</td></tr>
                            ) : items.map((p: any) => (
                                <tr key={p._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3">
                                        <div className="text-sm font-medium text-gray-900">{p.employeeId?.userId ? `${p.employeeId.userId.firstName || ''} ${p.employeeId.userId.lastName || ''}`.trim() : (typeof p.employeeId === 'string' ? p.employeeId : p.employeeId?.employeeId)}</div>
                                        <div className="text-xs text-gray-500">{p.employeeId?.employeeId || '-'}</div>
                                    </td>
                                    <td className="px-6 py-3 text-sm">{String(p.month).padStart(2, '0')}/{p.year}</td>
                                    <td className="px-6 py-3 text-sm">₹ {Number(p.grossSalary || 0).toFixed(2)}</td>
                                    <td className="px-6 py-3 text-sm">₹ {Number(p.totalDeductions || 0).toFixed(2)}</td>
                                    <td className="px-6 py-3 font-semibold">₹ {Number(p.netSalary || 0).toFixed(2)}</td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${p.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 border-green-300' :
                                            p.paymentStatus === 'processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                                p.paymentStatus === 'failed' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-gray-100 text-gray-800 border-gray-300'
                                            }`}>
                                            {String(p.paymentStatus || 'unpaid').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => navigate(`/payroll/view/${p._id}`)} className="p-1 text-blue-600 hover:text-blue-800" title="View"><Eye className="w-4 h-4" /></button>
                                            <button onClick={() => navigate(`/payroll/view/${p._id}?edit=1`)} className="p-1 text-emerald-600 hover:text-emerald-800" title="Edit"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => {
                                                handleDelete(p._id);
                                            }} className="p-1 text-red-600 hover:text-red-800" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                            {p.paymentStatus !== 'paid' && (
                                                <button
                                                    onClick={() => { setSelectedPayrollId(p._id); setOpen(true); }}
                                                    disabled={settingStatus}
                                                    className="ml-2 inline-flex items-center gap-1 px-2 py-1 border rounded hover:bg-green-50"
                                                    title="Mark Paid"
                                                >
                                                    <Check className="w-4 h-4" /> Mark Paid
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-600">Page {page} of {pages}</div>
                        <div className="flex gap-2">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <PayrollFormModal isOpen={showForm} onClose={() => setShowForm(false)} onSuccess={() => refetch()} />
            <PaymentStatusModal
                open={open}
                onClose={() => setOpen(false)}
                onConfirm={handleConfirmPaid}
            />
        </div>
    );
}