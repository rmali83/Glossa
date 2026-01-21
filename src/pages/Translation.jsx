import React, { useState } from 'react';
import './Translation.css';

const regionsData = [
    {
        name: 'Europe',
        languages: ['English', 'Spanish', 'French', 'German', 'Italian', 'Russian', 'Portuguese', 'Dutch', 'Polish']
    },
    {
        name: 'Asia',
        languages: ['Mandarin', 'Japanese', 'Korean', 'Hindi', 'Arabic', 'Urdu', 'Punjabi', 'Dari', 'Pashto', 'Tamil', 'Bengali', 'Vietnamese', 'Thai', 'Indonesian', 'Malay', 'Turkish', 'Farsi', 'Russian']
    },
    {
        name: 'Americas',
        languages: ['Spanish', 'English', 'Portuguese', 'French', 'Quechua', 'Guarani', 'Haitian Creole']
    },
    {
        name: 'Africa',
        languages: ['Swahili', 'Amharic', 'Yoruba', 'Oromo', 'Hausa', 'Igbo', 'Zulu', 'Arabic', 'French']
    },
    {
        name: 'Oceania',
        languages: ['English', 'Maori', 'Samoan', 'Fijian', 'Tongan']
    }
];

const Translation = () => {
    const [activeRegion, setActiveRegion] = useState(regionsData[0].name);

    return (
        <div className="translation-container page-container">
            <h1 className="text-neon-cyan section-title">Translation Services</h1>
            <p className="intro-text">
                Professional translation for every corner of the globe.
                Select a region to explore our supported languages.
            </p>

            <div className="regions-layout">
                <div className="regions-sidebar glass-panel">
                    <h3>Regions</h3>
                    <ul>
                        {regionsData.map(region => (
                            <li
                                key={region.name}
                                className={activeRegion === region.name ? 'active' : ''}
                                onClick={() => setActiveRegion(region.name)}
                            >
                                {region.name}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="languages-display glass-panel">
                    <h2 className="text-neon-pink">{activeRegion}</h2>
                    <div className="languages-grid">
                        {regionsData.find(r => r.name === activeRegion).languages.map(lang => (
                            <div key={lang} className="language-item neon-border">
                                {lang}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Translation;
