import React from 'react';
import { Link } from 'react-router-dom';
import './WebDevelopment.css';

const WebDevelopment = () => {
    return (
        <div className="web-dev-container page-container">
            <h1 className="text-neon-cyan section-title">Web & Mobile Development</h1>
            <p className="intro-text">
                Cutting-edge digital solutions tailored to your business needs.
                From responsive websites to powerful mobile applications.
            </p>

            <div className="services-grid">
                <Link to="/web-development/custom-web" className="service-card glass-panel">
                    <h3>Custom Web Development</h3>
                    <p>
                        High-performance websites built with modern technologies like React, Next.js, and Node.js.
                        Responsive, fast, and SEO-friendly.
                    </p>
                </Link>
                <Link to="/web-development/mobile-app" className="service-card glass-panel">
                    <h3>Mobile App Development</h3>
                    <p>
                        Native and cross-platform mobile apps for iOS and Android.
                        Seamless user experience with intuitive interfaces.
                    </p>
                </Link>
                <Link to="/web-development/ecommerce" className="service-card glass-panel">
                    <h3>E-Commerce Solutions</h3>
                    <p>
                        Robust online stores with secure payment gateways, inventory management,
                        and user-friendly shopping experiences.
                    </p>
                </Link>
                <Link to="/web-development/ui-ux" className="service-card glass-panel">
                    <h3>UI/UX Design</h3>
                    <p>
                        User-centric design that blends aesthetics with functionality.
                        Wireframing, prototyping, and fully interactive high-fidelity designs.
                    </p>
                </Link>
                <Link to="/web-development/maintenance" className="service-card glass-panel">
                    <h3>Maintenance & Support</h3>
                    <p>
                        Ongoing technical support, security updates, and performance optimization
                        to keep your digital products running smoothly.
                    </p>
                </Link>
                <Link to="/web-development/api-integration" className="service-card glass-panel">
                    <h3>API Integration</h3>
                    <p>
                        Seamlessly connect your systems with third-party services and APIs
                        to extend functionality and automate workflows.
                    </p>
                </Link>
            </div>
        </div>
    );
};

export default WebDevelopment;
