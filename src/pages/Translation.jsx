import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { languagesData } from '../data/languagesData';
import './Translation.css';
import TypewriterText from '../components/TypewriterText';

const translationPhrases = [
    "Bridging the gap between languages and ideas.",
    "Bridging cultures through professional linguistic expertise in over 50 languages.",
    "Explore our reach and dive into the history of each tongue."
];

// Group languages by region from the centralized data
const regions = [...new Set(Object.values(languagesData).map(l => l.region))];

const Translation = () => {
    const [activeRegion, setActiveRegion] = useState(regions[0]);



    const getLanguageSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');

    return (
        <div className="translation-container page-container">
            <header className="translation-header">
                <h1 className="text-neon-cyan section-title">Global Translation Services</h1>
                <p className="intro-text" style={{ minHeight: '3em' }}>
                    <TypewriterText phrases={translationPhrases} className="text-neon-gamma" />
                </p>
            </header>



            <div className="regions-layout">
                <div className="regions-sidebar glass-panel">
                    <h3>Regions</h3>
                    <ul>
                        {regions.map(region => (
                            <li
                                key={region}
                                className={`${activeRegion === region ? 'active' : ''} region-${region.toLowerCase()}`}
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
