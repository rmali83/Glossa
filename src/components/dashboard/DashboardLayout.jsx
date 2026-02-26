import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './DashboardLayout.css';
import { mockUser } from '../../data/mockData';

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    const { user, signOut } = useAuth();

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
        { name: 'My Profile', path: '/dashboard/profile', icon: '👤' },
        { name: 'Messages', path: '/dashboard/messages', icon: '💬' },
        { name: 'Available Jobs', path: '/dashboard/jobs', icon: '💼' },
        { name: 'Payments', path: '/dashboard/payments', icon: '💰' },
        { name: 'Settings', path: '/dashboard/settings', icon: '⚙️' },
    ];

    // Only show Admin for agencies/admins
    const isAdmin = user?.user_metadata?.user_type === 'Agencies' || user?.email === 'rmali@live.com';
    const isTranslator = user?.user_metadata?.user_type === 'Freelance Translator' || user?.user_metadata?.user_type === 'Translator';
    const isReviewer = user?.user_metadata?.user_type === 'Reviewer';

    if (isTranslator || isReviewer || isAdmin) {
        // Insert right after Dashboard
        menuItems.splice(1, 0, { name: 'Glossa CAT', path: '/dashboard/cat', icon: '🧠' });
    }

    if (isAdmin) {
        menuItems.push({ name: 'Admin Control', path: '/dashboard/admin', icon: '🛡️' });
    }

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const userName = user?.user_metadata?.full_name || mockUser.fullName;
    const userRole = user?.user_metadata?.user_type || mockUser.role;

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
                    <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Notification Bell */}
                        <div className="notification-bubble" style={{ position: 'relative', cursor: 'pointer' }}>
                            <span style={{ fontSize: '1.4rem' }}>🔔</span>
                            <div style={{
                                position: 'absolute',
                                top: '-2px',
                                right: '-2px',
                                width: '10px',
                                height: '10px',
                                background: '#ff4d4d',
                                borderRadius: '50%',
                                border: '2px solid #0a0a1a',
                                boxShadow: '0 0 5px #ff4d4d'
                            }}></div>
                        </div>

                        <div className="user-profile-summary">
                            <div className="user-info">
                                <span className="user-name">{userName}</span>
                                <span className="user-role">{userRole}</span>
                            </div>
                            <div className="user-avatar" style={{ background: 'var(--neon-cyan)', color: '#000', fontWeight: 'bold' }}>
                                {userName.charAt(0)}
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
