import React, { useState, useEffect } from 'react';
import './DashboardPages.css';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

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
        fetchProfile();
    }, [user]);

    const fullName = profile?.full_name || user?.user_metadata?.full_name || 'Translator';
    const email = user?.email;
    const userRole = profile?.user_type || user?.user_metadata?.user_type || 'Professional';

    if (loading) return <div className="dashboard-page loading-state">Loading profile...</div>;

    return (
        <div className="dashboard-page fade-in">
            <div className="profile-header">
                <div className="profile-banner"></div>
                <div className="profile-info-container">
                    <div className="large-avatar">{fullName.charAt(0)}</div>
                    <div className="profile-name-section">
                        <h2>{fullName} <span style={{ fontSize: '0.8rem', background: '#2d6a4f', color: '#52b788', padding: '2px 8px', borderRadius: '10px', marginLeft: '10px' }}>✓ Verified</span></h2>
                        <p className="profile-tagline">{profile?.native_language ? `${profile.native_language} Native` : ''} • {userRole}</p>
                    </div>
                    <button className="edit-profile-btn">Edit Profile</button>
                </div>
            </div>

            <div className="profile-grid">
                <div className="profile-section">
                    <h3>Contact & Personal</h3>
                    <div className="info-group">
                        <label>Email Address</label>
                        <p>{email}</p>
                    </div>
                    <div className="info-group">
                        <label>Phone / WhatsApp</label>
                        <p>{profile?.phone || 'Not provided'}</p>
                    </div>
                    <div className="info-group">
                        <label>Location</label>
                        <p>{profile?.city}, {profile?.country}</p>
                    </div>
                    <div className="info-group">
                        <label>Time Zone</label>
                        <p>{profile?.timezone}</p>
                    </div>
                </div>

                <div className="profile-section">
                    <h3>Professional Info</h3>
                    <div className="info-group">
                        <label>Language Expertise</label>
                        <div className="pill-container">
                            {(profile?.language_pairs || profile?.source_languages || []).map((lang, idx) => (
                                <span key={idx} className="pill">{lang}</span>
                            ))}
                        </div>
                    </div>
                    <div className="info-group">
                        <label>Experience & Rate</label>
                        <p>{profile?.years_experience || 'Intermediate'} • {profile?.rate ? `${profile.rate} ${profile.currency || 'USD'}/hr` : 'Rate private'}</p>
                    </div>
                    <div className="info-group">
                        <label>Professional Tools</label>
                        <div className="pill-container">
                            {(profile?.tools || ['Glossa Portal']).map((tool, idx) => (
                                <span key={idx} className="pill tool-pill" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>{tool}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
