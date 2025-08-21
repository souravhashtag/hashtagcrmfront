import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Edit, Calculator, Check, X, RefreshCw } from 'lucide-react';
import { useGetPayrollByIdQuery, useSetPaymentStatusMutation, useRecalcTotalsMutation, useUpdatePayrollMutation } from '../../services/payrollServices';
import PayrollFormModal from './PayrollFormModal';

function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

export default function PayrollView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const q = useQuery();
    const { data: payroll, isLoading, refetch } = useGetPayrollByIdQuery(id!);
    const [setStatus, { isLoading: setting }] = useSetPaymentStatusMutation();
    const [recalc, { isLoading: recalcing }] = useRecalcTotalsMutation();
    const [update] = useUpdatePayrollMutation();
    const [showEdit, setShowEdit] = useState(Boolean(q.get('edit')));

    const setPaid = async () => {
        await setStatus({ id: id!, data: { paymentStatus: 'paid' } }).unwrap();
        refetch();
    };

    const handleRecalc = async () => {
        await recalc(id!).unwrap();
        refetch();
    };

    if (isLoading || !payroll) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen rounded-lg">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Payroll Details</h1>
                    <p className="text-gray-600 mt-1">ID: {payroll._id}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowEdit(true)} className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"><Edit className="w-4 h-4 inline mr-1" /> Edit</button>
                    <button onClick={handleRecalc} disabled={recalcing} className="px-3 py-2 border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4 inline mr-1" /> Recalculate</button>
                    {payroll.paymentStatus !== 'paid' && (
                        <button onClick={setPaid} disabled={setting} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><Check className="w-4 h-4 inline mr-1" /> Mark Paid</button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-xl font-semibold mb-4">Summary</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="text-gray-600">Period</div>
                                <div className="text-lg font-semibold">{String(payroll.month).padStart(2, '0')} / {payroll.year}</div>
                            </div>
                            <div>
                                <div className="text-gray-600">Gross</div>
                                <div className="text-lg font-semibold">₹ {Number(payroll.grossSalary || 0).toFixed(2)}</div>
                            </div>
                            <div>
                                <div className="text-gray-600">Net</div>
                                <div className="text-lg font-semibold">₹ {Number(payroll.netSalary || 0).toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-xl font-semibold mb-4">Earnings Breakdown</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <Stat label="Basic Salary" value={payroll.basicSalary} />
                            <Stat label="Top-level Bonus" value={payroll.bonus} />
                            <Stat label="Top-level Overtime" value={payroll.overtimePay} />
                            <Stat label="Structure Basic" value={payroll.salaryStructure?.basic} />
                            <Stat label="HRA" value={payroll.salaryStructure?.hra} />
                            <Stat label="Allowances" value={payroll.salaryStructure?.allowances} />
                            <Stat label="Structure Bonus" value={payroll.salaryStructure?.bonus} />
                            <Stat label="Structure Overtime" value={payroll.salaryStructure?.overtime} />
                            <Stat label="Other Earnings" value={payroll.salaryStructure?.otherEarnings} />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-xl font-semibold mb-4">Deductions</h2>
                        {(payroll.deductions ?? []).length === 0 ? (
                            <p className="text-gray-500">No deductions.</p>
                        ) : (
                            <div className="divide-y">
                                {(payroll.deductions ?? []).map((d: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between py-2">
                                        <div className="text-gray-700">{d.label ?? d.type ?? 'Deduction'}</div>
                                        <div className="font-medium">₹ {Number(d.amount ?? 0).toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                </div>

                {/* Side */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-xl font-semibold mb-4">Employee</h2>
                        {typeof payroll.employeeId === 'object' ? (
                            <div className="space-y-2 text-sm">
                                <div className="font-medium">{payroll.employeeId?.userId ? `${payroll.employeeId.userId.firstName || ''} ${payroll.employeeId.userId.lastName || ''}`.trim() : payroll.employeeId?.employeeId}</div>
                                <div className="text-gray-600">Emp ID: {payroll.employeeId?.employeeId}</div>
                                <div className="text-gray-600">Department: {payroll.employeeId?.userId.department.name || '-'}</div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-600">{payroll.employeeId}</div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-xl font-semibold mb-4">Payment</h2>
                        <div className="space-y-2 text-sm">
                            <div>Status: <span className={`px-2 py-0.5 rounded-full text-xs border ${payroll.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 border-green-300' :
                                    payroll.paymentStatus === 'processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                        payroll.paymentStatus === 'failed' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-gray-100 text-gray-800 border-gray-300'
                                }`}>{String(payroll.paymentStatus || 'unpaid').toUpperCase()}</span></div>
                            <div>Method: {payroll.paymentMethod || '-'}</div>
                            <div>Txn ID: {payroll.transactionId || '-'}</div>
                            <div>Paid On: {payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleString() : '-'}</div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                        <div className="flex items-center gap-2 text-blue-900 font-medium mb-1"><Calculator className="w-4 h-4" /> Net Salary</div>
                        <div className="text-2xl font-bold">₹ {Number(payroll.netSalary || 0).toFixed(2)}</div>
                        <div className="text-blue-800 mt-1">Gross ₹ {Number(payroll.grossSalary || 0).toFixed(2)} − Deductions ₹ {Number(payroll.totalDeductions || 0).toFixed(2)}</div>
                    </div>
                </div>
            </div>

            {/* Edit modal */}
            <PayrollFormModal isOpen={showEdit} onClose={() => setShowEdit(false)} editId={id!} initial={payroll as any} onSuccess={() => refetch()} />
        </div>
    );
}

function Stat({ label, value }: { label: string; value: any }) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="text-gray-600">{label}</div>
            <div className="font-medium">₹ {Number(value || 0).toFixed(2)}</div>
        </div>
    );
}