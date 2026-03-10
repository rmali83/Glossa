import React, { useState, useEffect } from 'react';
import './DashboardPages.css';
import './DashboardTheme.css';
import { statsCards, recentActivity } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const DashboardHome = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [activities, setActivities] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                setProfile(data);
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchActivity = async () => {
            try {
                const { data, error } = await supabase
                    .from('activity_log')
                    .select('*, profiles(full_name)')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (error) throw error;
                setActivities(data || []);
            } catch (err) {
                console.error("Error fetching activity:", err);
            } finally {
                setLoadingLogs(false);
            }
        };

        fetchProfile();
        fetchActivity();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('activity_feed')
            .on('postgres_changes', { event: 'INSERT', table: 'activity_log' }, (payload) => {
                fetchActivity(); // Refresh on new activity
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user]);

    const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Translator';

    if (loading) {
        return (
            <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard-container fade-in-up">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Welcome back, {displayName}! 👋</h1>
                    <p className="dashboard-subtitle">Member since {new Date(user?.created_at).toLocaleDateString()}</p>
                </div>
                <div className="status-badge status-badge-active">
                    <span className="pulse-dot"></span>
                    System Active
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="stats-card">
                    <div className="card-icon" style={{background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'}}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '24px', height: '24px'}}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                        </svg>
                    </div>
                    <div className="stats-value">{(profile?.language_pairs || profile?.source_languages)?.length || 0}</div>
                    <div className="stats-label">Active Language Pairs</div>
                </div>

                <div className="stats-card">
                    <div className="card-icon" style={{background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'}}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '24px', height: '24px'}}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div className="stats-value">$0.00</div>
                    <div className="stats-label">Total Earnings</div>
                    <div className="stats-change positive">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M6 3l4 4H2l4-4z"/>
                        </svg>
                        0% this month
                    </div>
                </div>

                <div className="stats-card">
                    <div className="card-icon" style={{background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'}}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '24px', height: '24px'}}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div className="stats-value">100%</div>
                    <div className="stats-label">Success Rate</div>
                </div>

                <div className="stats-card">
                    <div className="card-icon" style={{background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'}}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '24px', height: '24px'}}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div className="stats-value">{profile?.timezone || 'UTC'}</div>
                    <div className="stats-label">Time Zone</div>
                </div>
            </div>

            <div className="dashboard-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))'}}>
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3 className="card-title gradient-text">Global Activity Hub</h3>
                        <span className="badge badge-primary">{activities.length} Recent</span>
                    </div>
                    <div className="card-content">
                        {loadingLogs ? (
                            <div style={{display: 'flex', justifyContent: 'center', padding: '2rem'}}>
                                <div className="loading-spinner"></div>
                            </div>
                        ) : activities.length > 0 ? (
                            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                                {activities.map((act) => (
                                    <div key={act.id} style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        padding: '1rem',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: act.action === 'PROJECT_DISPATCHED' 
                                                ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                                                : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem'
                                        }}>
                                            {act.action === 'PROJECT_DISPATCHED' ? '🚀' : '👤'}
                                        </div>
                                        <div style={{flex: 1}}>
                                            <div style={{fontSize: '0.875rem', marginBottom: '0.25rem'}}>
                                                <strong className="gradient-text">{act.profiles?.full_name || 'Admin'}</strong>
                                                {' '}
                                                {act.action === 'PROJECT_DISPATCHED' ? 'dispatched a new project' : 'applied for a project'}
                                            </div>
                                            {act.details?.project_name && (
                                                <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem'}}>
                                                    {act.details.project_name}
                                                </div>
                                            )}
                                            <div style={{fontSize: '0.7rem', color: 'var(--text-secondary)'}}>
                                                {new Date(act.created_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                    </svg>
                                </div>
                                <div className="empty-state-title">No Activity Yet</div>
                                <div className="empty-state-description">Platform activities will appear here</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="card-header">
                        <h3 className="card-title gradient-text">Professional Profile</h3>
                    </div>
                    <div className="card-content" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: 'var(--text-secondary)',
                                marginBottom: '0.75rem'
                            }}>
                                Language Pairs
                            </label>
                            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                                {(profile?.language_pairs || []).length > 0 ? (
                                    (profile?.language_pairs || []).map(pair => (
                                        <span key={pair} className="badge badge-primary">
                                            {pair}
                                        </span>
                                    ))
                                ) : (
                                    <span style={{color: 'var(--text-secondary)', fontSize: '0.875rem'}}>No language pairs set</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: 'var(--text-secondary)',
                                marginBottom: '0.75rem'
                            }}>
                                Specializations
                            </label>
                            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                                {(profile?.specializations || []).length > 0 ? (
                                    (profile?.specializations || []).map(spec => (
                                        <span key={spec} className="badge badge-success">
                                            {spec}
                                        </span>
                                    ))
                                ) : (
                                    <span style={{color: 'var(--text-secondary)', fontSize: '0.875rem'}}>No specializations set</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
