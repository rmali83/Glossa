import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './DashboardPages.css';
import './DashboardTheme.css';

const UserManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        translators: 0,
        reviewers: 0,
        agencies: 0
    });

    // Check if user is admin
    const isAdmin = user?.user_metadata?.user_type === 'Agencies' || user?.email === 'rmali@live.com';

    useEffect(() => {
        if (!isAdmin) {
            navigate('/dashboard');
            return;
        }
        fetchUsers();
    }, [isAdmin, navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    user_roles(project_id, role),
                    projects_as_translator:projects!translator_id(id, name, status),
                    projects_as_reviewer:projects!reviewer_id(id, name, status)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Calculate stats
            const total = profiles?.length || 0;
            const translators = profiles?.filter(p => 
                p.user_type === 'Freelance Translator' || p.user_type === 'Translator'
            ).length || 0;
            const reviewers = profiles?.filter(p => p.user_type === 'Reviewer').length || 0;
            const agencies = profiles?.filter(p => p.user_type === 'Agencies').length || 0;

            setStats({
                total,
                active: total, // For now, assume all are active
                translators,
                reviewers,
                agencies
            });

            setUsers(profiles || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesTab = activeTab === 'all' || 
                          (activeTab === 'translators' && (user.user_type === 'Freelance Translator' || user.user_type === 'Translator')) ||
                          (activeTab === 'reviewers' && user.user_type === 'Reviewer') ||
                          (activeTab === 'agencies' && user.user_type === 'Agencies');

        return matchesSearch && matchesTab;
    });

    const handleUserAction = async (userId, action) => {
        try {
            switch (action) {
                case 'activate':
                case 'deactivate':
                    // Update user status (you might want to add an 'active' field to profiles)
                    alert(`User ${action}d successfully`);
                    break;
                case 'delete':
                    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                        const { error } = await supabase
                            .from('profiles')
                            .delete()
                            .eq('id', userId);
                        
                        if (error) throw error;
                        fetchUsers();
                        alert('User deleted successfully');
                    }
                    break;
                default:
                    break;
            }
        } catch (err) {
            console.error('Error performing user action:', err);
            alert('Error performing action');
        }
    };

    const getUserStatusColor = (userType) => {
        switch (userType) {
            case 'Agencies': return '#10b981';
            case 'Reviewer': return '#3b82f6';
            case 'Freelance Translator':
            case 'Translator': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const getProjectCount = (user) => {
        const translatorProjects = user.projects_as_translator?.length || 0;
        const reviewerProjects = user.projects_as_reviewer?.length || 0;
        return translatorProjects + reviewerProjects;
    };

    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="loading-state">Loading user management...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-page fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>
                        👥 User Management
                    </h1>
                    <p style={{ color: '#888', marginTop: '0.5rem' }}>
                        Manage translators, reviewers, and team members
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        + Add User
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="dashboard-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                        {stats.total}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                        Total Users
                    </div>
                </div>
                <div className="dashboard-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        {stats.translators}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                        Translators
                    </div>
                </div>
                <div className="dashboard-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                        {stats.reviewers}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                        Reviewers
                    </div>
                </div>
                <div className="dashboard-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                        {stats.agencies}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                        Agencies
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {[
                            { key: 'all', label: 'All Users', count: stats.total },
                            { key: 'translators', label: 'Translators', count: stats.translators },
                            { key: 'reviewers', label: 'Reviewers', count: stats.reviewers },
                            { key: 'agencies', label: 'Agencies', count: stats.agencies }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '8px 16px',
                                    background: activeTab === tab.key ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                    color: activeTab === tab.key ? '#10b981' : '#888',
                                    border: `1px solid ${activeTab === tab.key ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: '10px 40px 10px 16px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '0.9rem',
                                width: '300px'
                            }}
                        />
                        <svg 
                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#666' }}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>Users ({filteredUsers.length})</h3>
                </div>
                <div className="table-container">
                    <table className="payment-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Languages</th>
                                <th>Projects</th>
                                <th>Experience</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#fff',
                                                    fontWeight: 'bold',
                                                    fontSize: '1.1rem'
                                                }}>
                                                    {user.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#fff' }}>
                                                        {user.full_name || 'Unnamed User'}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span 
                                                className="status-pill"
                                                style={{ 
                                                    backgroundColor: getUserStatusColor(user.user_type) + '20',
                                                    color: getUserStatusColor(user.user_type),
                                                    border: `1px solid ${getUserStatusColor(user.user_type)}40`
                                                }}
                                            >
                                                {user.user_type || 'Unknown'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.8rem', color: '#ccc' }}>
                                            {user.language_pairs?.slice(0, 2).join(', ') || 'Not specified'}
                                            {user.language_pairs?.length > 2 && (
                                                <span style={{ color: '#666' }}> +{user.language_pairs.length - 2} more</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.9rem', color: '#fff' }}>
                                            {getProjectCount(user)}
                                        </td>
                                        <td style={{ fontSize: '0.8rem', color: '#ccc' }}>
                                            {user.years_experience || 'Not specified'}
                                        </td>
                                        <td>
                                            <span className="status-pill completed">Active</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => navigate(`/dashboard/users/${user.id}`)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: 'rgba(59, 130, 246, 0.2)',
                                                        color: '#60a5fa',
                                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                                        borderRadius: '6px',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleUserAction(user.id, 'delete')}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: 'rgba(239, 68, 68, 0.2)',
                                                        color: '#f87171',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        borderRadius: '6px',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <CreateUserModal 
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchUsers();
                    }}
                />
            )}
        </div>
    );
};

// Create User Modal Component
const CreateUserModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        userType: 'Freelance Translator',
        languagePairs: [],
        experienceLevel: 'Intermediate'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create user account
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: formData.email,
                password: formData.password,
                user_metadata: {
                    full_name: formData.fullName,
                    user_type: formData.userType
                }
            });

            if (authError) throw authError;

            // Update profile
            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        language_pairs: formData.languagePairs,
                        years_experience: formData.experienceLevel
                    })
                    .eq('id', authData.user.id);

                if (profileError) throw profileError;
            }

            alert('User created successfully!');
            onSuccess();
        } catch (err) {
            console.error('Error creating user:', err);
            alert('Error creating user: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: '#1a1a1a',
                padding: '2rem',
                borderRadius: '12px',
                width: '500px',
                maxWidth: '90vw'
            }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#fff' }}>Create New User</h3>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        style={{
                            padding: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                    />
                    
                    <input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        style={{
                            padding: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                    />
                    
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        style={{
                            padding: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                    />
                    
                    <select
                        value={formData.userType}
                        onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                        style={{
                            padding: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                    >
                        <option value="Freelance Translator">Freelance Translator</option>
                        <option value="Reviewer">Reviewer</option>
                        <option value="Agencies">Agency</option>
                    </select>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: loading ? '#666' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserManagement;