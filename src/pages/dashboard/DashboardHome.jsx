import React, { useState, useEffect } from 'react';
import './DashboardPages.css';
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
        return <div className="dashboard-page loading-state">Loading Dashboard...</div>;
    }

    return (
        <div className="dashboard-page fade-in">
            <div className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2>Welcome back, {displayName}! 👋</h2>
                    <p>Member since {new Date(user?.created_at).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)', fontSize: '0.8rem', background: 'rgba(0, 255, 255, 0.05)', padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(0, 255, 255, 0.1)' }}>
                    <div className="pulse-dot"></div>
                    Real-time System Status: Active
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper"><span className="stat-icon">🌍</span></div>
                    <div className="stat-info">
                        <span className="stat-label">Active Pairs</span>
                        <span className="stat-value">{(profile?.language_pairs || profile?.source_languages)?.length || 0}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper"><span className="stat-icon">🕒</span></div>
                    <div className="stat-info">
                        <span className="stat-label">Time Zone</span>
                        <span className="stat-value" style={{ fontSize: '0.9rem' }}>{profile?.timezone || 'Not set'}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper"><span className="stat-icon">💰</span></div>
                    <div className="stat-info">
                        <span className="stat-label">Earnings</span>
                        <span className="stat-value">$0.00</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper"><span className="stat-icon">✅</span></div>
                    <div className="stat-info">
                        <span className="stat-label">Success Rate</span>
                        <span className="stat-value">100%</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card status-overview">
                    <div className="card-header">
                        <h3>Global Activity Hub</h3>
                    </div>
                    <div className="activity-list" style={{ padding: '1rem' }}>
                        {loadingLogs ? (
                            <p style={{ color: '#666' }}>Fetching activity logs...</p>
                        ) : activities.length > 0 ? (
                            activities.map((act) => (
                                <div key={act.id} className="activity-item" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 0', display: 'flex', gap: '15px' }}>
                                    <div style={{ fontSize: '1.2rem' }}>
                                        {act.action === 'PROJECT_DISPATCHED' ? '🚀' :
                                            act.action === 'TRANSLATOR_APPLIED' ? '👤' : '📝'}
                                    </div>
                                    <div style={{ flex: '1' }}>
                                        <div style={{ fontSize: '0.9rem' }}>
                                            {act.action === 'PROJECT_DISPATCHED' ? (
                                                <><strong style={{ color: 'var(--neon-cyan)' }}>Admin</strong> dispatched a new project</>
                                            ) : act.action === 'TRANSLATOR_APPLIED' ? (
                                                <><strong style={{ color: 'var(--neon-cyan)' }}>{act.profiles?.full_name || 'Translator'}</strong> applied for a project</>
                                            ) : (
                                                <>Activity recorded</>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '4px' }}>
                                            {act.details?.project_name}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
                                            {new Date(act.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state" style={{ textAlign: 'center', padding: '1.5rem' }}>
                                <p style={{ color: '#666' }}>No platform activities recorded yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-card recent-activity">
                    <div className="card-header">
                        <h3>Professional Profile</h3>
                    </div>
                    <div className="profile-detail-grid" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="detail-item">
                            <label style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Language Pairs</label>
                            <div className="tag-cloud" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                                {(profile?.language_pairs || []).map(pair => (
                                    <span key={pair} className="pair-tag" style={{ background: 'rgba(0, 255, 255, 0.08)', color: 'var(--neon-cyan)', padding: '5px 12px', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid rgba(0, 255, 255, 0.15)', fontWeight: '500' }}>
                                        {pair}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="detail-item">
                            <label style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Expertise Areas</label>
                            <div className="tag-cloud" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                                {(profile?.specializations || []).map(spec => (
                                    <span key={spec} className="pair-tag" style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#aaa', padding: '5px 12px', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
