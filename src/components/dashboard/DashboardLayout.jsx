import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './DashboardLayout.css';
import { mockUser } from '../../data/mockData';

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
        { name: 'My Profile', path: '/dashboard/profile', icon: '👤' },
        { name: 'Available Jobs', path: '/dashboard/jobs', icon: '💼' },
        { name: 'Payments', path: '/dashboard/payments', icon: '💰' },
        { name: 'Settings', path: '/dashboard/settings', icon: '⚙️' },
    ];

    const handleLogout = () => {
        // UI only logout logic
        navigate('/');
    };

    return (
        <div className={`dashboard-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <div className="logo-section">
                        <span className="logo-text">GLOSSA</span>
                        <span className="logo-dot">.</span>
                    </div>
                    <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? '❮' : '❯'}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {isSidebarOpen && <span className="nav-text">{item.name}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <span className="nav-icon">🚪</span>
                        {isSidebarOpen && <span className="nav-text">Logout</span>}
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-left">
                        <h1>{menuItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}</h1>
                    </div>
                    <div className="header-right">
                        <div className="user-profile-summary">
                            <div className="user-info">
                                <span className="user-name">{mockUser.fullName}</span>
                                <span className="user-role">{mockUser.role}</span>
                            </div>
                            <div className="user-avatar">
                                {mockUser.fullName.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
