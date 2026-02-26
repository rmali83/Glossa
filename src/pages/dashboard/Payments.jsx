import React, { useState, useEffect } from 'react';
import './DashboardPages.css';
import { paymentHistory } from '../../data/mockData';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Payments = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0 });
    const [loading, setLoading] = useState(true);
    const [withdrawing, setWithdrawing] = useState(false);

    useEffect(() => {
        const fetchPayments = async () => {
            setLoading(true);
            try {
                // Fetching from 'transactions' table
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', user?.id)
                    .order('created_at', { ascending: false });

                if (error && error.code !== 'PGRST116') throw error;

                const finalData = (data && data.length > 0) ? data : paymentHistory;
                setPayments(finalData);

                // Calculate real stats
                // Note: mock data uses "$150.00" string format, real data would use numbers
                const calculateAmount = (amt) => {
                    if (typeof amt === 'number') return amt;
                    return parseFloat(amt.replace(/[^0-9.-]+/g, "")) || 0;
                };

                const total = finalData.reduce((acc, curr) =>
                    curr.status === 'Paid' || curr.status === 'Completed' ? acc + calculateAmount(curr.amount) : acc, 0);

                const pending = finalData.reduce((acc, curr) =>
                    curr.status === 'Pending' ? acc + calculateAmount(curr.amount) : acc, 0);

                setStats({ total, pending });

            } catch (err) {
                console.error('Error fetching payments:', err);
                setPayments(paymentHistory);
                setStats({ total: 4250, pending: 150 });
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [user]);

    const handleWithdrawalRequest = async () => {
        if (stats.pending <= 0) {
            alert("No pending balance available for withdrawal.");
            return;
        }

        setWithdrawing(true);
        try {
            const { error } = await supabase.from('transactions').insert({
                user_id: user.id,
                amount: stats.pending,
                status: 'Requested',
                method: 'Bank Transfer',
                description: 'User initiated withdrawal request'
            });

            if (error) throw error;

            alert("Withdrawal request submitted! Our finance team will review it within 24 hours.");
            window.location.reload();
        } catch (err) {
            alert("Error submitting request: " + err.message);
        } finally {
            setWithdrawing(false);
        }
    };

    const downloadCSV = () => {
        const headers = ["ID", "Date", "Amount", "Method", "Status"];
        const rows = payments.map(p => [
            p.id,
            p.date || new Date(p.created_at).toLocaleDateString(),
            p.amount,
            p.method || 'Direct Deposit',
            p.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Glossa_Payments_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    if (loading) return <div className="dashboard-page loading-state">Fetching financial records...</div>;

    return (
        <div className="dashboard-page fade-in">
            <div className="payment-overview">
                <div className="payment-stat-card">
                    <label>Total Earnings</label>
                    <h2>${stats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                    <span className="stat-meta">Lifetime income</span>
                </div>
                <div className="payment-stat-card highlight">
                    <label>Pending Balance</label>
                    <h2>${stats.pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                    <button
                        className="primary-btn withdrawal-btn"
                        onClick={handleWithdrawalRequest}
                        disabled={withdrawing || stats.pending <= 0}
                        style={{ marginTop: '10px', width: '100%', fontSize: '0.8rem', padding: '10px' }}
                    >
                        {withdrawing ? 'Processing...' : 'Request Withdrawal 💳'}
                    </button>
                </div>
                <div className="payment-stat-card">
                    <label>Default Method</label>
                    <h2 style={{ fontSize: '1.2rem' }}>Bank Transfer</h2>
                    <span className="stat-meta">Verified Gateway</span>
                    <button className="text-btn" style={{ fontSize: '0.8rem', marginTop: '5px' }}>Change Method</button>
                </div>
            </div>

            <div className="dashboard-card payment-history-card">
                <div className="card-header">
                    <h3>Transaction History</h3>
                    <button className="primary-btn outline" style={{ padding: '6px 15px', fontSize: '0.8rem' }} onClick={downloadCSV}>
                        Download Statement (CSV)
                    </button>
                </div>
                <div className="table-container">
                    <table className="payment-table">
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td><strong>{payment.id.toString().slice(0, 8)}</strong></td>
                                    <td>{payment.date || new Date(payment.created_at).toLocaleDateString()}</td>
                                    <td className="amount" style={{ color: payment.status === 'Paid' || payment.status === 'Completed' ? '#52b788' : '#ff9f1c' }}>
                                        {typeof payment.amount === 'number' ? `$${payment.amount.toFixed(2)}` : payment.amount}
                                    </td>
                                    <td>{payment.method || 'Direct Deposit'}</td>
                                    <td>
                                        <span className={`status-pill ${payment.status.toLowerCase()}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Payments;
