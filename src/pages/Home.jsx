import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const dynamicPhrases = [
    "Bridging the gap between languages and ideas.",
    "Connecting voices across every continent.",
    "Empowering global communication through technology.",
    "Your gateway to professional linguistic excellence.",
    "Translating the future, one word at a time."
];

const Home = () => {
    const [displayText, setDisplayText] = useState('');
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(100);

    useEffect(() => {
        const handleTyping = () => {
            const currentPhrase = dynamicPhrases[phraseIndex];

            if (isDeleting) {
                setDisplayText(currentPhrase.substring(0, displayText.length - 1));
                setTypingSpeed(50);
            } else {
                setDisplayText(currentPhrase.substring(0, displayText.length + 1));
                setTypingSpeed(100);
            }

            if (!isDeleting && displayText === currentPhrase) {
                setTimeout(() => setIsDeleting(true), 2000);
            } else if (isDeleting && displayText === '') {
                setIsDeleting(false);
                setPhraseIndex((prev) => (prev + 1) % dynamicPhrases.length);
            }
        };

        const timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [displayText, isDeleting, phraseIndex, typingSpeed]);

    return (
        <div className="home-container page-container">
            <section className="hero-section">
                <h1 className="hero-title text-neon-cyan">GLOSSA</h1>
                <p className="hero-subtitle min-height-subtitle">
                    {displayText}<span className="cursor">|</span>
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
