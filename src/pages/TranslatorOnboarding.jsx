import React, { useState, useEffect } from 'react';
import { languagesData } from '../data/languagesData';
import './TranslatorOnboarding.css';

const allLanguages = Object.keys(languagesData).sort();

const freelancerSpecs = [
    'Legal', 'Medical', 'Technical', 'IT / Software', 'Marketing',
    'Finance', 'E-commerce', 'News & Media', 'Subtitling', 'Gaming',
    'Civil Rights / NGO', 'Agriculture / Agritech', 'Aerospace', 'Automotive',
    'Life Sciences', 'Education / E-learning', 'Tourism & Hospitality',
    'Energy & Environment', 'Luxury Goods', 'Military & Defense'
];

const popularTimezones = [
    'Asia/Karachi',
    'Europe/Istanbul',
    'America/New_York',
    'Europe/London',
    'Asia/Dubai',
    'Asia/Singapore',
    'Australia/Sydney',
    'Asia/Tokyo',
    'Europe/Paris',
    'America/Los_Angeles'
];

const TranslatorOnboarding = () => {
    const [status, setStatus] = useState('idle'); // idle, submitting, success
    const [userType, setUserType] = useState('Freelance Translator');
    const [isOtherTZ, setIsOtherTZ] = useState(false);

    const [formData, setFormData] = useState({
        // Common / Shared
        email: '',
        country: '',
        city: '',
        timeZone: (() => {
            try {
                return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
            } catch (e) {
                return "UTC";
            }
        })(),
        otherTimeZone: '',
        sourceLanguages: [],
        targetLanguages: [],
        direction: 'Into native only',
        specializations: [],
        services: [],
        tools: [],
        additionalNotes: '',
        infoAccurate: false,
        termsAccepted: false,

        // Freelancer Specific
        fullName: '',
        displayName: '',
        nativeLanguage: '',
        otherSpecialization: '',
        aiAssistedComfort: 'Yes',
        highestDegree: '',
        fieldOfStudy: '',
        university: '',
        certifications: '',
        yearsExperience: '1-3 years',
        currentStatus: 'Freelance Translator',
        majorClients: '',
        totalWordsTranslated: '',
        industriesWorked: '',
        portfolioUrl: '',
        websiteLinkedIn: '',
        profileLinks: '',
        availability: 'Part-time',
        dailyCapacity: '2,000 words',
        weekendAvailability: 'No',
        rateType: 'Per word',
        currency: 'USD',
        minCharge: '',
        ndaAccepted: false,
        confidentialityAccepted: false,
        aiPolicyAccepted: false,
        dataProtectionAccepted: false,
        accuracyLevel: 3,
        catToolProficiency: 3,
        subjectKnowledge: 3,

        // Agency Specific
        agencyName: '',
        legalBusinessName: '',
        registrationNumber: '',
        officeAddress: '',
        companyWebsite: '',
        officialEmail: '',
        contactFullName: '',
        contactJobTitle: '',
        numTranslators: '1-10',
        tmsAvailability: 'No',
        aiWorkflows: 'No',
        fileFormats: '',
        iso17100: false,
        iso9001: false,
        iso27001: false,
        ataMember: false,
        repAuthorized: false,
        subcontractingPolicy: false,
        yearsInBusiness: '1-3 years',
        rushHandling: 'No',
        weekendSupport: 'No',
        dedicatedPMs: 'No',
        pricingModel: 'Per word',
        paymentTerms: 'Net 30',
        minProjectSize: '',
        preferredCurrency: 'USD'
    });

    useEffect(() => {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!popularTimezones.includes(formData.timeZone) && formData.timeZone !== 'Other') {
            // Keep the detected one if it's not in popular list but is what we have
        }
    }, []);

    const handleTZChange = (e) => {
        const value = e.target.value;
        if (value === 'Other') {
            setIsOtherTZ(true);
            setFormData(prev => ({ ...prev, timeZone: 'Other' }));
        } else {
            setIsOtherTZ(false);
            setFormData(prev => ({ ...prev, timeZone: value }));
        }
    };


    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleMultiSelect = (name, value, limit = 0) => {
        setFormData(prev => {
            const current = prev[name];
            if (current.includes(value)) {
                return { ...prev, [name]: current.filter(item => item !== value) };
            } else {
                if (limit > 0 && current.length >= limit) {
                    alert(`Limit reached: You can only select up to ${limit} items.`);
                    return prev;
                }
                return { ...prev, [name]: [...current, value] };
            }
        });
    };

    const handleDropdownMultiSelect = (name, e) => {
        const value = e.target.value;
        if (value && !formData[name].includes(value)) {
            setFormData(prev => ({ ...prev, [name]: [...prev[name], value] }));
        }
        e.target.value = '';
    };

    const removeItem = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: prev[name].filter(item => item !== value) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (userType === 'Freelance Translator' && formData.specializations.length !== 5) {
            alert("Freelancers must select exactly 5 areas of specialization.");
            document.getElementById('specialization').scrollIntoView({ behavior: 'smooth' });
            return;
        }

        setStatus('submitting');
        setTimeout(() => {
            setStatus('success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
    };

    const Section = ({ title, icon, children, id }) => (
        <div className={`form-section glass-panel animate-fade-in ${userType === 'Agencies' ? 'agency-mode' : ''}`} id={id}>
            <div className="section-header">
                <span className="section-icon">{icon}</span>
                <h2 className={userType === 'Agencies' ? 'text-neon-orange' : ''}>{title}</h2>
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
                    <h1 className={userType === 'Agencies' ? 'text-neon-orange' : 'text-neon-cyan'}>Application Received!</h1>
                    <p>Thank you. Our team will review your {userType === 'Agencies' ? 'agency' : ''} application and contact you within 3-5 business days.</p>
                    <button className={`btn ${userType === 'Agencies' ? 'btn-orange' : 'btn-primary'}`} onClick={() => setStatus('idle')}>Submit Another Application</button>
                </div>
            </div>
        );
    }

    return (
        <div className="onboarding-container page-container">
            <header className="onboarding-header">
                <h1 className={`${userType === 'Agencies' ? 'text-neon-orange' : 'text-neon-cyan'} section-title`}>Glossa Partnership Portal</h1>
                <p className="intro-text">
                    {userType === 'Freelance Translator'
                        ? "Join our elite global network of linguists. Showcase your skills to top-tier clients."
                        : "Partner with Glossa to scale your language operations. Connect your agency with our global infrastructure."}
                </p>
                <div className="user-type-selector">
                    {['Freelance Translator', 'Agencies'].map(type => (
                        <button
                            key={type}
                            type="button"
                            className={`type-btn ${userType === type ? 'active' : ''} ${type === 'Agencies' ? 'agencies-tab' : ''}`}
                            onClick={() => {
                                setUserType(type);
                                setFormData(prev => ({ ...prev, specializations: [], sourceLanguages: [], targetLanguages: [], services: [], tools: [] }));
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </header>

            <form onSubmit={handleSubmit} className="premium-form">

                {userType === 'Freelance Translator' ? (
                    /* FREELANCER FORM */
                    <>
                        <Section title="1. Personal Information" icon="🧑💼" id="personal">
                            <div className="form-grid">
                                <div className="form-group"><label>Full Name *</label><input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required className="glass-input" /></div>
                                <div className="form-group"><label>Display Name</label><input type="text" name="displayName" value={formData.displayName} onChange={handleInputChange} className="glass-input" /></div>
                                <div className="form-group"><label>Email Address *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="glass-input" /></div>
                                <div className="form-group"><label>Phone / WhatsApp *</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="glass-input" /></div>
                                <div className="form-group"><label>Country *</label><input type="text" name="country" value={formData.country} onChange={handleInputChange} required className="glass-input" /></div>
                                <div className="form-group"><label>City *</label><input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="glass-input" /></div>
                                <div className="form-group">
                                    <label>Time Zone *</label>
                                    <select
                                        name="timeZone"
                                        value={formData.timeZone}
                                        onChange={handleTZChange}
                                        required
                                        className="glass-input"
                                    >
                                        {!popularTimezones.includes(formData.timeZone) && formData.timeZone !== 'Other' && (
                                            <option value={formData.timeZone}>{formData.timeZone} (Detected)</option>
                                        )}
                                        {popularTimezones.map(tz => (
                                            <option key={tz} value={tz}>{tz}</option>
                                        ))}
                                        <option value="Other">Other</option>
                                    </select>
                                    {isOtherTZ && (
                                        <input
                                            type="text"
                                            name="otherTimeZone"
                                            placeholder="Enter time zone"
                                            className="glass-input mt-1"
                                            value={formData.otherTimeZone}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Native Language *</label>
                                    <select name="nativeLanguage" value={formData.nativeLanguage} onChange={handleInputChange} required className="glass-input">
                                        <option value="">Select Native Language</option>
                                        {allLanguages.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>
                        </Section>

                        <Section title="2. Language Pairs" icon="🌍" id="languages">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Source Languages *</label>
                                    <select className="glass-input" onChange={(e) => handleDropdownMultiSelect('sourceLanguages', e)}>
                                        <option value="">Add Source Language</option>
                                        {allLanguages.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                    <div className="selected-tags">{formData.sourceLanguages.map(l => <span key={l} className="tag">{l} <button type="button" onClick={() => removeItem('sourceLanguages', l)}>×</button></span>)}</div>
                                </div>
                                <div className="form-group">
                                    <label>Target Languages *</label>
                                    <select className="glass-input" onChange={(e) => handleDropdownMultiSelect('targetLanguages', e)}>
                                        <option value="">Add Target Language</option>
                                        {allLanguages.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                    <div className="selected-tags">{formData.targetLanguages.map(l => <span key={l} className="tag">{l} <button type="button" onClick={() => removeItem('targetLanguages', l)}>×</button></span>)}</div>
                                </div>
                            </div>
                            <div className="form-group mt-1">
                                <label>Direction *</label>
                                <select name="direction" value={formData.direction} onChange={handleInputChange} className="glass-input">
                                    <option value="Into native only">Into native only</option><option value="Both directions">Both directions</option>
                                </select>
                            </div>
                        </Section>

                        <Section title="3. Areas of Specialization" icon="📚" id="specialization">
                            <p className="note text-neon-pink" style={{ fontWeight: 'bold' }}>Note: Choose EXACTLY 5 specializations. ({formData.specializations.length}/5)</p>
                            <div className="checkbox-grid-large mt-1">
                                {freelancerSpecs.map(spec => (
                                    <label key={spec} className={`checkbox-item card-style ${formData.specializations.includes(spec) ? 'selected' : ''}`}>
                                        <input type="checkbox" checked={formData.specializations.includes(spec)} onChange={() => handleMultiSelect('specializations', spec, 5)} />
                                        <span>{spec}</span>
                                    </label>
                                ))}
                            </div>
                        </Section>

                        <Section title="4. Services Offered" icon="🛠️" id="services">
                            <div className="checkbox-grid">
                                {['Translation', 'Editing', 'MTPE', 'Subtitling', 'Transcription', 'Localization'].map(svc => (
                                    <label key={svc} className="checkbox-item">
                                        <input type="checkbox" checked={formData.services.includes(svc)} onChange={() => handleMultiSelect('services', svc)} />
                                        <span>{svc}</span>
                                    </label>
                                ))}
                            </div>
                        </Section>

                        <Section title="5. Tools & Technology" icon="💻" id="tools">
                            <div className="checkbox-grid">
                                {['Smartcat', 'MemoQ', 'Trados', 'Wordfast', 'Subtitle Edit'].map(tool => (
                                    <label key={tool} className="checkbox-item">
                                        <input type="checkbox" checked={formData.tools.includes(tool)} onChange={() => handleMultiSelect('tools', tool)} />
                                        <span>{tool}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="form-group mt-1">
                                <label>Comfortable with AI-assisted translation?</label>
                                <select name="aiAssistedComfort" value={formData.aiAssistedComfort} onChange={handleInputChange} className="glass-input">
                                    <option value="Yes">Yes</option><option value="No">No</option>
                                </select>
                            </div>
                        </Section>

                        <Section title="6. Education & Certification" icon="🎓">
                            <div className="form-grid">
                                <div className="form-group"><label>Highest Degree</label><input type="text" name="highestDegree" className="glass-input" /></div>
                                <div className="form-group"><label>Field of Study</label><input type="text" name="fieldOfStudy" className="glass-input" /></div>
                                <div className="form-group">
                                    <label>Years of Experience *</label>
                                    <select name="yearsExperience" className="glass-input"><option>1-3 years</option><option>3-5 years</option><option>5-10 years</option><option>Expert (10+)</option></select>
                                </div>
                            </div>
                        </Section>

                        <Section title="7. Work Experience" icon="🧾">
                            <div className="form-grid">
                                <div className="form-group"><label>Major Clients</label><input type="text" className="glass-input" /></div>
                                <div className="form-group"><label>Total Words Translated</label><input type="text" className="glass-input" placeholder="e.g. 500k+" /></div>
                            </div>
                        </Section>

                        <Section title="8. Portfolio & Samples" icon="📂">
                            <div className="form-grid">
                                <div className="form-group"><label>Portfolio URL</label><input type="url" className="glass-input" placeholder="https://..." /></div>
                                <div className="form-group"><label>LinkedIn Profile</label><input type="url" className="glass-input" /></div>
                            </div>
                        </Section>

                        <Section title="9. Availability & Capacity" icon="⏱️">
                            <div className="form-grid">
                                <div className="form-group"><label>Daily Capacity</label><select className="glass-input"><option>1,000 words</option><option>2,000 words</option><option>3,000+ words</option></select></div>
                                <div className="form-group"><label>Weekend Availability</label><select className="glass-input"><option>Yes</option><option>No</option></select></div>
                            </div>
                        </Section>

                        <Section title="10. Rates" icon="💰">
                            <div className="form-grid">
                                <div className="form-group"><label>Rate (USD/word)</label><input type="number" step="0.01" className="glass-input" /></div>
                                <div className="form-group"><label>Min Charge</label><input type="number" className="glass-input" /></div>
                            </div>
                        </Section>

                        <Section title="11. Legal & Compliance" icon="🛡️">
                            <div className="checkbox-stack">
                                {['Accept NDA', 'Accept Confidentiality', 'Accept AI Policy', 'Accept GDPR Data Consent'].map(c => <label key={c} className="checkbox-item full-width"><input type="checkbox" required /><span>{c}</span></label>)}
                            </div>
                        </Section>

                        <Section title="12. Skill Self-Assessment" icon="🧠">
                            <div className="form-grid">
                                <div className="form-group"><label>Accuracy (1-5)</label><input type="range" min="1" max="5" defaultValue="3" className="range-input" /></div>
                                <div className="form-group"><label>CAT Proficiency (1-5)</label><input type="range" min="1" max="5" defaultValue="3" className="range-input" /></div>
                            </div>
                        </Section>

                        <Section title="13. Additional Notes" icon="📝">
                            <textarea className="glass-input" rows="4" placeholder="Anything else..."></textarea>
                        </Section>

                        <div className="final-actions glass-panel">
                            <label className="checkbox-item full-width mt-1"><input type="checkbox" required /><span>I confirm the information is accurate</span></label>
                            <button type="submit" className="btn btn-primary submit-btn-large">Submit Application</button>
                        </div>
                    </>
                ) : (
                    /* AGENCY FORM - FULL SPECS AS REQUESTED */
                    <>
                        <Section title="1. Agency Information" icon="🏢" id="agency-info">
                            <div className="form-grid">
                                <div className="form-group"><label>Agency Name *</label><input type="text" name="agencyName" required className="glass-input" /></div>
                                <div className="form-group"><label>Legal Business Name</label><input type="text" name="legalBusinessName" className="glass-input" /></div>
                                <div className="form-group"><label>Registration Number</label><input type="text" name="registrationNumber" className="glass-input" /></div>
                                <div className="form-group"><label>Country *</label><input type="text" name="country" required className="glass-input" /></div>
                                <div className="form-group"><label>City *</label><input type="text" name="city" required className="glass-input" /></div>
                                <div className="form-group"><label>Office Address</label><input type="text" name="officeAddress" className="glass-input" /></div>
                                <div className="form-group">
                                    <label>Time Zone *</label>
                                    <select
                                        name="timeZone"
                                        value={formData.timeZone}
                                        onChange={handleTZChange}
                                        required
                                        className="glass-input"
                                    >
                                        {!popularTimezones.includes(formData.timeZone) && formData.timeZone !== 'Other' && (
                                            <option value={formData.timeZone}>{formData.timeZone} (Detected)</option>
                                        )}
                                        {popularTimezones.map(tz => (
                                            <option key={tz} value={tz}>{tz}</option>
                                        ))}
                                        <option value="Other">Other</option>
                                    </select>
                                    {isOtherTZ && (
                                        <input
                                            type="text"
                                            name="otherTimeZone"
                                            placeholder="Enter time zone"
                                            className="glass-input mt-1"
                                            value={formData.otherTimeZone}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    )}
                                </div>
                                <div className="form-group"><label>Website</label><input type="url" name="companyWebsite" className="glass-input" /></div>
                                <div className="form-group"><label>Official Email *</label><input type="email" name="officialEmail" required className="glass-input" /></div>
                                <div className="form-group"><label>Phone / WhatsApp *</label><input type="tel" name="phone" required className="glass-input" /></div>
                            </div>
                        </Section>

                        <Section title="2. Primary Contact Person" icon="👤">
                            <div className="form-grid">
                                <div className="form-group"><label>Full Name *</label><input type="text" name="contactFullName" required className="glass-input" /></div>
                                <div className="form-group"><label>Job Title</label><input type="text" name="contactJobTitle" className="glass-input" placeholder="PM / Vendor Manager / Director" /></div>
                                <div className="form-group"><label>Email *</label><input type="email" name="email" required className="glass-input" /></div>
                                <div className="form-group"><label>Phone</label><input type="tel" name="phone" className="glass-input" /></div>
                            </div>
                        </Section>

                        <Section title="3. Language Coverage" icon="🌍">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Source Languages</label>
                                    <select className="glass-input" onChange={(e) => handleDropdownMultiSelect('sourceLanguages', e)}>
                                        <option value="">Add Source Language</option>
                                        {allLanguages.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                    <div className="selected-tags">{formData.sourceLanguages.map(l => <span key={l} className="tag">{l} <button type="button" onClick={() => removeItem('sourceLanguages', l)}>×</button></span>)}</div>
                                </div>
                                <div className="form-group">
                                    <label>Target Languages</label>
                                    <select className="glass-input" onChange={(e) => handleDropdownMultiSelect('targetLanguages', e)}>
                                        <option value="">Add Target Language</option>
                                        {allLanguages.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                    <div className="selected-tags">{formData.targetLanguages.map(l => <span key={l} className="tag">{l} <button type="button" onClick={() => removeItem('targetLanguages', l)}>×</button></span>)}</div>
                                </div>
                            </div>
                            <div className="form-grid mt-1">
                                <div className="form-group"><label>Direction</label><select name="direction" className="glass-input"><option>Into native only</option><option>Both directions</option></select></div>
                                <div className="form-group">
                                    <label>Active Translators</label>
                                    <select name="numTranslators" className="glass-input"><option>1–10</option><option>11–50</option><option>51–200</option><option>200+</option></select>
                                </div>
                            </div>
                        </Section>

                        <Section title="4. Subject Matter Expertise" icon="📚">
                            <div className="checkbox-grid-large">
                                {agencySpecs.map(spec => (
                                    <label key={spec} className={`checkbox-item card-style ${formData.specializations.includes(spec) ? 'selected' : ''}`}>
                                        <input type="checkbox" checked={formData.specializations.includes(spec)} onChange={() => handleMultiSelect('specializations', spec)} />
                                        <span>{spec}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="form-group mt-1"><label>Other</label><input type="text" className="glass-input" /></div>
                        </Section>

                        <Section title="5. Services Offered" icon="🛠️">
                            <div className="checkbox-grid">
                                {['Translation', 'Editing', 'MTPE', 'Subtitling', 'Transcription', 'Localization', 'Voice-over/Dubbing', 'DTP', 'Linguistic Review'].map(svc => (
                                    <label key={svc} className="checkbox-item">
                                        <input type="checkbox" checked={formData.services.includes(svc)} onChange={() => handleMultiSelect('services', svc)} />
                                        <span>{svc}</span>
                                    </label>
                                ))}
                            </div>
                        </Section>

                        <Section title="6. Technology & Infrastructure" icon="💻">
                            <div className="form-group"><label>CAT Tools Used</label>
                                <div className="checkbox-grid">{['Trados', 'MemoQ', 'Smartcat', 'Phrase', 'Wordfast'].map(t => <label key={t} className="checkbox-item"><input type="checkbox" onChange={() => handleMultiSelect('tools', t)} />{t}</label>)}</div>
                            </div>
                            <div className="form-grid mt-1">
                                <div className="form-group"><label>TMS Availability</label><select className="glass-input"><option>Yes</option><option>No</option></select></div>
                                <div className="form-group"><label>AI-assisted workflows</label><select className="glass-input"><option>Yes</option><option>No</option></select></div>
                            </div>
                            <div className="form-group mt-1"><label>File Formats Supported</label><input type="text" className="glass-input" placeholder="DOCX, PDF, InDesign, etc." /></div>
                        </Section>

                        <Section title="7. Certifications & Compliance" icon="🏅">
                            <div className="checkbox-grid">
                                {['ISO 17100', 'ISO 9001', 'ISO 27001', 'ATA Corporate Member'].map(c => <label key={c} className="checkbox-item"><input type="checkbox" />{c}</label>)}
                            </div>
                            <div className="checkbox-stack mt-1">
                                {['NDA-compliant workflows', 'GDPR-compliant processes'].map(c => <label key={c} className="checkbox-item full-width"><input type="checkbox" required />{c}</label>)}
                            </div>
                        </Section>

                        <Section title="8. Portfolio & Clients" icon="📂">
                            <div className="form-grid">
                                <div className="form-group"><label>Key Clients</label><input type="text" className="glass-input" /></div>
                                <div className="form-group"><label>Industries Served</label><input type="text" className="glass-input" /></div>
                                <div className="form-group">
                                    <label>Years in Business</label>
                                    <select className="glass-input"><option>1-3 years</option><option>3-5 years</option><option>5+ years</option></select>
                                </div>
                            </div>
                        </Section>

                        <Section title="9. Capacity & Turnaround" icon="⏱️">
                            <div className="form-grid">
                                <div className="form-group"><label>Daily Capacity</label><select className="glass-input"><option>10k–50k words</option><option>50k–200k words</option><option>200k+ words</option></select></div>
                                <div className="form-group"><label>Rush Support</label><select className="glass-input"><option>Yes</option><option>No</option></select></div>
                                <div className="form-group"><label>Weekend Support</label><select className="glass-input"><option>Yes</option><option>No</option></select></div>
                                <div className="form-group"><label>Dedicated PMs</label><select className="glass-input"><option>Yes</option><option>No</option></select></div>
                            </div>
                        </Section>

                        <Section title="10. Commercial Details" icon="💰">
                            <div className="form-grid">
                                <div className="form-group"><label>Pricing Model</label><select className="glass-input"><option>Per word</option><option>Per hour</option><option>Project-based</option></select></div>
                                <div className="form-group"><label>Payment Terms</label><select className="glass-input"><option>Net 15</option><option>Net 30</option></select></div>
                            </div>
                        </Section>

                        <Section title="11. Legal Agreements" icon="🛡️">
                            <div className="checkbox-stack">
                                {['NDA Agreement', 'Data Protection Policy', 'AI Usage Policy', 'Subcontracting Policy'].map(a => <label key={a} className="checkbox-item full-width"><input type="checkbox" required />{a}</label>)}
                            </div>
                        </Section>

                        <Section title="12. Additional Information" icon="📝">
                            <textarea className="glass-input" rows="4" placeholder="Tell us about your team, strengths, etc."></textarea>
                        </Section>

                        <div className="final-actions glass-panel">
                            <label className="checkbox-item full-width mt-1"><input type="checkbox" required /><span>I confirm I am authorized to represent this agency</span></label>
                            <button type="submit" className="btn btn-primary submit-btn-large btn-orange">Submit Agency Application</button>
                        </div>
                    </>
                )}

            </form>
        </div>
    );
};

export default TranslatorOnboarding;
