import React, { useState, useEffect } from 'react';
import './DashboardPages.css';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const GlossaCAT = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const userRole = user?.user_metadata?.user_type || 'Translator';
    const isReviewer = userRole === 'Reviewer';
    const isAdmin = userRole === 'Agencies' || user?.email === 'rmali@live.com';

    useEffect(() => {
        const fetchProjects = async () => {
            if (!user) return;
            setLoading(true);
            try {
                let query = supabase.from('projects').select('*');

                if (isAdmin) {
                    // Admins see all projects
                } else if (isReviewer) {
                    // Reviewers see projects assigned to them as reviewer
                    query = query.eq('reviewer_id', user.id);
                } else {
                    // Translators see projects assigned to them
                    // Since the current db schema uses user_roles, we might need to join it,
                    // but according to the prompt, we should check translator_id directly on projects:
                    // "Store in database: project_id, translator_id, reviewer_id, status"
                    // So let's fall back to checking user_roles if translator_id isn't directly on there, 
                    // or assume the new schema has translator_id. The prompt says "Store in database: project_id, translator_id, reviewer_id, status".
                    query = query.eq('translator_id', user.id);
                }

                const { data, error } = await query;
                if (error) {
                    // If the column doesn't exist yet, it might error out. Let's handle gracefully.
                    console.error('Error fetching projects with new schema:', error);
                    setProjects([]);
                } else {
                    setProjects(data || []);
                }
            } catch (err) {
                console.error('Projects fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [user, isReviewer, isAdmin]);

    if (loading) return <div className="dashboard-page loading-state">Initializing Glossa CAT...</div>;

    return (
        <div className="dashboard-page fade-in">
            <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
                <h2>Glossa CAT Overview</h2>
                <p style={{ color: '#888' }}>
                    {isAdmin ? 'Manage projects and assignments.' :
                        isReviewer ? 'Projects assigned to you for review.' :
                            'Projects assigned to you for translation.'}
                </p>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header">
                        <h3>Your Projects</h3>
                    </div>
                    {projects.length > 0 ? (
                        <div className="table-container">
                            <table className="payment-table">
                                <thead>
                                    <tr>
                                        <th>Project Name</th>
                                        <th>Languages</th>
                                        <th>Status</th>
                                        <th>Word Count</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map(proj => (
                                        <tr key={proj.id}>
                                            <td><strong>{proj.name}</strong></td>
                                            <td>{proj.source_language} → {proj.target_language}</td>
                                            <td>
                                                <span className={`status-pill ${proj.status.replace('_', ' ')}`}>
                                                    {proj.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td>{proj.settings?.wordCount || '0'}</td>
                                            <td style={{ display: 'flex', gap: '10px' }}>
                                                <Link to={`/dashboard/cat/${proj.id}`} className="primary-btn text-btn" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                                                    Open in CAT
                                                </Link>
                                                <button className="primary-btn outline" style={{ padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => alert('Downloading original file...')}>
                                                    Download Original
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                            <h3>No Projects Assigned</h3>
                            <p>You currently do not have any projects assigned. Projects will automatically appear here when an admin assigns them to you.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlossaCAT;
