import React, { useState } from 'react';
import './TranslatorOnboarding.css';

const TranslatorOnboarding = () => {
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [formData, setFormData] = useState({
        // User Type
        userType: 'Freelance Translator',

        // 1. Personal Information
        fullName: '',
        displayName: '',
        email: '',
        phone: '',
        country: '',
        city: '',
        timeZone: '',
        nativeLanguage: '',
        secondaryLanguages: '',

        // 2. Language Pairs
        sourceLanguages: [],
        targetLanguages: [],
        direction: 'Into Native Language Only',

        // 3. Areas of Specialization
        specializations: [],
        otherSpecialization: '',

        // 4. Services Offered
        services: [],

        // 5. Tools & Technology
        tools: [],
        catToolsOther: '',
        aiAssistedComfort: 'Yes',

        // 6. Education & Certification
        highestDegree: '',
        fieldOfStudy: '',
        university: '',
        certifications: '',
        yearsExperience: '1-3 years',

        // 7. Work Experience
        currentStatus: 'Freelance Translator',
        majorClients: '',
        totalWordsTranslated: '',
        industriesWorked: '',

        // 8. Portfolio & Samples
        portfolioUrl: '',
        websiteLinkedIn: '',
        profileLinks: '',

        // 9. Availability & Capacity
        availability: 'Part-time',
        dailyCapacity: '2,000 words',
        weekendAvailability: 'No',

        // 10. Rates
        rateType: 'Per word',
        currency: 'USD',
        minCharge: '',

        // 11. Legal & Compliance
        ndaAccepted: false,
        confidentialityAccepted: false,
        aiPolicyAccepted: false,
        dataProtectionAccepted: false,

        // 12. Skill Self-Assessment
        accuracyLevel: 3,
        catToolProficiency: 3,
        subjectKnowledge: 3,

        // 13. Additional Notes
        additionalNotes: '',

        // 14. Final Actions
        infoAccurate: false,
        termsAccepted: false
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleMultiSelect = (name, value) => {
        setFormData(prev => {
            const current = prev[name];
            if (current.includes(value)) {
                return { ...prev, [name]: current.filter(item => item !== value) };
            } else {
                return { ...prev, [name]: [...current, value] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        // Simulate API call
        setTimeout(() => {
            setStatus('success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
    };

    const Section = ({ title, icon, children, id }) => (
        <div className="form-section glass-panel" id={id}>
            <div className="section-header">
                <span className="section-icon">{icon}</span>
                <h2>{title}</h2>
            </div>
            <div className="section-content">
                {children}
            </div>
        </div>
    );

    if (status === 'success') {
        return (
            <div className="onboarding-container page-container">
                <div className="success-wrapper glass-panel animate-fade-in">
                    <div className="success-icon">✅</div>
                    <h1 className="text-neon-cyan">Application Received!</h1>
                    <p>Thank you, {formData.fullName}. Our Vendor Management team will review your profile and contact you within 3-5 business days.</p>
                    <button className="btn btn-primary" onClick={() => setStatus('idle')}>Submit Another Application</button>
                </div>
            </div>
        );
    }

    return (
        <div className="onboarding-container page-container">
            <header className="onboarding-header">
                <h1 className="text-neon-cyan section-title">Translator Partnership Portal</h1>
                <p className="intro-text">
                    Join Glossa's global network of elite linguists. Complete your professional profile to start receiving high-value projects.
                </p>
                <div className="user-type-selector">
                    {['Freelance Translator', 'Agencies', 'Platforms (Smartcat/Mars/etc.)'].map(type => (
                        <button
                            key={type}
                            className={`type-btn ${formData.userType === type ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, userType: type })}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </header>

            <form onSubmit={handleSubmit} className="premium-form">

                <Section title="1. Personal Information" icon="🧑💼" id="personal">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Full Name *</label>
                            <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required className="glass-input" placeholder="John Doe" />
                        </div>
                        <div className="form-group">
                            <label>Display Name (optional)</label>
                            <input type="text" name="displayName" value={formData.displayName} onChange={handleInputChange} className="glass-input" placeholder="JD Translations" />
                        </div>
                        <div className="form-group">
                            <label>Email Address *</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="glass-input" placeholder="john@example.com" />
                        </div>
                        <div className="form-group">
                            <label>Phone / WhatsApp *</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="glass-input" placeholder="+1 234 567 890" />
                        </div>
                        <div className="form-group">
                            <label>Country *</label>
                            <input type="text" name="country" value={formData.country} onChange={handleInputChange} required className="glass-input" />
                        </div>
                        <div className="form-group">
                            <label>City *</label>
                            <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="glass-input" />
                        </div>
                        <div className="form-group">
                            <label>Time Zone *</label>
                            <select name="timeZone" value={formData.timeZone} onChange={handleInputChange} required className="glass-input">
                                <option value="">Select Time Zone</option>
                                <option value="UTC-12">UTC-12</option>
                                <option value="UTC-5">EST (UTC-5)</option>
                                <option value="UTC+0">GMT (UTC+0)</option>
                                <option value="UTC+1">CET (UTC+1)</option>
                                <option value="UTC+5:30">IST (UTC+5:30)</option>
                                <option value="UTC+8">CST (UTC+8)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Native Language *</label>
                            <input type="text" name="nativeLanguage" value={formData.nativeLanguage} onChange={handleInputChange} required className="glass-input" placeholder="e.g. Arabic" />
                        </div>
                    </div>
                </Section>

                <Section title="2. Language Pairs" icon="🌍" id="languages">
                    <div className="lang-pairs-container">
                        <div className="multi-select-group">
                            <label>Source Languages *</label>
                            <div className="checkbox-grid">
                                {['English', 'Urdu', 'Turkish', 'Arabic', 'Dari', 'Pashto', 'French', 'Spanish', 'German'].map(lang => (
                                    <label key={lang} className="checkbox-item">
                                        <input type="checkbox" checked={formData.sourceLanguages.includes(lang)} onChange={() => handleMultiSelect('sourceLanguages', lang)} />
                                        <span>{lang}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group mt-1">
                            <label>Target Languages (specified)</label>
                            <input type="text" name="targetLanguagesText" className="glass-input" placeholder="e.g. Urdu, Pashto, English" />
                        </div>

                        <div className="form-group mt-1">
                            <label>Direction *</label>
                            <select name="direction" value={formData.direction} onChange={handleInputChange} className="glass-input">
                                <option value="Into Native Language Only">Into Native Language Only</option>
                                <option value="Both Directions">Both Directions</option>
                            </select>
                        </div>
                    </div>
                </Section>

                <Section title="3. Areas of Specialization" icon="📚" id="specialization">
                    <div className="checkbox-grid-large">
                        {['Legal', 'Medical', 'Technical', 'IT / Software', 'Marketing', 'Finance', 'E-commerce', 'News & Media', 'Subtitling', 'Gaming', 'Civil Rights / NGO', 'Agriculture / Agritech'].map(spec => (
                            <label key={spec} className="checkbox-item card-style">
                                <input type="checkbox" checked={formData.specializations.includes(spec)} onChange={() => handleMultiSelect('specializations', spec)} />
                                <span>{spec}</span>
                            </label>
                        ))}
                    </div>
                    <div className="form-group mt-1">
                        <label>Other (specify)</label>
                        <input type="text" name="otherSpecialization" value={formData.otherSpecialization} onChange={handleInputChange} className="glass-input" />
                    </div>
                </Section>

                <Section title="4. Services Offered" icon="🛠️" id="services">
                    <div className="checkbox-grid">
                        {['Translation', 'Editing / Proofreading', 'MTPE', 'Subtitling (SRT, VTT)', 'Transcription', 'Localization', 'Voice-over Script Translation'].map(svc => (
                            <label key={svc} className="checkbox-item">
                                <input type="checkbox" checked={formData.services.includes(svc)} onChange={() => handleMultiSelect('services', svc)} />
                                <span>{svc}</span>
                            </label>
                        ))}
                    </div>
                </Section>

                <Section title="5. Tools & Technology" icon="💻" id="tools">
                    <div className="checkbox-grid">
                        {['Smartcat', 'MemoQ', 'Trados Studio', 'Wordfast', 'Subtitle Edit', 'Aegisub', 'Google Docs', 'MS Word / Excel'].map(tool => (
                            <label key={tool} className="checkbox-item">
                                <input type="checkbox" checked={formData.tools.includes(tool)} onChange={() => handleMultiSelect('tools', tool)} />
                                <span>{tool}</span>
                            </label>
                        ))}
                    </div>
                    <div className="form-row mt-1">
                        <div className="form-group">
                            <label>Comfortable with AI-assisted translation? *</label>
                            <select name="aiAssistedComfort" value={formData.aiAssistedComfort} onChange={handleInputChange} className="glass-input">
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="Case by case">Case by case</option>
                            </select>
                        </div>
                    </div>
                </Section>

                <Section title="6. Education & Certification" icon="🎓" id="education">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Highest Degree</label>
                            <input type="text" name="highestDegree" value={formData.highestDegree} onChange={handleInputChange} className="glass-input" placeholder="e.g. Master's in Translation" />
                        </div>
                        <div className="form-group">
                            <label>Field of Study</label>
                            <input type="text" name="fieldOfStudy" value={formData.fieldOfStudy} onChange={handleInputChange} className="glass-input" />
                        </div>
                        <div className="form-group">
                            <label>University / Institute</label>
                            <input type="text" name="university" value={formData.university} onChange={handleInputChange} className="glass-input" />
                        </div>
                        <div className="form-group">
                            <label>Years of Experience *</label>
                            <select name="yearsExperience" value={formData.yearsExperience} onChange={handleInputChange} className="glass-input">
                                <option value="Entry (< 1 year)">Entry (&lt; 1 year)</option>
                                <option value="1-3 years">1-3 years</option>
                                <option value="3-5 years">3-5 years</option>
                                <option value="5-10 years">5-10 years</option>
                                <option value="Expert (10+ years)">Expert (10+ years)</option>
                            </select>
                        </div>
                    </div>
                </Section>

                <Section title="7. Work Experience" icon="🧾" id="experience">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Current Status</label>
                            <select name="currentStatus" value={formData.currentStatus} onChange={handleInputChange} className="glass-input">
                                <option value="Freelance Translator">Freelance Translator</option>
                                <option value="Agency Translator">Agency Translator</option>
                                <option value="In-house Translator">In-house Translator</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Total Words Translated (Approx.)</label>
                            <input type="text" name="totalWordsTranslated" value={formData.totalWordsTranslated} onChange={handleInputChange} className="glass-input" placeholder="e.g. 500,000+" />
                        </div>
                    </div>
                    <div className="form-group mt-1">
                        <label>Industries Worked With</label>
                        <textarea name="industriesWorked" value={formData.industriesWorked} onChange={handleInputChange} className="glass-input" rows="2"></textarea>
                    </div>
                </Section>

                <Section title="8. Portfolio & Samples" icon="📂" id="portfolio">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Portfolio URL</label>
                            <input type="url" name="portfolioUrl" value={formData.portfolioUrl} onChange={handleInputChange} className="glass-input" placeholder="https://..." />
                        </div>
                        <div className="form-group">
                            <label>LinkedIn / Website</label>
                            <input type="url" name="websiteLinkedIn" value={formData.websiteLinkedIn} onChange={handleInputChange} className="glass-input" />
                        </div>
                        <div className="form-group">
                            <label>Smartcat / ProZ Profile Link</label>
                            <input type="url" name="profileLinks" value={formData.profileLinks} onChange={handleInputChange} className="glass-input" />
                        </div>
                    </div>
                </Section>

                <Section title="9. Availability & Capacity" icon="⏱️" id="availability">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Availability *</label>
                            <select name="availability" value={formData.availability} onChange={handleInputChange} className="glass-input">
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="On-demand">On-demand</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Daily Capacity *</label>
                            <select name="dailyCapacity" value={formData.dailyCapacity} onChange={handleInputChange} className="glass-input">
                                <option value="1,000 words">1,000 words</option>
                                <option value="2,000 words">2,000 words</option>
                                <option value="3,000+ words">3,000+ words</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Weekend Availability? *</label>
                            <select name="weekendAvailability" value={formData.weekendAvailability} onChange={handleInputChange} className="glass-input">
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </div>
                </Section>

                <Section title="10. Rates (Optional)" icon="💰" id="rates">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Rate Type</label>
                            <select name="rateType" value={formData.rateType} onChange={handleInputChange} className="glass-input">
                                <option value="Per word">Per word</option>
                                <option value="Per hour">Per hour</option>
                                <option value="Per minute (AV)">Per minute (AV)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Currency</label>
                            <select name="currency" value={formData.currency} onChange={handleInputChange} className="glass-input">
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Minimum Charge (optional)</label>
                            <input type="number" name="minCharge" value={formData.minCharge} onChange={handleInputChange} className="glass-input" />
                        </div>
                    </div>
                </Section>

                <Section title="11. Legal & Compliance" icon="🛡️" id="legal">
                    <div className="checkbox-stack">
                        <label className="checkbox-item full-width">
                            <input type="checkbox" name="ndaAccepted" checked={formData.ndaAccepted} onChange={handleInputChange} required />
                            <span>I accept the Non-Disclosure Agreement (NDA) requirements.</span>
                        </label>
                        <label className="checkbox-item full-width">
                            <input type="checkbox" name="confidentialityAccepted" checked={formData.confidentialityAccepted} onChange={handleInputChange} required />
                            <span>I agree to the Confidentiality Policy.</span>
                        </label>
                        <label className="checkbox-item full-width">
                            <input type="checkbox" name="aiPolicyAccepted" checked={formData.aiPolicyAccepted} onChange={handleInputChange} required />
                            <span>I agree to the AI Usage Policy.</span>
                        </label>
                        <label className="checkbox-item full-width">
                            <input type="checkbox" name="dataProtectionAccepted" checked={formData.dataProtectionAccepted} onChange={handleInputChange} required />
                            <span>I consent to Data Protection policies (GDPR/compliant).</span>
                        </label>
                    </div>
                </Section>

                <Section title="12. Skill Self-Assessment" icon="🧠" id="skills">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Accuracy Level (1–5)</label>
                            <input type="range" name="accuracyLevel" min="1" max="5" value={formData.accuracyLevel} onChange={handleInputChange} className="range-input" />
                            <div className="range-labels"><span>1</span><span>{formData.accuracyLevel}</span><span>5</span></div>
                        </div>
                        <div className="form-group">
                            <label>CAT Tool Proficiency (1–5)</label>
                            <input type="range" name="catToolProficiency" min="1" max="5" value={formData.catToolProficiency} onChange={handleInputChange} className="range-input" />
                            <div className="range-labels"><span>1</span><span>{formData.catToolProficiency}</span><span>5</span></div>
                        </div>
                        <div className="form-group">
                            <label>Subject Knowledge (1–5)</label>
                            <input type="range" name="subjectKnowledge" min="1" max="5" value={formData.subjectKnowledge} onChange={handleInputChange} className="range-input" />
                            <div className="range-labels"><span>1</span><span>{formData.subjectKnowledge}</span><span>5</span></div>
                        </div>
                    </div>
                </Section>

                <Section title="13. Additional Notes" icon="📝" id="notes">
                    <div className="form-group">
                        <label>Anything you want us to know? (Optional)</label>
                        <textarea name="additionalNotes" value={formData.additionalNotes} onChange={handleInputChange} className="glass-input" rows="4" placeholder="Tell us about your unique strengths..."></textarea>
                    </div>
                </Section>

                <div className="final-actions glass-panel">
                    <h2 className="text-neon-pink">✅ 14. Final Actions</h2>
                    <div className="checkbox-stack mt-1">
                        <label className="checkbox-item full-width">
                            <input type="checkbox" name="infoAccurate" checked={formData.infoAccurate} onChange={handleInputChange} required />
                            <span>I confirm all information provided is accurate and truthful.</span>
                        </label>
                        <label className="checkbox-item full-width">
                            <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleInputChange} required />
                            <span>I agree to the Terms & Conditions of Glossa Agency.</span>
                        </label>
                    </div>
                    <button type="submit" className="btn btn-primary submit-btn-large" disabled={status === 'submitting'}>
                        {status === 'submitting' ? 'Submitting Application...' : 'Submit Application'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default TranslatorOnboarding;
