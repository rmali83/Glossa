import React from 'react';
import './DashboardPages.css';
import { mockUser } from '../../data/mockData';

const Profile = () => {
    return (
        <div className="dashboard-page fade-in">
            <div className="profile-header">
                <div className="profile-banner"></div>
                <div className="profile-info-container">
                    <div className="large-avatar">{mockUser.fullName.charAt(0)}</div>
                    <div className="profile-name-section">
                        <h2>{mockUser.fullName}</h2>
                        <p className="profile-tagline">Professional Translator • {mockUser.role}</p>
                    </div>
                    <button className="edit-profile-btn">Edit Profile</button>
                </div>
            </div>

            <div className="profile-grid">
                <div className="profile-section">
                    <h3>Personal Information</h3>
                    <div className="info-group">
                        <label>Full Name</label>
                        <p>{mockUser.fullName}</p>
                    </div>
                    <div className="info-group">
                        <label>Email Address</label>
                        <p>{mockUser.email}</p>
                    </div>
                    <div className="info-group">
                        <label>Time Zone</label>
                        <p>{mockUser.timeZone}</p>
                    </div>
                </div>

                <div className="profile-section">
                    <h3>Skills & Availability</h3>
                    <div className="info-group">
                        <label>Language Pairs</label>
                        <div className="pill-container">
                            {mockUser.languages.map((lang, idx) => (
                                <span key={idx} className="pill">{lang}</span>
                            ))}
                        </div>
                    </div>
                    <div className="info-group">
                        <label>Experience Level</label>
                        <p>Expert (5+ years)</p>
                    </div>
                    <div className="info-group">
                        <label>Availability</label>
                        <p>Available (Full-time)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
