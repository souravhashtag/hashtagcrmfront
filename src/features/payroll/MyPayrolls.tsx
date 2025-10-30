import React, { useState } from 'react';
import { Search, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useGetMyPayrollsQuery } from '../../services/payrollServices';
import { PayslipGenerator } from './PayslipGenerator';

export default function MyPayrolls() {
    const navigate = useNavigate();
    const [query, setQuery] = useState({ q: '', month: '', year: '', status: '' });
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const { data, isLoading, refetch } = useGetMyPayrollsQuery({
        page,
        limit,
        q: query.q || undefined,
        month: query.month || undefined,
        year: query.year || undefined,
        status: query.status || undefined,
        sort: 'year:desc,month:desc,createdAt:desc',
    });

    const items = data?.items ?? [];
    const pages = data?.pages ?? 1;

    const exportExcel = () => {
        const rows = items.map((p: any, i: number) => ({
            'S.No': (page - 1) * limit + i + 1,
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
        ws['!cols'] = [{ wch: 6 }, { wch: 6 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, ws, 'My Payroll');
        XLSX.writeFile(wb, `my-payroll-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-fit">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">My Payrolls</h1>
                <p className="text-gray-600">Your monthly payslips and payment status</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border mb-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={query.q}
                            onChange={(e) => setQuery((p) => ({ ...p, q: e.target.value }))}
                            placeholder="Search by transaction id"
                            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <input
                        type="number"
                        placeholder="Month"
                        min={1}
                        max={12}
                        value={query.month}
                        onChange={(e) => setQuery((p) => ({ ...p, month: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="number"
                        placeholder="Year"
                        value={query.year}
                        onChange={(e) => setQuery((p) => ({ ...p, year: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={query.status}
                        onChange={(e) => setQuery((p) => ({ ...p, status: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="processing">Processing</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                    </select>
                    <div className="flex gap-2">
                        <button onClick={() => { setPage(1); refetch(); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Refresh</button>
                        <button onClick={exportExcel} className="px-4 py-2 bg-[#129990] text-white rounded-lg hover:bg-[#1dbfb4]">
                            <Download className="w-4 h-4 inline mr-1" />Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
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
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Loading…</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No payrolls found.</td></tr>
                            ) : items.map((p: any) => (
                                <tr key={p._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-sm">{String(p.month).padStart(2, '0')}/{p.year}</td>
                                    <td className="px-6 py-3 text-sm">₹ {Number(p.grossSalary || 0).toFixed(2)}</td>
                                    <td className="px-6 py-3 text-sm">₹ {Number(p.totalDeductions || 0).toFixed(2)}</td>
                                    <td className="px-6 py-3 font-semibold">₹ {Number(p.netSalary || 0).toFixed(2)}</td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${p.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 border-green-300' :
                                            p.paymentStatus === 'processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                                p.paymentStatus === 'failed' ? 'bg-red-100 text-red-800 border-red-300' :
                                                    'bg-gray-100 text-gray-800 border-gray-300'
                                            }`}>
                                            {String(p.paymentStatus || 'unpaid').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => navigate(`/payroll/view/${p._id}?readonly=1`)}
                                            className="p-1 text-blue-600 hover:text-blue-800"
                                            title="View"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => PayslipGenerator.downloadHTMLPayslip(p)}
                                            className="p-1 text-green-600 hover:text-green-800"
                                            title="Download Payslip PDF"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
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
        </div>
    );
}
