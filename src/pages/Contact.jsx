import React from 'react';
import './Contact.css';

const Contact = () => {
    return (
        <div className="contact-container page-container">
            <h1 className="neon-text-flicker title">GET IN TOUCH</h1>

            <div className="contact-info glass-panel">
                <div className="info-item">
                    <h2 className="text-neon-cyan">Email Us</h2>
                    <p>hello@glossa.agency</p>
                </div>
                <div className="info-item">
                    <h2 className="text-neon-green">Call Us</h2>
                    <p>+1 (555) 123-4567</p>
                </div>
                <div className="info-item">
                    <h2 className="text-neon-pink">Visit Us</h2>
                    <p>123 Neon Avenue, Tech City, Digital World</p>
                </div>
            </div>
        </div>
    );
};

export default Contact;
