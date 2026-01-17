import React, { useState } from 'react';
import './TranslatorOnboarding.css';

const TranslatorOnboarding = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        sourceLang: '',
        targetLang: '',
        experience: '',
        rate: '',
        specialization: 'General'
    });
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            const response = await fetch('/api/onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setStatus('success');
                setFormData({
                    name: '', email: '', sourceLang: '', targetLang: '', experience: '', rate: '', specialization: 'General'
                });
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setStatus('error');
        }
    };

    return (
        <div className="onboarding-container page-container">
            <h1 className="text-neon-green section-title">Join Our Team</h1>
            <p className="intro-text">
                Become a part of the Glossa network. We are always looking for talented translators.
            </p>

            <div className="form-wrapper glass-panel">
                {status === 'success' ? (
                    <div className="success-message">
                        <h2 className="text-neon-cyan">Welcome Aboard!</h2>
                        <p>Your application has been submitted successfully. We will be in touch soon.</p>
                        <button className="btn btn-primary" onClick={() => setStatus('idle')}>Submit Another</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="onboarding-form">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="glass-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="glass-input"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Source Language</label>
                                <input
                                    type="text"
                                    name="sourceLang"
                                    value={formData.sourceLang}
                                    onChange={handleChange}
                                    required
                                    className="glass-input"
                                    placeholder="e.g. English"
                                />
                            </div>
                            <div className="form-group">
                                <label>Target Language</label>
                                <input
                                    type="text"
                                    name="targetLang"
                                    value={formData.targetLang}
                                    onChange={handleChange}
                                    required
                                    className="glass-input"
                                    placeholder="e.g. Spanish"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Years of Experience</label>
                                <input
                                    type="number"
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleChange}
                                    min="0"
                                    className="glass-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Rate per Word ($)</label>
                                <input
                                    type="number"
                                    name="rate"
                                    value={formData.rate}
                                    onChange={handleChange}
                                    step="0.01"
                                    className="glass-input"
                                    placeholder="0.05"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Specialization</label>
                            <select
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleChange}
                                className="glass-input"
                            >
                                <option value="General">General</option>
                                <option value="Legal">Legal</option>
                                <option value="Medical">Medical</option>
                                <option value="Technical">Technical</option>
                                <option value="Creative">Creative</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary submit-btn" disabled={status === 'submitting'}>
                            {status === 'submitting' ? 'Submitting...' : 'Apply Now'}
                        </button>

                        {status === 'error' && (
                            <p className="error-text">Something went wrong. Please try again.</p>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

export default TranslatorOnboarding;
