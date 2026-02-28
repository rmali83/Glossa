import React, { useState, useEffect } from 'react';
import './GlossaCATStyle.css';
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
                    query = query.eq('reviewer_id', user.id);
                } else {
                    query = query.eq('translator_id', user.id);
                }

                const { data, error } = await query;
                if (error) {
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

        // Set up real-time subscription for projects
        const projectsSubscription = supabase
            .channel('projects-changes')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'projects'
                },
                (payload) => {
                    console.log('Project change detected:', payload);
                    fetchProjects();
                }
            )
            .subscribe();

        // Cleanup subscription
        return () => {
            supabase.removeChannel(projectsSubscription);
        };
    }, [user, isReviewer, isAdmin]);

    const [theme, setTheme] = useState(localStorage.getItem('glossa-cat-theme') || 'dark');

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('glossa-cat-theme', newTheme);
    };

    if (loading) return <div className={`cat-theme-wrapper ${theme}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Initializing Glossa CAT...</div>;

    return (
        <div className={`cat-theme-wrapper ${theme}`}>
            <div className="cat-dashboard-container">
                <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 className="cat-header-title">Glossa CAT Interface</h2>
                        <p className="cat-header-subtitle">
                            {isAdmin ? 'Manage projects and assignments with state-of-the-art tools.' :
                                isReviewer ? 'Review translations intelligently.' :
                                    'Streamline your translation workflow.'}
                        </p>
                    </div>
                    <button className="cat-theme-toggle" onClick={toggleTheme}>
                        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    </button>
                </div>

                <div className="cat-glass-card">
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Active Projects</h3>
                    </div>

                    {projects.length > 0 ? (
                        <div className="cat-table-wrapper">
                            <table className="cat-table">
                                <thead>
                                    <tr>
                                        <th>Project Name</th>
                                        <th>Languages</th>
                                        <th>Status</th>
                                        <th>Words</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map(proj => (
                                        <tr key={proj.id}>
                                            <td style={{ fontWeight: 500 }}>{proj.name}</td>
                                            <td style={{ color: 'var(--muted)' }}>{proj.source_language} &rarr; {proj.target_language}</td>
                                            <td>
                                                <span className={`cat-status-pill ${proj.status}`}>
                                                    {proj.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--muted)' }}>{proj.settings?.wordCount || '0'}</td>
                                            <td style={{ display: 'flex', gap: '10px' }}>
                                                <Link to={`/dashboard/cat/${proj.id}`} className="cat-btn-primary">
                                                    Open Workspace
                                                </Link>
                                                <button className="cat-btn-outline" onClick={() => alert('Downloading original file...')}>
                                                    Source File
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>✨</div>
                            <h3 style={{ color: 'var(--foreground)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Your Workspace is Clear</h3>
                            <p>You have no active translations. New assignments will appear here automatically.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlossaCAT;

