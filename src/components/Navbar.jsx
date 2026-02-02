import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav className="navbar glass-panel">
            <div className="navbar-logo text-neon-cyan">
                <Link to="/" onClick={closeMenu}>GLOSSA</Link>
            </div>

            <div className={`menu-toggle ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
                <span></span>
                <span></span>
                <span></span>
            </div>

            <ul className={`navbar-links ${isMenuOpen ? 'mobile-open' : ''}`}>
                <li>
                    <Link to="/" className={isActive('/')} onClick={closeMenu}>Home</Link>
                </li>
                <li>
                    <Link to="/translation" className={isActive('/translation')} onClick={closeMenu}>Translation</Link>
                </li>
                <li>
                    <Link to="/content-writing" className={isActive('/content-writing')} onClick={closeMenu}>Content Writing</Link>
                </li>
                <li>
                    <Link to="/web-development" className={isActive('/web-development')} onClick={closeMenu}>Web & App Dev</Link>
                </li>
                <li>
                    <Link to="/contact" className={isActive('/contact')} onClick={closeMenu}>Contact</Link>
                </li>
                <li>
                    <Link to="/onboarding" className={isActive('/onboarding')} onClick={closeMenu}>Onboarding</Link>
                </li>
                <li>
                    <Link to="/dashboard" className={`btn-nav ${isActive('/dashboard')}`} onClick={closeMenu}>Dashboard</Link>
                </li>
                <li>
                    <Link to="/join-us" className={`btn-nav ${isActive('/join-us')}`} onClick={closeMenu}>Join Glossa</Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
