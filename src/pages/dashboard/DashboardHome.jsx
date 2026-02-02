import React from 'react';
import './DashboardPages.css';
import { statsCards, recentActivity, mockUser } from '../../data/mockData';

const DashboardHome = () => {
    return (
        <div className="dashboard-page fade-in">
            <div className="welcome-section">
                <h2>Welcome back, {mockUser.fullName}! 👋</h2>
                <p>Here's what's happening today.</p>
            </div>

            <div className="stats-grid">
                {statsCards.map((card, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-icon-wrapper">
                            <span className="stat-icon">
                                {card.icon === 'briefcase' && '💼'}
                                {card.icon === 'clock' && '🕒'}
                                {card.icon === 'check-circle' && '✅'}
                                {card.icon === 'dollar-sign' && '💰'}
                            </span>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">{card.label}</span>
                            <span className="stat-value">{card.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card recent-activity">
                    <div className="card-header">
                        <h3>Recent Activity</h3>
                        <button className="text-btn">View All</button>
                    </div>
                    <div className="activity-list">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="activity-item">
                                <div className={`activity-dot ${activity.type}`}></div>
                                <div className="activity-details">
                                    <p className="activity-text">{activity.text}</p>
                                    <span className="activity-time">{activity.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-card status-overview">
                    <div className="card-header">
                        <h3>Performance</h3>
                    </div>
                    <div className="chart-placeholder">
                        <div className="bar-chart">
                            {[60, 80, 45, 90, 70, 85, 95].map((h, i) => (
                                <div key={i} className="bar-wrapper">
                                    <div className="bar" style={{ height: `${h}%` }}></div>
                                    <span className="bar-label">Day {i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
