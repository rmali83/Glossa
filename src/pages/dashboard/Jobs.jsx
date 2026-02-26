import React, { useState, useEffect } from 'react';
import './DashboardPages.css';
import { mockJobs } from '../../data/mockData';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Jobs = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('available');
    const [jobs, setJobs] = useState([]);
    const [userPairs, setUserPairs] = useState([]);
    const [loading, setLoading] = useState(true);

    const KIRO_URL = "https://translatr-ai-craft.vercel.app";

    useEffect(() => {
        const fetchUserAndJobs = async () => {
            setLoading(true);
            try {
                // 1. Get user language pairs
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('language_pairs')
                    .eq('id', user?.id)
                    .single();

                if (profile?.language_pairs) {
                    setUserPairs(profile.language_pairs);
                }

                // 2. Get real projects from Supabase
                // We join with user_roles to see who is assigned
                const { data: remoteProjects, error: projectError } = await supabase
                    .from('projects')
                    .select('*, user_roles(user_id, role)');

                if (projectError) throw projectError;

                // Format data for the UI
                const formattedJobs = remoteProjects.map(project => ({
                    id: project.id,
                    pair: `${project.source_language} → ${project.target_language}`,
                    source: project.source_language,
                    target: project.target_language,
                    name: project.name,
                    status: project.status === 'active' ? 'available' : project.status,
                    wordCount: project.settings?.wordCount || 0,
                    budget: project.settings?.budget || 'TBD',
                    deadline: project.settings?.deadline || 'Flex',
                    assignedTranslators: project.user_roles?.filter(r => r.role === 'translator').map(r => r.user_id) || []
                }));

                setJobs(formattedJobs.length > 0 ? formattedJobs : mockJobs);

            } catch (err) {
                console.error('Error fetching data:', err);
                setJobs(mockJobs);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndJobs();
    }, [user]);

    const handleApply = async (jobId) => {
        try {
            // Check if already assigned
            const project = jobs.find(j => j.id === jobId);
            if (project && project.assignedTranslators.includes(user.id)) {
                window.open(`${KIRO_URL}/project/${jobId}`, '_blank');
                return;
            }

            // Assign via user_roles
            const { error } = await supabase
                .from('user_roles')
                .insert({
                    user_id: user.id,
                    project_id: jobId,
                    role: 'translator'
                });

            if (error) throw error;

            // Log activity
            await supabase.from('activity_log').insert({
                user_id: user.id,
                project_id: jobId,
                action: 'TRANSLATOR_APPLIED',
                details: {
                    project_name: project.name || project.pair,
                    translator_name: user?.user_metadata?.full_name || 'A translator'
                }
            });

            alert('Successfully assigned! Opening CAT tool...');
            window.open(`${KIRO_URL}/project/${jobId}`, '_blank');

            // Refresh list
            window.location.reload();
        } catch (err) {
            console.error('Application error:', err);
            alert('Error applying for job or already assigned.');
        }
    };

    // Intelligent Matching Logic
    const filteredJobs = jobs.filter(job => {
        if (activeTab === 'available') {
            // Available if status is available AND current user is NOT assigned
            const isAvailable = job.status === 'available';
            const isNotAssignedToMe = !job.assignedTranslators.includes(user?.id);
            const langMatch = userPairs.length === 0 || userPairs.some(p =>
                (p.includes(job.source) && p.includes(job.target)) || job.pair.includes(p)
            );
            return isAvailable && isNotAssignedToMe && langMatch;
        } else if (activeTab === 'active') {
            // Active if user is assigned
            return job.assignedTranslators.includes(user?.id);
        } else {
            return job.status === activeTab;
        }
    });

    if (loading) return <div className="dashboard-page loading-state">Loading Projects...</div>;

    return (
        <div className="dashboard-page fade-in">
            <div className="jobs-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Job Opportunities</h2>
                    <p style={{ color: '#888' }}>
                        Matching: {userPairs.length > 0 ? userPairs.join(', ') : 'All Languages'}
                    </p>
                </div>
                <button className="primary-btn outline" onClick={() => window.open(KIRO_URL, '_blank')}>
                    Launch CAT Tool 🚀
                </button>
            </div>

            <div className="tabs-header">
                <button
                    className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
                    onClick={() => setActiveTab('available')}
                >
                    Available ({jobs.filter(j => j.status === 'available' && !j.assignedTranslators.includes(user?.id)).length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    My Projects ({jobs.filter(j => j.assignedTranslators.includes(user?.id)).length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('completed')}
                >
                    History
                </button>
            </div>

            <div className="jobs-grid">
                {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                        <div key={job.id} className="job-card">
                            <div className="job-card-header">
                                <span className="job-id">#{job.id.toString().slice(0, 8)}</span>
                                <span className="match-tag" style={{ background: 'rgba(0, 255, 255, 0.1)', color: 'var(--neon-cyan)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>
                                    {job.assignedTranslators.includes(user?.id) ? 'Assigned' : '100% Match'}
                                </span>
                            </div>
                            <div className="job-card-body">
                                <h3>{job.name || job.pair}</h3>
                                <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem' }}>{job.pair}</p>
                                <div className="job-details">
                                    <div className="detail">
                                        <span>Words</span>
                                        <strong>{job.wordCount?.toLocaleString() || '---'}</strong>
                                    </div>
                                    <div className="detail">
                                        <span>Deadline</span>
                                        <strong>{job.deadline}</strong>
                                    </div>
                                    <div className="detail">
                                        <span>Budget</span>
                                        <strong>{job.budget}</strong>
                                    </div>
                                </div>
                            </div>
                            <div className="job-card-footer">
                                <button
                                    className={`primary-btn ${job.assignedTranslators.includes(user?.id) ? '' : 'outline'}`}
                                    onClick={() => handleApply(job.id)}
                                >
                                    {job.assignedTranslators.includes(user?.id) ? 'Open in CAT Tool ↗' : 'Apply Now'}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', width: '100%' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                        <h3>No projects found</h3>
                        <p style={{ color: '#666' }}>Wait for new projects to be posted in your language pair.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Jobs;
