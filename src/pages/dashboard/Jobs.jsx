import React, { useState } from 'react';
import './DashboardPages.css';
import { mockJobs } from '../../data/mockData';

const Jobs = () => {
    const [activeTab, setActiveTab] = useState('available');

    const filteredJobs = mockJobs.filter(job => job.status === activeTab);

    return (
        <div className="dashboard-page fade-in">
            <div className="tabs-header">
                <button
                    className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
                    onClick={() => setActiveTab('available')}
                >
                    Available Jobs
                </button>
                <button
                    className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    Active Jobs
                </button>
                <button
                    className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('completed')}
                >
                    Completed Jobs
                </button>
            </div>

            <div className="jobs-grid">
                {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                        <div key={job.id} className="job-card">
                            <div className="job-card-header">
                                <span className="job-id">{job.id}</span>
                                <span className={`status-badge ${job.status}`}>{job.status}</span>
                            </div>
                            <div className="job-card-body">
                                <h3>{job.pair}</h3>
                                <div className="job-details">
                                    <div className="detail">
                                        <span>Words</span>
                                        <strong>{job.wordCount.toLocaleString()}</strong>
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
                                <button className="primary-btn">
                                    {job.status === 'available' ? 'Accept Job' : 'View Details'}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <p>No {activeTab} jobs found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Jobs;
