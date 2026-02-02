import React, { useState } from 'react';
import './DashboardPages.css';
import { mockUser } from '../../data/mockData';

const Settings = () => {
    const [notifications, setNotifications] = useState({
        email: true,
        browser: false,
        newJobs: true,
        paymentAlerts: true
    });

    const toggleNotification = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="dashboard-page fade-in">
            <div className="settings-grid">
                <div className="settings-section">
                    <h3>Notification Preferences</h3>
                    <div className="setting-item">
                        <div className="setting-info">
                            <label>Email Notifications</label>
                            <p>Receive updates via email</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={notifications.email}
                                onChange={() => toggleNotification('email')}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="setting-item">
                        <div className="setting-info">
                            <label>New Job Alerts</label>
                            <p>Get notified when new jobs match your skills</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={notifications.newJobs}
                                onChange={() => toggleNotification('newJobs')}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="setting-item">
                        <div className="setting-info">
                            <label>Payment Notifications</label>
                            <p>Receive alerts for payouts and invoices</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={notifications.paymentAlerts}
                                onChange={() => toggleNotification('paymentAlerts')}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Account Preferences</h3>
                    <div className="info-group">
                        <label>Time Zone Display</label>
                        <select className="form-select" defaultValue={mockUser.timeZone}>
                            <option value="Asia/Karachi">Asia/Karachi (GMT+5)</option>
                            <option value="UTC">UTC (GMT+0)</option>
                            <option value="America/New_York">New York (GMT-5)</option>
                        </select>
                        <p className="helper-text">Used for scheduling deadlines and messages.</p>
                    </div>
                </div>

                <div className="settings-section danger-zone">
                    <h3 className="danger-text">Danger Zone</h3>
                    <p>Once you delete your account, there is no going back. Please be certain.</p>
                    <button className="danger-btn">Delete Account</button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
