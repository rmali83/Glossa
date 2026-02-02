import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';

const Onboarding = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        translatorType: 'Freelance',
        languagePairs: [],
        experienceLevel: 'Intermediate',
        availability: '20',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    const [availableLanguages] = useState([
        "English → Urdu", "Urdu → English",
        "Turkish → English", "English → Turkish",
        "Arabic → English", "English → Arabic",
        "French → English", "English → French"
    ]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleLanguage = (lang) => {
        setFormData(prev => {
            const current = prev.languagePairs;
            if (current.includes(lang)) {
                return { ...prev, languagePairs: current.filter(l => l !== lang) };
            } else {
                return { ...prev, languagePairs: [...current, lang] };
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Onboarding submitted:', formData);
        // UI logic: Redirect to dashboard
        navigate('/dashboard');
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-container">
                <div className="onboarding-header">
                    <div className="onboarding-logo">GLOSSA</div>
                    <h1>Complete Your Profile</h1>
                    <p>Let's get you set up to start accepting translation jobs.</p>
                </div>

                <form className="onboarding-form" onSubmit={handleSubmit}>
                    <section className="form-section">
                        <h3>Basic Information</h3>
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name</label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                placeholder="Enter your full name"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Translator Type</label>
                            <div className="radio-group">
                                <label className={`radio-label ${formData.translatorType === 'Freelance' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="translatorType"
                                        value="Freelance"
                                        checked={formData.translatorType === 'Freelance'}
                                        onChange={handleInputChange}
                                    />
                                    Freelance
                                </label>
                                <label className={`radio-label ${formData.translatorType === 'Agency' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="translatorType"
                                        value="Agency"
                                        checked={formData.translatorType === 'Agency'}
                                        onChange={handleInputChange}
                                    />
                                    Agency
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <h3>Expertise</h3>
                        <div className="form-group">
                            <label>Language Pairs (Select all that apply)</label>
                            <div className="language-grid">
                                {availableLanguages.map(lang => (
                                    <div
                                        key={lang}
                                        className={`lang-checkbox ${formData.languagePairs.includes(lang) ? 'checked' : ''}`}
                                        onClick={() => toggleLanguage(lang)}
                                    >
                                        {lang}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="experienceLevel">Experience Level</label>
                            <select
                                id="experienceLevel"
                                name="experienceLevel"
                                value={formData.experienceLevel}
                                onChange={handleInputChange}
                            >
                                <option value="Beginner">Beginner (1-2 years)</option>
                                <option value="Intermediate">Intermediate (3-5 years)</option>
                                <option value="Expert">Expert (5+ years)</option>
                            </select>
                        </div>
                    </section>

                    <section className="form-section">
                        <h3>Availability & Timezone</h3>
                        <div className="form-group">
                            <label htmlFor="availability">Weekly Availability (Hours/Week)</label>
                            <input
                                type="number"
                                id="availability"
                                name="availability"
                                min="1"
                                max="168"
                                value={formData.availability}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="timeZone">Time Zone</label>
                            <select
                                id="timeZone"
                                name="timeZone"
                                value={formData.timeZone}
                                onChange={handleInputChange}
                            >
                                <option value="Asia/Karachi">Asia/Karachi (GMT+5)</option>
                                <option value="UTC">UTC (GMT+0)</option>
                                <option value="America/New_York">America/New_York (GMT-5)</option>
                                <option value="Europe/London">Europe/London (GMT+0)</option>
                                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                            </select>
                            <p className="helper-text">
                                Used for scheduling deadlines and messages. You can change it anytime.
                            </p>
                        </div>
                    </section>

                    <button type="submit" className="submit-onboarding-btn">
                        Complete Onboarding
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Onboarding;
