import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import TypewriterText from '../components/TypewriterText';

const dynamicPhrases = [
    "Bridging the gap between languages and ideas.",
    "Connecting voices across every continent.",
    "Empowering global communication through technology.",
    "Your gateway to professional linguistic excellence.",
    "Translating the future, one word at a time."
];

const Home = () => {

    return (
        <div className="home-container">
            <section className="hero-section">
                <div className="hero-video-container">
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="hero-video"
                    >
                        <source src="/assets/hero-video.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <div className="hero-overlay"></div>
                </div>

                <div className="hero-content">
                    <h1 className="hero-title gradient-text-vibrant">
                        Translation & Content
                        <br />
                        <span className="gradient-text">Fully Automated</span>
                    </h1>
                    <p className="hero-subtitle-modern">
                        <TypewriterText phrases={dynamicPhrases} className="text-gradient" />
                    </p>
                    <div className="hero-actions-modern">
                        <Link to="/translation" className="btn btn-orange">
                            Get Started Free →
                        </Link>
                        <Link to="/content-writing" className="btn btn-secondary">
                            Learn More
                        </Link>
                    </div>
                    
                    {/* Trust Indicators */}
                    <div className="trust-indicators">
                        <div className="trust-item">
                            <span className="trust-number gradient-text">10k+</span>
                            <span className="trust-label">Active Users</span>
                        </div>
                        <div className="trust-item">
                            <span className="trust-number gradient-text">50+</span>
                            <span className="trust-label">Languages</span>
                        </div>
                        <div className="trust-item">
                            <span className="trust-number gradient-text">99%</span>
                            <span className="trust-label">Satisfaction</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="page-container">
                <section className="features-section-modern">
                    <div className="feature-card-modern modern-card fade-in-up">
                        <div className="feature-icon" style={{background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'}}>
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                            </svg>
                        </div>
                        <h3 className="gradient-text">Global Translation</h3>
                        <p>
                            Connect with expert translators worldwide. AI-powered quality checks and human expertise combined.
                        </p>
                    </div>
                    
                    <div className="feature-card-modern modern-card fade-in-up" style={{animationDelay: '0.1s'}}>
                        <div className="feature-icon" style={{background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'}}>
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </div>
                        <h3 className="gradient-text">Content Creation</h3>
                        <p>
                            Professional content writing that engages. From blogs to technical docs, we've got you covered.
                        </p>
                    </div>
                    
                    <div className="feature-card-modern modern-card fade-in-up" style={{animationDelay: '0.2s'}}>
                        <div className="feature-icon" style={{background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'}}>
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                            </svg>
                        </div>
                        <h3 className="gradient-text">Web Development</h3>
                        <p>
                            Modern web and mobile apps built with cutting-edge technology. Full-stack solutions for your business.
                        </p>
                    </div>
                    
                    <div className="feature-card-modern modern-card fade-in-up" style={{animationDelay: '0.3s'}}>
                        <div className="feature-icon" style={{background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)'}}>
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                        </div>
                        <h3 className="gradient-text">Freelance Network</h3>
                        <p>
                            Join our thriving community of language experts. Competitive rates and flexible opportunities await.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Home;
