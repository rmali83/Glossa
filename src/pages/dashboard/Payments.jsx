import React from 'react';
import './DashboardPages.css';
import { paymentHistory } from '../../data/mockData';

const Payments = () => {
    return (
        <div className="dashboard-page fade-in">
            <div className="payment-overview">
                <div className="payment-stat-card">
                    <label>Total Earnings</label>
                    <h2>$4,250.00</h2>
                </div>
                <div className="payment-stat-card highlight">
                    <label>Pending Payments</label>
                    <h2>$150.00</h2>
                </div>
                <div className="payment-stat-card">
                    <label>Next Payout</label>
                    <h2>Feb 15, 2026</h2>
                </div>
            </div>

            <div className="dashboard-card payment-history-card">
                <div className="card-header">
                    <h3>Payment History</h3>
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
                            {paymentHistory.map((payment) => (
                                <tr key={payment.id}>
                                    <td><strong>{payment.id}</strong></td>
                                    <td>{payment.date}</td>
                                    <td className="amount">{payment.amount}</td>
                                    <td>{payment.method}</td>
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
