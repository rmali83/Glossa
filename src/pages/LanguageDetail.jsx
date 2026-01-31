import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { languagesData } from '../data/languagesData';
import './LanguageDetail.css';

const LanguageDetail = () => {
    const { languageName } = useParams();

    // Find the language data by converting URL parameter back to proper name
    const language = Object.values(languagesData).find(lang =>
        lang.name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '') === languageName
    );

    // If language not found, redirect to translation page
    if (!language) {
        return <Navigate to="/translation" replace />;
    }

    // Map of language image names to actual paths
    const getLanguageImage = (imageName) => {
        // For now, we'll use the generate_image tool to create these
        // Return a placeholder or generated image
        return `/images/languages/${imageName}.jpg`;
    };

    return (
        <div className="language-detail-container page-container">
            <Link to="/translation" className="back-button">
                ← Back to Translation Services
            </Link>

            <div className="language-hero">
                <img
                    src={getLanguageImage(language.culturalImage)}
                    alt={`${language.name} culture`}
                    className="language-hero-image"
                    onError={(e) => {
                        // Fallback to gradient background if image fails to load
                        e.target.style.display = 'none';
                        e.target.parentElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    }}
                />
                <div className="language-hero-overlay">
                    <h1 className="language-name">{language.name}</h1>
                    <div className="language-region">{language.region}</div>
                </div>
            </div>

            <div className="language-content">
                <div className="info-section">
                    <h2>Introduction</h2>
                    <p className="intro-highlight">{language.intro}</p>
                </div>

                <div className="info-section">
                    <h2>Historical Background</h2>
                    <p>{language.history}</p>
                </div>

                <div className="info-section">
                    <h2>Geographic Distribution</h2>
                    <p>{language.whereSpoken}</p>

                    <div className="stats-grid">
                        <div className="stat-box">
                            <div className="stat-label">Total Speakers</div>
                            <div className="stat-value">{language.speakers.split('(')[0]}</div>
                        </div>
                        {language.speakers.includes('native') && (
                            <div className="stat-box">
                                <div className="stat-label">Breakdown</div>
                                <div className="stat-value" style={{ fontSize: '1rem' }}>
                                    {language.speakers.match(/\(([^)]+)\)/)?.[1] || 'N/A'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="info-section">
                    <h2>Writing System</h2>
                    <div className="writing-system-box">
                        <h3>Script & Orthography</h3>
                        <p>{language.writingSystem}</p>
                    </div>
                </div>

                <div className="info-section">
                    <h2>Translation Services</h2>
                    <p>
                        Our expert translators are native speakers of {language.name} with deep cultural
                        understanding and professional expertise. We offer:
                    </p>
                    <ul style={{ marginTop: '1rem', lineHeight: '2', color: '#d0d0d0' }}>
                        <li>Document Translation (legal, medical, technical, academic)</li>
                        <li>Website & Software Localization</li>
                        <li>Interpretation Services (simultaneous & consecutive)</li>
                        <li>Subtitle & Caption Translation</li>
                        <li>Cultural Consultation & Adaptation</li>
                        <li>Proofreading & Quality Assurance</li>
                    </ul>
                    <div style={{ marginTop: '2rem' }}>
                        <Link
                            to="/contact"
                            className="back-button"
                            style={{
                                background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-pink))',
                                border: 'none',
                                color: 'white',
                                fontWeight: 'bold'
                            }}
                        >
                            Get a Quote for {language.name} Translation →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LanguageDetail;
