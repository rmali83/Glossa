import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './DashboardPages.css';
import './DashboardTheme.css';

const UserProfile = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState(null);
    const [projects, setProjects] = useState([]);
    const [annotations, setAnnotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({});

    // Check if current user is admin
    const isAdmin = currentUser?.user_metadata?.user_type === 'Agencies' || currentUser?.email === 'rmali@live.com';
    const isOwnProfile = currentUser?.id === userId;

    useEffect(() => {
        if (!isAdmin && !isOwnProfile) {
            navigate('/dashboard');
            return;
        }
        fetchUserProfile();
    }, [userId, isAdmin, isOwnProfile, navigate]);

    const fetchUserProfile = async () => {
        setLoading(true);
        try {
            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;
            setUserProfile(profile);
            setEditData(profile);

            // Fetch user's projects
            const { data: userProjects, error: projectsError } = await supabase
                .from('projects')
                .select(`
                    *,
                    segments(count)
                `)
                .or(`translator_id.eq.${userId},reviewer_id.eq.${userId},created_by.eq.${userId}`);

            if (projectsError) throw projectsError;
            setProjects(userProjects || []);

            // Fetch user's annotations (performance metrics)
            const { data: userAnnotations, error: annotationsError } = await supabase
                .from('annotations')
                .select('*')
                .eq('annotator_id', userId)
                .order('created_at', { ascending: false })
                .limit(100);

            if (annotationsError) throw annotationsError;
            setAnnotations(userAnnotations || []);

        } catch (err) {
            console.error('Error fetching user profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update(editData)
                .eq('id', userId);

            if (error) throw error;

            setUserProfile(editData);
            setEditing(false);
            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Error updating profile');
        }
    };

    const calculatePerformanceMetrics = () => {
        if (annotations.length === 0) {
            return {
                avgQuality: 0,
                totalAnnotations: 0,
                errorRate: 0,
                productivity: 0
            };
        }

        const qualityRatings = annotations.filter(a => a.quality_rating).map(a => a.quality_rating);
        const avgQuality = qualityRatings.length > 0 
            ? (qualityRatings.reduce((sum, rating) => sum + rating, 0) / qualityRatings.length).toFixed(1)
            : 0;

        const errorsCount = annotations.filter(a => 
            a.error_fluency || a.error_grammar || a.error_terminology || a.error_style || a.error_accuracy
        ).length;

        const errorRate = ((errorsCount / annotations.length) * 100).toFixed(1);

        return {
            avgQuality: parseFloat(avgQuality),
            totalAnnotations: annotations.length,
            errorRate: parseFloat(errorRate),
            productivity: Math.round(annotations.length / Math.max(1, projects.length))
        };
    };

    const metrics = calculatePerformanceMetrics();

    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="loading-state">Loading user profile...</div>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="dashboard-page">
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    User not found
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '2rem'
                    }}>
                        {userProfile.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>
                            {userProfile.full_name || 'Unnamed User'}
                        </h1>
                        <p style={{ color: '#888', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                            {userProfile.user_type} • {userProfile.email}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <span style={{
                                padding: '4px 12px',
                                background: 'rgba(16, 185, 129, 0.2)',
                                color: '#10b981',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                            }}>
                                ✓ Verified
                            </span>
                            <span style={{
                                padding: '4px 12px',
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#60a5fa',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                            }}>
                                {projects.length} Projects
                            </span>
                        </div>
                    </div>
                </div>
                
                {(isAdmin || isOwnProfile) && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => setEditing(!editing)}
                            style={{
                                padding: '12px 24px',
                                background: editing ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: editing ? '#f87171' : '#60a5fa',
                                border: `1px solid ${editing ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}
                        >
                            {editing ? 'Cancel' : 'Edit Profile'}
                        </button>
                        {editing && (
                            <button
                                onClick={handleSaveProfile}
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Save Changes
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Performance Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="dashboard-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                        {metrics.avgQuality}/5
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                        Avg Quality Score
                    </div>
                </div>
                <div className="dashboard-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                        {metrics.totalAnnotations}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                        Total Annotations
                    </div>
                </div>
                <div className="dashboard-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: metrics.errorRate > 20 ? '#ef4444' : '#f59e0b' }}>
                        {metrics.errorRate}%
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                        Error Rate
                    </div>
                </div>
                <div className="dashboard-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                        {metrics.productivity}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                        Annotations/Project
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'projects', label: 'Projects' },
                    { key: 'performance', label: 'Performance' },
                    { key: 'settings', label: 'Settings' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '12px 24px',
                            background: activeTab === tab.key ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                            color: activeTab === tab.key ? '#10b981' : '#888',
                            border: `1px solid ${activeTab === tab.key ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Personal Information */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h3>Personal Information</h3>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem' }}>
                                    Full Name
                                </label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData.full_name || ''}
                                        onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '6px',
                                            color: '#fff'
                                        }}
                                    />
                                ) : (
                                    <div style={{ color: '#fff' }}>{userProfile.full_name || 'Not specified'}</div>
                                )}
                            </div>
                            
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem' }}>
                                    Email
                                </label>
                                <div style={{ color: '#fff' }}>{userProfile.email}</div>
                            </div>
                            
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem' }}>
                                    User Type
                                </label>
                                {editing && isAdmin ? (
                                    <select
                                        value={editData.user_type || ''}
                                        onChange={(e) => setEditData({ ...editData, user_type: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '6px',
                                            color: '#fff'
                                        }}
                                    >
                                        <option value="Freelance Translator">Freelance Translator</option>
                                        <option value="Reviewer">Reviewer</option>
                                        <option value="Agencies">Agency</option>
                                    </select>
                                ) : (
                                    <div style={{ color: '#fff' }}>{userProfile.user_type || 'Not specified'}</div>
                                )}
                            </div>
                            
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem' }}>
                                    Location
                                </label>
                                <div style={{ color: '#fff' }}>
                                    {userProfile.city && userProfile.country 
                                        ? `${userProfile.city}, ${userProfile.country}` 
                                        : 'Not specified'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h3>Professional Information</h3>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem' }}>
                                    Language Pairs
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {userProfile.language_pairs?.map((pair, index) => (
                                        <span
                                            key={index}
                                            style={{
                                                padding: '4px 8px',
                                                background: 'rgba(59, 130, 246, 0.2)',
                                                color: '#60a5fa',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            {pair}
                                        </span>
                                    )) || <span style={{ color: '#666' }}>Not specified</span>}
                                </div>
                            </div>
                            
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem' }}>
                                    Experience Level
                                </label>
                                <div style={{ color: '#fff' }}>{userProfile.years_experience || 'Not specified'}</div>
                            </div>
                            
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem' }}>
                                    Availability
                                </label>
                                <div style={{ color: '#fff' }}>
                                    {userProfile.availability ? `${userProfile.availability} hours/week` : 'Not specified'}
                                </div>
                            </div>
                            
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem' }}>
                                    Rate
                                </label>
                                <div style={{ color: '#fff' }}>
                                    {userProfile.rate ? `$${userProfile.rate}/hour` : 'Not specified'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'projects' && (
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>User Projects ({projects.length})</h3>
                    </div>
                    <div className="table-container">
                        <table className="payment-table">
                            <thead>
                                <tr>
                                    <th>Project Name</th>
                                    <th>Languages</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Segments</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                            No projects found for this user.
                                        </td>
                                    </tr>
                                ) : (
                                    projects.map(project => (
                                        <tr key={project.id}>
                                            <td style={{ fontWeight: '600', color: '#fff' }}>
                                                {project.name}
                                            </td>
                                            <td style={{ fontSize: '0.8rem', color: '#ccc' }}>
                                                {project.source_language} → {project.target_language}
                                            </td>
                                            <td>
                                                <span className="status-pill">
                                                    {project.translator_id === userId ? 'Translator' :
                                                     project.reviewer_id === userId ? 'Reviewer' :
                                                     project.created_by === userId ? 'Creator' : 'Unknown'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${project.status}`}>
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td style={{ color: '#ccc' }}>
                                                {project.segments?.[0]?.count || 0}
                                            </td>
                                            <td style={{ fontSize: '0.8rem', color: '#888' }}>
                                                {new Date(project.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'performance' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Quality Trends */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h3>Quality Trends</h3>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                                <p>Quality trend chart would go here</p>
                                <p style={{ fontSize: '0.8rem' }}>
                                    Average quality: {metrics.avgQuality}/5 over {metrics.totalAnnotations} annotations
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Error Analysis */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h3>Error Analysis</h3>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                                <p>Error breakdown chart would go here</p>
                                <p style={{ fontSize: '0.8rem' }}>
                                    Error rate: {metrics.errorRate}% across all projects
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;