import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import JobTemplatesModal from '../../components/JobTemplatesModal';
import './DashboardPages.css';
import './DashboardTheme.css';

const JobManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJobs, setSelectedJobs] = useState([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    
    // Filters
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        language: 'all',
        dateFrom: '',
        dateTo: '',
        minWords: '',
        maxWords: '',
        minPayment: '',
        maxPayment: '',
        translator: 'all',
        sortBy: 'created_at',
        sortOrder: 'desc'
    });

    // Job Templates
    const [templates, setTemplates] = useState([
        {
            id: 1,
            name: 'Website Translation',
            source_language: 'English',
            target_language: 'Spanish',
            pay_rate_per_word: 0.05,
            specialization: 'General',
            difficulty_level: 'standard'
        },
        {
            id: 2,
            name: 'Legal Document',
            source_language: 'English',
            target_language: 'French',
            pay_rate_per_word: 0.08,
            specialization: 'Legal',
            difficulty_level: 'expert'
        }
    ]);

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, jobs]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select(`
                    *,
                    translator:translator_id(full_name, email),
                    reviewer:reviewer_id(full_name, email),
                    created_by_user:created_by(full_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setJobs(data || []);
        } catch (err) {
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...jobs];

        // Search filter
        if (filters.search) {
            filtered = filtered.filter(job =>
                job.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                job.source_language.toLowerCase().includes(filters.search.toLowerCase()) ||
                job.target_language.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        // Status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter(job => job.status === filters.status);
        }

        // Language filter
        if (filters.language !== 'all') {
            filtered = filtered.filter(job =>
                job.source_language === filters.language ||
                job.target_language === filters.language
            );
        }

        // Date range filter
        if (filters.dateFrom) {
            filtered = filtered.filter(job =>
                new Date(job.created_at) >= new Date(filters.dateFrom)
            );
        }
        if (filters.dateTo) {
            filtered = filtered.filter(job =>
                new Date(job.created_at) <= new Date(filters.dateTo)
            );
        }

        // Word count filter
        if (filters.minWords) {
            filtered = filtered.filter(job =>
                (job.total_words || 0) >= parseInt(filters.minWords)
            );
        }
        if (filters.maxWords) {
            filtered = filtered.filter(job =>
                (job.total_words || 0) <= parseInt(filters.maxWords)
            );
        }

        // Payment filter
        if (filters.minPayment) {
            filtered = filtered.filter(job =>
                (job.total_payment || 0) >= parseFloat(filters.minPayment)
            );
        }
        if (filters.maxPayment) {
            filtered = filtered.filter(job =>
                (job.total_payment || 0) <= parseFloat(filters.maxPayment)
            );
        }

        // Translator filter
        if (filters.translator !== 'all') {
            filtered = filtered.filter(job => job.translator_id === filters.translator);
        }

        // Sorting
        filtered.sort((a, b) => {
            let aVal = a[filters.sortBy];
            let bVal = b[filters.sortBy];

            if (filters.sortBy === 'created_at') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            if (filters.sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        setFilteredJobs(filtered);
    };

    const handleSelectJob = (jobId) => {
        setSelectedJobs(prev =>
            prev.includes(jobId)
                ? prev.filter(id => id !== jobId)
                : [...prev, jobId]
        );
    };

    const handleSelectAll = () => {
        if (selectedJobs.length === filteredJobs.length) {
            setSelectedJobs([]);
        } else {
            setSelectedJobs(filteredJobs.map(job => job.id));
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedJobs.length === 0) {
            alert('Please select jobs first');
            return;
        }

        try {
            switch (action) {
                case 'delete':
                    if (window.confirm(`Delete ${selectedJobs.length} jobs?`)) {
                        await supabase
                            .from('projects')
                            .delete()
                            .in('id', selectedJobs);
                        alert('Jobs deleted successfully');
                        fetchJobs();
                        setSelectedJobs([]);
                    }
                    break;

                case 'archive':
                    await supabase
                        .from('projects')
                        .update({ status: 'archived' })
                        .in('id', selectedJobs);
                    alert('Jobs archived successfully');
                    fetchJobs();
                    setSelectedJobs([]);
                    break;

                case 'export':
                    const exportData = jobs.filter(job => selectedJobs.includes(job.id));
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `jobs_export_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    break;

                default:
                    break;
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleCreateFromTemplate = (template) => {
        navigate('/dashboard/admin/create-job', { state: { template } });
        setShowTemplateModal(false);
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            status: 'all',
            language: 'all',
            dateFrom: '',
            dateTo: '',
            minWords: '',
            maxWords: '',
            minPayment: '',
            maxPayment: '',
            translator: 'all',
            sortBy: 'created_at',
            sortOrder: 'desc'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#10b981';
            case 'in_progress': return '#3b82f6';
            case 'pending': return '#f59e0b';
            case 'draft': return '#6b7280';
            default: return '#6b7280';
        }
    };

    if (loading) return <div className="dashboard-page loading-state">Loading Jobs...</div>;

    return (
        <div className="dashboard-page fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>Job Management</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setShowTemplateModal(true)}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        📋 Templates
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

            {/* Stats Summary */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: '15px', 
                marginBottom: '2rem' 
            }}>
                <div className="payment-stat-card">
                    <label style={{ fontSize: '0.85rem' }}>Total Jobs</label>
                    <h2 className="stat-value" style={{ fontSize: '2rem' }}>{jobs.length}</h2>
                </div>
                <div className="payment-stat-card">
                    <label style={{ fontSize: '0.85rem' }}>Completed</label>
                    <h2 className="stat-value" style={{ color: '#10b981', fontSize: '2rem' }}>
                        {jobs.filter(j => j.status === 'completed').length}
                    </h2>
                </div>
                <div className="payment-stat-card">
                    <label style={{ fontSize: '0.85rem' }}>In Progress</label>
                    <h2 className="stat-value" style={{ color: '#3b82f6', fontSize: '2rem' }}>
                        {jobs.filter(j => j.status === 'in_progress' || j.status === 'pending').length}
                    </h2>
                </div>
                <div className="payment-stat-card">
                    <label style={{ fontSize: '0.85rem' }}>Draft</label>
                    <h2 className="stat-value" style={{ color: '#6b7280', fontSize: '2rem' }}>
                        {jobs.filter(j => j.status === 'draft').length}
                    </h2>
                </div>
                <div className="payment-stat-card">
                    <label style={{ fontSize: '0.85rem' }}>Selected</label>
                    <h2 className="stat-value" style={{ color: '#f59e0b', fontSize: '2rem' }}>
                        {selectedJobs.length}
                    </h2>
                </div>
            </div>

            {/* Filters Panel */}
            <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>🔍 Filters</h3>
                    <button
                        onClick={resetFilters}
                        style={{
                            padding: '6px 12px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        Reset
                    </button>
                </div>
                <div style={{ 
                    padding: '1.5rem', 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '15px' 
                }}>
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        style={{
                            padding: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.9rem'
                        }}
                    />

                    {/* Status */}
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        style={{
                            padding: '10px',
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
                        <option value="archived">Archived</option>
                    </select>

                    {/* Date From */}
                    <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        style={{
                            padding: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.9rem'
                        }}
                    />

                    {/* Date To */}
                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        style={{
                            padding: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.9rem'
                        }}
                    />

                    {/* Min Words */}
                    <input
                        type="number"
                        placeholder="Min words"
                        value={filters.minWords}
                        onChange={(e) => setFilters({ ...filters, minWords: e.target.value })}
                        style={{
                            padding: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.9rem'
                        }}
                    />

                    {/* Max Words */}
                    <input
                        type="number"
                        placeholder="Max words"
                        value={filters.maxWords}
                        onChange={(e) => setFilters({ ...filters, maxWords: e.target.value })}
                        style={{
                            padding: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.9rem'
                        }}
                    />

                    {/* Min Payment */}
                    <input
                        type="number"
                        placeholder="Min payment"
                        value={filters.minPayment}
                        onChange={(e) => setFilters({ ...filters, minPayment: e.target.value })}
                        style={{
                            padding: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.9rem'
                        }}
                    />

                    {/* Max Payment */}
                    <input
                        type="number"
                        placeholder="Max payment"
                        value={filters.maxPayment}
                        onChange={(e) => setFilters({ ...filters, maxPayment: e.target.value })}
                        style={{
                            padding: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedJobs.length > 0 && (
                <div style={{
                    padding: '15px',
                    background: 'rgba(102, 126, 234, 0.1)',
                    border: '2px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '12px',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                        {selectedJobs.length} job(s) selected
                    </span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => handleBulkAction('export')}
                            style={{
                                padding: '8px 16px',
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            📥 Export
                        </button>
                        <button
                            onClick={() => handleBulkAction('archive')}
                            style={{
                                padding: '8px 16px',
                                background: '#f59e0b',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            📦 Archive
                        </button>
                        <button
                            onClick={() => handleBulkAction('delete')}
                            style={{
                                padding: '8px 16px',
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Jobs Table */}
            <div className="dashboard-card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Jobs ({filteredJobs.length})</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.9rem', color: '#999' }}>Sort by:</label>
                        <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                            style={{
                                padding: '6px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '0.85rem'
                            }}
                        >
                            <option value="created_at">Date Created</option>
                            <option value="name">Name</option>
                            <option value="total_words">Word Count</option>
                            <option value="total_payment">Payment</option>
                            <option value="status">Status</option>
                        </select>
                        <button
                            onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                            style={{
                                padding: '6px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            {filters.sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
                <div className="table-container">
                    <table className="payment-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
                                        onChange={handleSelectAll}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </th>
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
                            {filteredJobs.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                        No jobs found
                                    </td>
                                </tr>
                            ) : (
                                filteredJobs.map(job => (
                                    <tr key={job.id} style={{ background: selectedJobs.includes(job.id) ? 'rgba(102, 126, 234, 0.05)' : 'transparent' }}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedJobs.includes(job.id)}
                                                onChange={() => handleSelectJob(job.id)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td><strong>{job.name}</strong></td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {job.source_language} → {job.target_language}
                                        </td>
                                        <td>{job.total_words?.toLocaleString() || 0}</td>
                                        <td>${job.total_payment?.toFixed(2) || '0.00'}</td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {job.translator?.full_name || 'Unassigned'}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: `${getStatusColor(job.status)}20`,
                                                color: getStatusColor(job.status)
                                            }}>
                                                {job.status || 'draft'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.75rem', color: '#666' }}>
                                            {new Date(job.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => navigate(`/dashboard/cat/${job.id}`)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#667eea',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer'
                                                }}
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

            {/* Template Modal */}
            {showTemplateModal && (
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
                        background: '#1a1a2e',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '600px',
                        width: '90%'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: '#fff', fontSize: '1.5rem' }}>Job Templates</h2>
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {templates.map(template => (
                                <div
                                    key={template.id}
                                    onClick={() => handleCreateFromTemplate(template)}
                                    style={{
                                        padding: '20px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        border: '2px solid transparent',
                                        transition: 'all 0.3s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#667eea'}
                                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                >
                                    <h3 style={{ color: '#fff', marginBottom: '10px' }}>{template.name}</h3>
                                    <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: '#999' }}>
                                        <span>{template.source_language} → {template.target_language}</span>
                                        <span>${template.pay_rate_per_word}/word</span>
                                        <span>{template.specialization}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Job Templates Modal */}
            {showTemplateModal && (
                <JobTemplatesModal onClose={() => setShowTemplateModal(false)} />
            )}
        </div>
    );
};

export default JobManagement;
