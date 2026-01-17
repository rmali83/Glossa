import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container page-container">
            <section className="hero-section">
                <h1 className="hero-title text-neon-cyan">GLOSSA</h1>
                <p className="hero-subtitle">
                    Bridging the gap between languages and ideas.
                </p>
                <div className="hero-actions">
                    <Link to="/translation" className="btn btn-primary">
                        Translation Services
                    </Link>
                    <Link to="/content-writing" className="btn btn-secondary">
                        Content Writing
                    </Link>
                </div>
            </section>

            <section className="features-section">
                <div className="feature-card glass-panel">
                    <h2 className="text-neon-cyan">Global Reach</h2>
                    <p>
                        Connecting you with expert translators from every continent.
                        We cover all languages across the globe.
                    </p>
                </div>
                <div className="feature-card glass-panel">
                    <h2 className="text-neon-pink">Creative Power</h2>
                    <p>
                        Engaging content writing that speaks to your audience.
                        From blogs to technical documentation.
                    </p>
                </div>
                <div className="feature-card glass-panel">
                    <h2 className="text-neon-green">Freelance Hub</h2>
                    <p>
                        Join our growing community of language experts.
                        Competitive rates and flexible opportunities.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default Home;
