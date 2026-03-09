import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPages.css';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Admin = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [translators, setTranslators] = useState([]);
    const [stats, setStats] = useState({ translators: 0, projects: 0, revenue: 0 });
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        sourceLang: 'English',
        targetLang: 'Urdu',
        wordCount: '',
        budget: '',
        deadline: '',
        translator_id: '',
        reviewer_id: ''
    });

    useEffect(() => {
        const fetchAdminData = async () => {
            setLoading(true);
            try {
                const { data: profiles } = await supabase.from('profiles').select('*');
                setTranslators(profiles || []);

                const { data: projects } = await supabase.from('projects').select('id');

                setStats({
                    translators: profiles?.length || 0,
                    projects: projects?.length || 0,
                    revenue: 12500
                });
            } catch (err) {
                console.error('Admin fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            // 1. Create the project
            const { data: newProject, error } = await supabase
                .from('projects')
                .insert({
                    name: formData.name,
                    source_language: formData.sourceLang,
                    target_language: formData.targetLang,
                    status: 'assigned',
                    created_by: user.id,
                    translator_id: formData.translator_id,
                    reviewer_id: formData.reviewer_id,
                    settings: {
                        wordCount: parseInt(formData.wordCount),
                        budget: formData.budget,
                        deadline: formData.deadline
                    }
                })
                .select()
                .single();

            if (error) {
                if (error.message.includes("settings")) {
                    throw new Error("Missing 'settings' column in database. Please run the SQL fix: ALTER TABLE projects ADD COLUMN settings JSONB DEFAULT '{}';");
                }
                throw error;
            }

            // 2. Create sample segments for the project
            const sampleSegments = [
                { source_text: "Welcome to this translation project.", target_text: "", status: "Draft" },
                { source_text: "Please translate each segment carefully.", target_text: "", status: "Draft" },
                { source_text: "Use the CAT tool features to improve efficiency.", target_text: "", status: "Draft" }
            ];

            await supabase.from('segments').insert(
                sampleSegments.map(seg => ({
                    ...seg,
                    project_id: newProject.id,
                    created_by: user.id
                }))
            );

            // 3. Create notification for translator
            if (formData.translator_id) {
                await supabase.from('notifications').insert({
                    user_id: formData.translator_id,
                    title: 'New Project Assigned',
                    message: `You have been assigned to project "${formData.name}". Click to start translating.`,
                    type: 'info',
                    link: `/dashboard/cat/${newProject.id}`
                });
            }

            // 4. Log the activity
            await supabase.from('activity_log').insert({
                user_id: user.id,
                project_id: newProject.id,
                action: 'PROJECT_DISPATCHED',
                details: {
                    project_name: formData.name,
                    languages: `${formData.sourceLang} → ${formData.targetLang}`
                }
            });

            alert('Project dispatched successfully with sample segments!');
            setFormData({ name: '', sourceLang: 'English', targetLang: 'Urdu', wordCount: '', budget: '', deadline: '', translator_id: '', reviewer_id: '' });

            const { data } = await supabase.from('projects').select('id');
            setStats(prev => ({ ...prev, projects: data?.length || 0 }));
        } catch (err) {
            console.error('Project creation error:', err);
            alert(err.message);
        }
    };

    if (loading) return <div className="dashboard-page loading-state">Loading Admin Dashboard...</div>;

    return (
        <div className="dashboard-page fade-in">
            {/* Header with Create Job Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>Admin Dashboard</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={async () => {
                            if (window.confirm('⚠️ WARNING: This will permanently delete ALL projects, segments, and files. This action cannot be undone. Are you absolutely sure?')) {
                                if (window.confirm('🚨 FINAL CONFIRMATION: Delete all projects and data?')) {
                                    try {
                                        setLoading(true);
                                        
                                        // Delete all segments first (foreign key constraint)
                                        const { error: segError } = await supabase
                                            .from('segments')
                                            .delete()
                                            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
                                        
                                        if (segError) throw segError;
                                        
                                        // Delete all project files
                                        const { error: filesError } = await supabase
                                            .from('project_files')
                                            .delete()
                                            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
                                        
                                        if (filesError) throw filesError;
                                        
                                        // Delete all projects
                                        const { error: projError } = await supabase
                                            .from('projects')
                                            .delete()
                                            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
                                        
                                        if (projError) throw projError;
                                        
                                        // Update stats
                                        setStats(prev => ({ ...prev, projects: 0 }));
                                        
                                        alert('✅ All projects deleted successfully!');
                                    } catch (err) {
                                        console.error('Delete error:', err);
                                        alert('❌ Error deleting projects: ' + err.message);
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            }
                        }}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        🗑️ Delete All Projects
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
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        + Create New Job
                    </button>
                </div>
            </div>

            <div className="admin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '3rem' }}>
                <div className="payment-stat-card" style={{ boxShadow: '0 0 20px rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label>Active Translators</label>
                        <div className="pulse-dot"></div>
                    </div>
                    <h2 className="stat-value">{stats.translators}</h2>
                    <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>Verified & Ready</p>
                </div>
                <div className="payment-stat-card highlight" style={{ border: '2px solid var(--neon-cyan)', boxShadow: '0 0 30px rgba(0,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label>Active Projects</label>
                        <div className="pulse-dot" style={{ background: '#fff', boxShadow: '0 0 10px #fff' }}></div>
                    </div>
                    <h2 className="stat-value" style={{ background: 'none', WebkitTextFillColor: '#fff' }}>{stats.projects}</h2>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>Across 12 Countries</p>
                </div>
                <div className="payment-stat-card">
                    <label>Platform Throughput</label>
                    <h2 className="stat-value">${stats.revenue.toLocaleString()}</h2>
                    <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>Projected Revenue</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px' }}>
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Translator Directory</h3>
                    </div>
                    <div className="table-container">
                        <table className="payment-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Pairs</th>
                                    <th>Rate</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {translators.map(t => (
                                    <tr key={t.id}>
                                        <td><strong>{t.full_name}</strong></td>
                                        <td style={{ fontSize: '0.8rem' }}>{t.language_pairs?.join(', ') || 'N/A'}</td>
                                        <td>${t.rate}/hr</td>
                                        <td><span className="status-pill completed">Verified</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Dispatch New Job</h3>
                    </div>
                    <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '1rem' }}>
                        <div className="info-group">
                            <label>Project Name</label>
                            <input
                                type="text"
                                className="glass-input"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Project Title"
                                required
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="info-group">
                                <label>Source</label>
                                <input type="text" className="glass-input" value={formData.sourceLang} onChange={e => setFormData({ ...formData, sourceLang: e.target.value })} required />
                            </div>
                            <div className="info-group">
                                <label>Target</label>
                                <input type="text" className="glass-input" value={formData.targetLang} onChange={e => setFormData({ ...formData, targetLang: e.target.value })} required />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="info-group">
                                <label>Word Count</label>
                                <input type="number" className="glass-input" value={formData.wordCount} onChange={e => setFormData({ ...formData, wordCount: e.target.value })} required />
                            </div>
                            <div className="info-group">
                                <label>Budget ($)</label>
                                <input type="text" className="glass-input" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} required />
                            </div>
                        </div>
                        <div className="info-group">
                            <label>Deadline</label>
                            <input type="date" className="glass-input" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="info-group">
                                <label>Assign Translator</label>
                                <select className="glass-input" value={formData.translator_id} onChange={e => setFormData({ ...formData, translator_id: e.target.value })} required>
                                    <option value="">Select Translator</option>
                                    {translators.filter(t => t.user_type === 'Freelance Translator' || t.user_type === 'Translator').map(t => (
                                        <option key={t.id} value={t.id}>{t.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="info-group">
                                <label>Assign Reviewer</label>
                                <select className="glass-input" value={formData.reviewer_id} onChange={e => setFormData({ ...formData, reviewer_id: e.target.value })} required>
                                    <option value="">Select Reviewer</option>
                                    {translators.filter(t => t.user_type === 'Reviewer').map(t => (
                                        <option key={t.id} value={t.id}>{t.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="primary-btn" style={{ marginTop: '10px' }}>Dispatch Job 🚀</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Admin;
