import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <nav className="navbar glass-panel">
            <div className="navbar-logo text-neon-cyan">
                <Link to="/">GLOSSA</Link>
            </div>
            <ul className="navbar-links">
                <li>
                    <Link to="/" className={isActive('/')}>Home</Link>
                </li>
                <li>
                    <Link to="/translation" className={isActive('/translation')}>Translation</Link>
                </li>
                <li>
                    <Link to="/content-writing" className={isActive('/content-writing')}>Content Writing</Link>
                </li>
                <li>
                    <Link to="/join-us" className={`btn-nav ${isActive('/join-us')}`}>Join as Translator</Link>
                </li>
                <li>
                    <Link to="/contact" className={isActive('/contact')}>Contact</Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
