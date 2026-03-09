import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPages.css';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const AdminEnhanced = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview'); // overview, users, jobs, analytics, reports
    const [translators, setTranslators] = useState([]);
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeTranslators: 0,
        totalProjects: 0,
        completedProjects: 0,
        inProgressProjects: 0,
        totalRevenue: 0,
        totalWords: 0,
        avgCompletionTime: 0
    });
    const [activityLog, setActivityLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            // Fetch all profiles
            const { data: profiles } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            
            setTranslators(profiles || []);

            // Fetch all projects with relations
            const { data: projectsData } = await supabase
                .from('projects')
                .select(`
                    *,
                    translator:translator_id(full_name, email),
                    reviewer:reviewer_id(full_name, email)
                `)
                .order('created_at', { ascending: false });

            setProjects(projectsData || []);

            // Fetch activity log
            const { data: activities } = await supabase
                .from('activity_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            
            setActivityLog(activities || []);

            // Calculate stats
            const completedProjects = projectsData?.filter(p => p.status === 'completed').length || 0;
            const inProgressProjects = projectsData?.filter(p => p.status === 'in_progress' || p.status === 'pending').length || 0;
            const totalRevenue = projectsData?.reduce((sum, p) => sum + (p.total_payment || 0), 0) || 0;
            const totalWords = projectsData?.reduce((sum, p) => sum + (p.total_words || 0), 0) || 0;

            setStats({
                totalUsers: profiles?.length || 0,
                activeTranslators: profiles?.filter(p => p.user_type === 'Translator' || p.user_type === 'Freelance Translator').length || 0,
                totalProjects: projectsData?.length || 0,
                completedProjects,
                inProgressProjects,
                totalRevenue,
                totalWords,
                avgCompletionTime: 3.5 // days - calculate from actual data later
            });
        } catch (err) {
            console.error('Admin fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAllProjects = async () => {
        if (window.confirm('⚠️ WARNING: This will permanently delete ALL projects. Continue?')) {
            if (window.confirm('🚨 FINAL CONFIRMATION: Delete all projects?')) {
                try {
                    setLoading(true);
                    await supabase.from('segments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                    await supabase.from('project_files').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                    await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                    alert('✅ All projects deleted!');
                    fetchAdminData();
                } catch (err) {
                    alert('❌ Error: ' + err.message);
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    const handleSuspendUser = async (userId) => {
        try {
            await supabase
                .from('profiles')
                .update({ status: 'suspended' })
                .eq('id', userId);
            alert('User suspended');
            fetchAdminData();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const exportData = (type) => {
        let data, filename;
        if (type === 'users') {
            data = translators;
            filename = 'users_export.json';
        } else if (type === 'projects') {
            data = projects;
            filename = 'projects_export.json';
        }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (loading) return <div className="dashboard-page loading-state">Loading Admin Dashboard...</div>;

    return (
        <div className="dashboard-page fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>Admin Control Panel</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleDeleteAllProjects}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        🗑️ Delete All
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/admin/create-job')}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        + Create Job
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginBottom: '2rem',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: '1rem'
            }}>
                {['overview', 'users', 'jobs', 'analytics', 'reports'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px',
                            background: activeTab === tab ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <>
                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '2rem' }}>
                        <div className="payment-stat-card">
                            <label>Total Users</label>
                            <h2 className="stat-value">{stats.totalUsers}</h2>
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>
                                {stats.activeTranslators} Active Translators
                            </p>
                        </div>
                        <div className="payment-stat-card highlight">
                            <label>Total Projects</label>
                            <h2 className="stat-value">{stats.totalProjects}</h2>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>
                                {stats.inProgressProjects} In Progress
                            </p>
                        </div>
                        <div className="payment-stat-card">
                            <label>Total Revenue</label>
                            <h2 className="stat-value">${stats.totalRevenue.toLocaleString()}</h2>
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>
                                {stats.completedProjects} Completed
                            </p>
                        </div>
                        <div className="payment-stat-card">
                            <label>Total Words</label>
                            <h2 className="stat-value">{stats.totalWords.toLocaleString()}</h2>
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>
                                Avg {stats.avgCompletionTime} days
                            </p>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
                        <div className="card-header">
                            <h3>Recent Activity</h3>
                        </div>
                        <div style={{ padding: '1rem' }}>
                            {activityLog.length === 0 ? (
                                <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>No recent activity</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {activityLog.slice(0, 10).map(activity => (
                                        <div key={activity.id} style={{
                                            padding: '12px',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <strong style={{ color: '#fff' }}>{activity.action}</strong>
                                                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                                                    {activity.details?.project_name || 'N/A'}
                                                </p>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: '#666' }}>
                                                {new Date(activity.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="dashboard-card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>User Management</h3>
                        <button
                            onClick={() => exportData('users')}
                            style={{
                                padding: '8px 16px',
                                background: '#667eea',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            📥 Export Users
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="payment-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Type</th>
                                    <th>Language Pairs</th>
                                    <th>Rate</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {translators.map(t => (
                                    <tr key={t.id}>
                                        <td><strong>{t.full_name}</strong></td>
                                        <td style={{ fontSize: '0.85rem', color: '#666' }}>{t.email}</td>
                                        <td><span className="status-pill">{t.user_type}</span></td>
                                        <td style={{ fontSize: '0.8rem' }}>{t.language_pairs?.join(', ') || 'N/A'}</td>
                                        <td>${t.rate}/hr</td>
                                        <td>
                                            <span className={`status-pill ${t.status === 'suspended' ? 'draft' : 'completed'}`}>
                                                {t.status || 'active'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleSuspendUser(t.id)}
                                                style={{
                                                    padding: '4px 12px',
                                                    background: '#ef4444',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Suspend
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
                <div className="dashboard-card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3>Job Management</h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '8px 16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{
                                    padding: '8px 16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                            <button
                                onClick={() => exportData('projects')}
                                style={{
                                    padding: '8px 16px',
                                    background: '#667eea',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                📥 Export
                            </button>
                        </div>
                    </div>
                    <div className="table-container">
                        <table className="payment-table">
                            <thead>
                                <tr>
                                    <th>Job Name</th>
                                    <th>Languages</th>
                                    <th>Words</th>
                                    <th>Payment</th>
                                    <th>Translator</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                            No jobs found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProjects.map(project => (
                                        <tr key={project.id}>
                                            <td><strong>{project.name}</strong></td>
                                            <td style={{ fontSize: '0.8rem' }}>
                                                {project.source_language} → {project.target_language}
                                            </td>
                                            <td>{project.total_words?.toLocaleString() || 0}</td>
                                            <td>${project.total_payment?.toFixed(2) || '0.00'}</td>
                                            <td style={{ fontSize: '0.8rem' }}>
                                                {project.translator?.full_name || 'Unassigned'}
                                            </td>
                                            <td>
                                                <span className={`status-pill ${
                                                    project.status === 'completed' ? 'completed' :
                                                    project.status === 'in_progress' ? 'in-progress' :
                                                    project.status === 'pending' ? 'pending' :
                                                    'draft'
                                                }`}>
                                                    {project.status || 'draft'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.75rem', color: '#666' }}>
                                                {new Date(project.created_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => navigate(`/dashboard/cat/${project.id}`)}
                                                    className="primary-btn"
                                                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                >
                                                    Open
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h3>Project Status Distribution</h3>
                        </div>
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Completed</span>
                                    <div style={{ flex: 1, margin: '0 15px', height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(stats.completedProjects / stats.totalProjects) * 100}%`, height: '100%', background: '#10b981' }}></div>
                                    </div>
                                    <strong>{stats.completedProjects}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>In Progress</span>
                                    <div style={{ flex: 1, margin: '0 15px', height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(stats.inProgressProjects / stats.totalProjects) * 100}%`, height: '100%', background: '#3b82f6' }}></div>
                                    </div>
                                    <strong>{stats.inProgressProjects}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-header">
                            <h3>Revenue Overview</h3>
                        </div>
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1rem' }}>
                                ${stats.totalRevenue.toLocaleString()}
                            </h2>
                            <p style={{ color: '#666' }}>Total Platform Revenue</p>
                            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                                <div>
                                    <p style={{ fontSize: '0.85rem', color: '#666' }}>Avg per Project</p>
                                    <strong style={{ fontSize: '1.5rem', color: '#fff' }}>
                                        ${stats.totalProjects > 0 ? (stats.totalRevenue / stats.totalProjects).toFixed(2) : '0.00'}
                                    </strong>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.85rem', color: '#666' }}>Avg per Word</p>
                                    <strong style={{ fontSize: '1.5rem', color: '#fff' }}>
                                        ${stats.totalWords > 0 ? (stats.totalRevenue / stats.totalWords).toFixed(3) : '0.000'}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Generate Reports</h3>
                    </div>
                    <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <button
                            onClick={() => exportData('users')}
                            style={{
                                padding: '2rem',
                                background: 'rgba(255,255,255,0.02)',
                                border: '2px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.02)'}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👥</div>
                            <h4>Users Report</h4>
                            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '10px' }}>
                                Export all user data
                            </p>
                        </button>

                        <button
                            onClick={() => exportData('projects')}
                            style={{
                                padding: '2rem',
                                background: 'rgba(255,255,255,0.02)',
                                border: '2px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.02)'}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                            <h4>Projects Report</h4>
                            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '10px' }}>
                                Export all project data
                            </p>
                        </button>

                        <button
                            onClick={() => alert('Financial report coming soon!')}
                            style={{
                                padding: '2rem',
                                background: 'rgba(255,255,255,0.02)',
                                border: '2px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.02)'}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💰</div>
                            <h4>Financial Report</h4>
                            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '10px' }}>
                                Revenue & payments
                            </p>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEnhanced;
