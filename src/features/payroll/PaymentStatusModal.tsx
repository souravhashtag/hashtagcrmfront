import React, { useEffect, useState } from 'react';
import { X, Calendar } from 'lucide-react';

type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'other';

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (p: { paymentMethod: PaymentMethod; transactionId: string; paymentDate?: string }) => void;
    defaultDate?: string; // ISO yyyy-mm-dd (optional)
}

const toLocalISODate = (d = new Date()) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

export default function PaymentStatusModal({ open, onClose, onConfirm, defaultDate }: Props) {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [transactionId, setTransactionId] = useState('');
    const [paymentDate, setPaymentDate] = useState<string>(defaultDate || toLocalISODate());
    const [errors, setErrors] = useState<{ method?: string; txn?: string }>({});

    useEffect(() => {
        if (open) {
            setPaymentMethod('cash');
            setTransactionId('');
            setPaymentDate(defaultDate || toLocalISODate());
            setErrors({});
        }
    }, [open, defaultDate]);

    if (!open) return null;

    const validate = () => {
        const e: typeof errors = {};
        if (!paymentMethod) e.method = 'Required';
        if (!transactionId.trim()) e.txn = 'Transaction ID required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = () => {
        if (!validate()) return;
        onConfirm({
            paymentMethod,
            transactionId: transactionId.trim(),
            paymentDate, 
        });
        console.log('Payment confirmed:')
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">Mark as Paid</h3>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Payment Method *</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="cash">Cash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="upi">UPI</option>
                            <option value="cheque">Cheque</option>
                            <option value="other">Other</option>
                        </select>
                        {errors.method && <p className="text-xs text-red-600 mt-1">{errors.method}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Transaction ID *</label>
                        <input
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="e.g., UPI ref, UTR, cheque no."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                        {errors.txn && <p className="text-xs text-red-600 mt-1">{errors.txn}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Payment Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg pr-10 focus:ring-2 focus:ring-emerald-500"
                            />
                            <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">If left empty, backend will set to now.</p>
                    </div>
                </div>

                <div className="flex gap-2 p-4 border-t">
                    <button onClick={onClose} className="flex-1 border rounded-lg px-4 py-2 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={submit} className="flex-1 bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700">
                        Confirm Paid
                    </button>
                </div>
            </div>
        </div>
    );
}
