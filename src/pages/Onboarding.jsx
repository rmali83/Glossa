import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { languagesData } from '../data/languagesData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './Onboarding.css';

const allLanguages = Object.keys(languagesData).sort();
const allTimezones = Intl.supportedValuesOf('timeZone');

const Onboarding = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        translatorType: 'Freelance',
        languagePairs: [],
        experienceLevel: 'Intermediate',
        availability: '20',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    const [selectedSource, setSelectedSource] = useState('');
    const [selectedTarget, setSelectedTarget] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addLanguagePair = () => {
        if (selectedSource && selectedTarget) {
            if (selectedSource === selectedTarget) {
                alert("Source and target languages cannot be the same.");
                return;
            }
            const pair = `${selectedSource} → ${selectedTarget}`;
            if (!formData.languagePairs.includes(pair)) {
                setFormData(prev => ({
                    ...prev,
                    languagePairs: [...prev.languagePairs, pair]
                }));
            }
            setSelectedSource('');
            setSelectedTarget('');
        }
    };

    const removeLanguagePair = (pair) => {
        setFormData(prev => ({
            ...prev,
            languagePairs: prev.languagePairs.filter(p => p !== pair)
        }));
    };

    const { signUp } = useAuth();
    const [error, setError] = useState('');
    const [status, setStatus] = useState('idle');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.languagePairs.length === 0) {
            alert("Please select at least one language pair.");
            return;
        }

        setStatus('submitting');

        try {
            // 1. Sign up user (Trigger creates row in SQL)
            const { data: authData, error: signUpError } = await signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        user_type: formData.translatorType === 'Freelance' ? 'Freelance Translator' : 'Agencies',
                        timezone: formData.timeZone,
                        country: 'To be set',
                        city: 'To be set'
                    }
                }
            });

            if (signUpError) throw signUpError;

            // 2. Update with language pairs and experience
            if (authData.user) {
                const { error: dbError } = await supabase
                    .from('profiles')
                    .update({
                        language_pairs: formData.languagePairs,
                        years_experience: formData.experienceLevel,
                        availability: formData.availability
                    })
                    .eq('id', authData.user.id);

                if (dbError) throw dbError;
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Onboarding failed');
            setStatus('idle');
        }
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
                    {error && <div className="error-message" style={{ color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.1)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>{error}</div>}
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
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Create a password"
                                value={formData.password}
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
                            <label>Add Language Pairs</label>
                            <div className="language-selection-row">
                                <select
                                    className="glass-input"
                                    value={selectedSource}
                                    onChange={(e) => setSelectedSource(e.target.value)}
                                >
                                    <option value="">Source Language</option>
                                    {allLanguages.map(lang => (
                                        <option key={`source-${lang}`} value={lang}>{lang}</option>
                                    ))}
                                </select>
                                <span className="arrow">→</span>
                                <select
                                    className="glass-input"
                                    value={selectedTarget}
                                    onChange={(e) => setSelectedTarget(e.target.value)}
                                >
                                    <option value="">Target Language</option>
                                    {allLanguages.map(lang => (
                                        <option key={`target-${lang}`} value={lang}>{lang}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="add-pair-btn"
                                    onClick={addLanguagePair}
                                    disabled={!selectedSource || !selectedTarget}
                                >
                                    Add
                                </button>
                            </div>

                            {formData.languagePairs.length > 0 && (
                                <div className="selected-pairs-container">
                                    <label>Selected Pairs:</label>
                                    <div className="selected-pairs-list">
                                        {formData.languagePairs.map(pair => (
                                            <div key={pair} className="pair-tag">
                                                {pair}
                                                <button type="button" onClick={() => removeLanguagePair(pair)}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
                                <option value="">Select Time Zone</option>
                                {allTimezones.map(tz => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                            <p className="helper-text">
                                Used for scheduling deadlines and messages. You can change it anytime.
                            </p>
                        </div>
                    </section>

                    <button
                        type="submit"
                        className="submit-onboarding-btn"
                        disabled={status === 'submitting'}
                    >
                        {status === 'submitting' ? 'Processing...' : 'Complete Onboarding'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Onboarding;
