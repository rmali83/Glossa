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
        <div className="home-container page-container">
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
                    <h1 className="hero-title text-neon-cyan">GLOSSA</h1>
                    <p className="hero-subtitle min-height-subtitle">
                        <TypewriterText phrases={dynamicPhrases} />
                    </p>
                    <div className="hero-actions">
                        <Link to="/translation" className="btn btn-primary">
                            Translation Services
                        </Link>
                        <Link to="/content-writing" className="btn btn-secondary">
                            Content Writing
                        </Link>
                        <Link to="/web-development" className="btn btn-primary">
                            Web & App Dev
                        </Link>
                    </div>
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
                    <h2 className="text-neon-green">Digital Solutions</h2>
                    <p>
                        Modern web and mobile applications tailored to your business.
                        Full-stack development and UI/UX design.
                    </p>
                </div>
                <div className="feature-card glass-panel">
                    <h2 className="text-neon-purple">Freelance Hub</h2>
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
