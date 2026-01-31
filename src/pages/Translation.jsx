import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { languagesData } from '../data/languagesData';
import './Translation.css';

// Group languages by region from the centralized data
const regions = [...new Set(Object.values(languagesData).map(l => l.region))];

const Translation = () => {
    const [activeRegion, setActiveRegion] = useState(regions[0]);

    // Select a few featured languages for the top
    const featuredLanguages = ['English', 'Spanish', 'Mandarin', 'Arabic', 'French', 'Japanese'];

    const getLanguageSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');

    return (
        <div className="translation-container page-container">
            <header className="translation-header">
                <h1 className="text-neon-cyan section-title">Global Translation Services</h1>
                <p className="intro-text">
                    Bridging cultures through professional linguistic expertise in over 50 languages.
                    Explore our reach and dive into the history of each tongue.
                </p>
            </header>

            <section className="featured-section glass-panel">
                <h3 className="section-subtitle text-neon-pink">Featured Languages</h3>
                <div className="featured-grid">
                    {featuredLanguages.map(name => {
                        const lang = languagesData[name];
                        return (
                            <Link
                                key={name}
                                to={`/translation/language/${getLanguageSlug(name)}`}
                                className="featured-card neon-border"
                            >
                                <div className="featured-card-content">
                                    <h4>{name}</h4>
                                    <span>{lang.region}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <div className="regions-layout">
                <div className="regions-sidebar glass-panel">
                    <h3>Regions</h3>
                    <ul>
                        {regions.map(region => (
                            <li
                                key={region}
                                className={activeRegion === region ? 'active' : ''}
                                onClick={() => setActiveRegion(region)}
                            >
                                {region}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="languages-display glass-panel">
                    <h2 className="text-neon-pink">{activeRegion}</h2>
                    <div className="languages-grid">
                        {Object.values(languagesData)
                            .filter(lang => lang.region === activeRegion)
                            .map(lang => (
                                <Link
                                    key={lang.name}
                                    to={`/translation/language/${getLanguageSlug(lang.name)}`}
                                    className="language-item neon-border"
                                >
                                    {lang.name}
                                </Link>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Translation;
