import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './DashboardPages.css';
import './DashboardTheme.css';

const TranslatorProfile = () => {
    const { userId } = useParams(); // If viewing another user's profile
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [projects, setProjects] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({
        totalProjects: 0,
        completedProjects: 0,
        totalWords: 0,
        avgRating: 0,
        totalEarnings: 0,
        onTimeDelivery: 0
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, portfolio, reviews, settings

    const profileId = userId || user?.id;
    const isOwnProfile = !userId || userId === user?.id;

    useEffect(() => {
        fetchProfileData();
    }, [profileId]);

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileId)
                .single();
            
            setProfile(profileData);
            setEditData(profileData);

            // Fetch projects
            const { data: projectsData } = await supabase
                .from('projects')
                .select('*')
                .eq('translator_id', profileId)
                .order('created_at', { ascending: false });
            
            setProjects(projectsData || []);

            // Fetch reviews (mock data for now - you'll need to create reviews table)
            setReviews([
                {
                    id: 1,
                    project_name: 'Website Translation',
                    rating: 5,
                    comment: 'Excellent work! Very professional and delivered on time.',
                    reviewer_name: 'John Doe',
                    created_at: '2024-03-01'
                },
                {
                    id: 2,
                    project_name: 'Legal Document Translation',
                    rating: 4,
                    comment: 'Good quality translation. Minor revisions needed.',
                    reviewer_name: 'Jane Smith',
                    created_at: '2024-02-15'
                }
            ]);

            // Calculate stats
            const completedProjects = projectsData?.filter(p => p.status === 'completed').length || 0;
            const totalWords = projectsData?.reduce((sum, p) => sum + (p.total_words || 0), 0) || 0;
            const totalEarnings = projectsData?.reduce((sum, p) => sum + (p.total_payment || 0), 0) || 0;
            const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

            setStats({
                totalProjects: projectsData?.length || 0,
                completedProjects,
                totalWords,
                avgRating: avgRating.toFixed(1),
                totalEarnings,
                onTimeDelivery: completedProjects > 0 ? ((completedProjects / projectsData.length) * 100).toFixed(0) : 0
            });
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editData.full_name,
                    bio: editData.bio,
                    specializations: editData.specializations,
                    language_pairs: editData.language_pairs,
                    rate: editData.rate,
                    availability: editData.availability
                })
                .eq('id', profileId);

            if (error) throw error;

            alert('Profile updated successfully!');
            setIsEditing(false);
            fetchProfileData();
        } catch (err) {
            alert('Error updating profile: ' + err.message);
        }
    };

    const renderStars = (rating) => {
        return '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '');
    };

    if (loading) return <div className="dashboard-page loading-state">Loading Profile...</div>;
    if (!profile) return <div className="dashboard-page">Profile not found</div>;

    return (
        <div className="dashboard-page fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>
                    {isOwnProfile ? 'My Profile' : `${profile.full_name}'s Profile`}
                </h1>
                {isOwnProfile && (
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        style={{
                            padding: '12px 24px',
                            background: isEditing ? '#ef4444' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        {isEditing ? 'Cancel' : '✏️ Edit Profile'}
                    </button>
                )}
            </div>

            {/* Profile Header Card */}
            <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
                <div style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'start' }}>
                    {/* Avatar */}
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        color: '#fff',
                        fontWeight: 'bold'
                    }}>
                        {profile.full_name?.charAt(0) || 'T'}
                    </div>

                    {/* Profile Info */}
                    <div style={{ flex: 1 }}>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editData.full_name || ''}
                                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                                style={{
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    color: '#fff',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    width: '100%',
                                    marginBottom: '10px'
                                }}
                            />
                        ) : (
                            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginBottom: '10px' }}>
                                {profile.full_name}
                            </h2>
                        )}
                        
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                            <span className="status-pill completed">{profile.user_type}</span>
                            <span style={{ color: '#fbbf24', fontSize: '1.2rem' }}>
                                {renderStars(parseFloat(stats.avgRating))} {stats.avgRating}
                            </span>
                            <span style={{ color: '#666' }}>
                                📧 {profile.email}
                            </span>
                        </div>

                        {isEditing ? (
                            <textarea
                                value={editData.bio || ''}
                                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    resize: 'vertical'
                                }}
                            />
                        ) : (
                            <p style={{ color: '#999', lineHeight: '1.6' }}>
                                {profile.bio || 'No bio provided yet.'}
                            </p>
                        )}

                        {isEditing && (
                            <button
                                onClick={handleSaveProfile}
                                style={{
                                    marginTop: '15px',
                                    padding: '10px 20px',
                                    background: '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                💾 Save Changes
                            </button>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', minWidth: '200px' }}>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                                {stats.completedProjects}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
                                Completed Projects
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                ${stats.totalEarnings.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
                                Total Earnings
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '2rem' }}>
                <div className="payment-stat-card">
                    <label>Total Projects</label>
                    <h2 className="stat-value">{stats.totalProjects}</h2>
                </div>
                <div className="payment-stat-card">
                    <label>Words Translated</label>
                    <h2 className="stat-value">{stats.totalWords.toLocaleString()}</h2>
                </div>
                <div className="payment-stat-card">
                    <label>Average Rating</label>
                    <h2 className="stat-value">{stats.avgRating} ⭐</h2>
                </div>
                <div className="payment-stat-card">
                    <label>On-Time Delivery</label>
                    <h2 className="stat-value">{stats.onTimeDelivery}%</h2>
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
                {['overview', 'portfolio', 'reviews', 'settings'].map(tab => (
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h3>Skills & Specializations</h3>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ color: '#999', fontSize: '0.9rem', marginBottom: '10px', display: 'block' }}>
                                    Language Pairs
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {profile.language_pairs?.map((pair, i) => (
                                        <span key={i} className="status-pill" style={{ background: 'rgba(102, 126, 234, 0.2)' }}>
                                            {pair}
                                        </span>
                                    )) || <span style={{ color: '#666' }}>No language pairs added</span>}
                                </div>
                            </div>
                            <div>
                                <label style={{ color: '#999', fontSize: '0.9rem', marginBottom: '10px', display: 'block' }}>
                                    Specializations
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {profile.specializations?.map((spec, i) => (
                                        <span key={i} className="status-pill" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                                            {spec}
                                        </span>
                                    )) || <span style={{ color: '#666' }}>No specializations added</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-header">
                            <h3>Availability & Rates</h3>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ color: '#999', fontSize: '0.9rem' }}>Hourly Rate</label>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', marginTop: '5px' }}>
                                    ${profile.rate}/hr
                                </div>
                            </div>
                            <div>
                                <label style={{ color: '#999', fontSize: '0.9rem' }}>Availability</label>
                                <div style={{ fontSize: '1.2rem', color: '#fff', marginTop: '5px' }}>
                                    {profile.availability || 'Not specified'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Project Portfolio</h3>
                    </div>
                    <div className="table-container">
                        <table className="payment-table">
                            <thead>
                                <tr>
                                    <th>Project Name</th>
                                    <th>Languages</th>
                                    <th>Words</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>Completed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                            No projects yet
                                        </td>
                                    </tr>
                                ) : (
                                    projects.map(project => (
                                        <tr key={project.id}>
                                            <td><strong>{project.name}</strong></td>
                                            <td style={{ fontSize: '0.85rem' }}>
                                                {project.source_language} → {project.target_language}
                                            </td>
                                            <td>{project.total_words?.toLocaleString() || 0}</td>
                                            <td>${project.total_payment?.toFixed(2) || '0.00'}</td>
                                            <td>
                                                <span className={`status-pill ${
                                                    project.status === 'completed' ? 'completed' :
                                                    project.status === 'in_progress' ? 'in-progress' :
                                                    'pending'
                                                }`}>
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.8rem', color: '#666' }}>
                                                {project.completed_at ? new Date(project.completed_at).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Client Reviews</h3>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                        {reviews.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                                No reviews yet
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {reviews.map(review => (
                                    <div key={review.id} style={{
                                        padding: '20px',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <div>
                                                <strong style={{ color: '#fff' }}>{review.reviewer_name}</strong>
                                                <span style={{ color: '#666', fontSize: '0.85rem', marginLeft: '10px' }}>
                                                    {review.project_name}
                                                </span>
                                            </div>
                                            <div style={{ color: '#fbbf24' }}>
                                                {renderStars(review.rating)}
                                            </div>
                                        </div>
                                        <p style={{ color: '#999', lineHeight: '1.6' }}>
                                            {review.comment}
                                        </p>
                                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && isOwnProfile && (
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Profile Settings</h3>
                    </div>
                    <div style={{ padding: '2rem' }}>
                        <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                            Settings coming soon...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TranslatorProfile;
