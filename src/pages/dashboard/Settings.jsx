import React, { useState, useEffect } from 'react';
import './DashboardPages.css';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({
        timezone: '',
        notifications: {
            email: true,
            newJobs: true,
            paymentAlerts: true
        }
    });

    const allTimezones = Intl.supportedValuesOf('timeZone');

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('profiles')
                .select('timezone, notifications')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile({
                    timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                    notifications: data.notifications || { email: true, newJobs: true, paymentAlerts: true }
                });
            }
        };
        fetchSettings();
    }, [user]);

    const handleUpdate = async (updates) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);
            if (error) throw error;
            alert('Settings updated successfully!');
        } catch (err) {
            console.error('Update error:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleNotification = (key) => {
        const newNotifs = { ...profile.notifications, [key]: !profile.notifications[key] };
        setProfile(prev => ({ ...prev, notifications: newNotifs }));
        handleUpdate({ notifications: newNotifs });
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="dashboard-page fade-in">
            <div className="settings-header" style={{ marginBottom: '2rem' }}>
                <h2>Account Settings</h2>
                <p style={{ color: '#888' }}>Manage your account preferences and security.</p>
            </div>

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
                                checked={profile.notifications.email}
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
                                checked={profile.notifications.newJobs}
                                onChange={() => toggleNotification('newJobs')}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Regional Settings</h3>
                    <div className="info-group">
                        <label>Preferred Time Zone</label>
                        <select
                            className="glass-input"
                            style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                            value={profile.timezone}
                            onChange={(e) => {
                                const tz = e.target.value;
                                setProfile(prev => ({ ...prev, timezone: tz }));
                                handleUpdate({ timezone: tz });
                            }}
                        >
                            {allTimezones.map(tz => (
                                <option key={tz} value={tz} style={{ background: '#1a1a3a' }}>{tz}</option>
                            ))}
                        </select>
                        <p className="helper-text">Used to display project deadlines in your local time.</p>
                    </div>
                </div>

                <div className="settings-section danger-zone">
                    <h3 className="danger-text">Security & Session</h3>
                    <p style={{ marginBottom: '1rem' }}>End your current session across all devices.</p>
                    <button onClick={handleLogout} className="primary-btn outline" style={{ width: '100%', borderColor: '#ff4d4d', color: '#ff4d4d' }}>Sign Out</button>

                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 className="danger-text">Danger Zone</h3>
                        <p>Permanently delete your account and all associated data.</p>
                        <button className="danger-btn" style={{ width: '100%', marginTop: '1rem' }}>Delete Account</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
