import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPages.css';
import './DashboardTheme.css';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import SimpleQualityChart from '../../components/SimpleQualityChart';
import SimpleErrorChart from '../../components/SimpleErrorChart';
import SimpleProductivityChart from '../../components/SimpleProductivityChart';

// Component for managing global annotation settings for the entire workspace
const GlobalAnnotationSettings = ({ onUpdate }) => {
    const [settings, setSettings] = useState({
        error_types: true,
        error_severity: false,
        domain_classification: true,
        quality_rating: true,
        translation_effort: false,
        post_editing_effort: false,
        ai_quality_rating: false,
        confidence_score: false,
        notes: true,
        mqm_evaluation: false
    });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const annotationFeatures = [
        { 
            key: 'error_types', 
            label: 'Error Types', 
            desc: 'Fluency, Grammar, Terminology, Style, Accuracy checkboxes', 
            default: true,
            icon: '🔍'
        },
        { 
            key: 'error_severity', 
            label: 'Error Severity Levels', 
            desc: 'Minor, Major, Critical severity selection for each error type', 
            default: false,
            icon: '⚠️'
        },
        { 
            key: 'domain_classification', 
            label: 'Domain Classification', 
            desc: 'Domain and subdomain selection dropdowns', 
            default: true,
            icon: '🏷️'
        },
        { 
            key: 'quality_rating', 
            label: 'Quality Rating', 
            desc: '1-5 star overall translation quality rating', 
            default: true,
            icon: '⭐'
        },
        { 
            key: 'translation_effort', 
            label: 'Translation Effort Tracking', 
            desc: 'Easy, Medium, Hard, Very Hard effort level buttons', 
            default: false,
            icon: '⏱️'
        },
        { 
            key: 'post_editing_effort', 
            label: 'Post-Editing Effort', 
            desc: 'AI translation editing effort tracking (No Editing, Light, Heavy, Retranslated)', 
            default: false,
            icon: '🤖'
        },
        { 
            key: 'ai_quality_rating', 
            label: 'AI Translation Quality', 
            desc: '1-5 star AI translation quality rating + helpfulness assessment', 
            default: false,
            icon: '🧠'
        },
        { 
            key: 'confidence_score', 
            label: 'Translator Confidence', 
            desc: '1-5 star confidence rating + uncertainty area checkboxes', 
            default: false,
            icon: '💪'
        },
        { 
            key: 'notes', 
            label: 'Notes Field', 
            desc: 'Free text notes and comments textarea', 
            default: true,
            icon: '📝'
        },
        { 
            key: 'mqm_evaluation', 
            label: 'MQM Evaluation', 
            desc: 'Multidimensional Quality Metrics with error categories, severity, and scoring', 
            default: false,
            icon: '📊'
        }
    ];

    // Load current global settings
    useEffect(() => {
        loadGlobalSettings();
    }, []);

    const loadGlobalSettings = async () => {
        setLoading(true);
        try {
            // Check if global settings exist in a settings table or use default
            // For now, we'll store in localStorage and later move to database
            const savedSettings = localStorage.getItem('glossa_global_annotation_settings');
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
        } catch (err) {
            console.error('Error loading global settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key) => {
        setSettings({ ...settings, [key]: !settings[key] });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save to localStorage for now (later we can move to database)
            localStorage.setItem('glossa_global_annotation_settings', JSON.stringify(settings));
            
            // Also update all existing projects to use these global settings
            const { data: projects } = await supabase
                .from('projects')
                .select('id')
                .limit(1000);

            if (projects && projects.length > 0) {
                const { error } = await supabase
                    .from('projects')
                    .update({ annotation_settings: settings })
                    .in('id', projects.map(p => p.id));

                if (error) {
                    console.error('Error updating project settings:', error);
                }
            }

            alert('✅ Global annotation settings saved successfully!\nAll projects will now use these settings.');
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('Save error:', err);
            alert('❌ Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const handleResetToDefaults = () => {
        const defaults = {
            error_types: true,
            error_severity: false,
            domain_classification: true,
            quality_rating: true,
            translation_effort: false,
            post_editing_effort: false,
            ai_quality_rating: false,
            confidence_score: false,
            notes: true
        };
        setSettings(defaults);
    };

    const enabledCount = Object.values(settings).filter(v => v).length;

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                Loading settings...
            </div>
        );
    }

    return (
        <div>
            {/* Header Info */}
            <div style={{
                padding: '1.5rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '2rem' }}>🌐</div>
                    <div>
                        <h3 style={{ margin: 0, color: '#10b981', fontSize: '1.2rem' }}>
                            Workspace-Wide Annotation Control
                        </h3>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#6ee7b7', fontSize: '0.9rem' }}>
                            {enabledCount}/9 features enabled • Changes apply to all projects immediately
                        </p>
                    </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#a7f3d0' }}>
                    💡 <strong>How it works:</strong> Check the annotation features you want available in the CAT workspace. 
                    Unchecked features will be hidden from all translators and reviewers across all projects.
                </p>
            </div>

            {/* Feature Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {annotationFeatures.map(({ key, label, desc, default: isDefault, icon }) => (
                    <div 
                        key={key}
                        style={{
                            padding: '1.5rem',
                            background: settings[key] ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                            border: `2px solid ${settings[key] ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: '12px',
                            transition: 'all 0.3s',
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                        onClick={() => handleToggle(key)}
                    >
                        {/* Status Indicator */}
                        <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: settings[key] ? '#10b981' : '#666'
                        }} />

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ fontSize: '2rem' }}>{icon}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings[key]}
                                        onChange={() => handleToggle(key)}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            cursor: 'pointer'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                                        {label}
                                    </h4>
                                    {isDefault && (
                                        <span style={{
                                            fontSize: '0.65rem',
                                            padding: '3px 8px',
                                            background: 'rgba(59, 130, 246, 0.2)',
                                            color: '#60a5fa',
                                            borderRadius: '6px',
                                            fontWeight: '700'
                                        }}>
                                            DEFAULT
                                        </span>
                                    )}
                                </div>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#888', lineHeight: '1.4' }}>
                                    {desc}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                    onClick={handleResetToDefaults}
                    style={{
                        padding: '12px 24px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                >
                    🔄 Reset to Defaults
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        padding: '12px 32px',
                        background: saving ? '#666' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        boxShadow: saving ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.2s'
                    }}
                >
                    {saving ? (
                        <>
                            <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                            Saving...
                        </>
                    ) : (
                        <>
                            💾 Save Global Settings
                        </>
                    )}
                </button>
            </div>

            {/* Preview Info */}
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px'
            }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#60a5fa' }}>
                    🔍 <strong>Preview:</strong> With current settings, translators will see {enabledCount} annotation features in the CAT workspace: {' '}
                    {annotationFeatures
                        .filter(f => settings[f.key])
                        .map(f => f.label)
                        .join(', ')
                    }
                </p>
            </div>
        </div>
    );
};

// Component for managing annotation settings per project (keeping for backward compatibility)
const ProjectAnnotationSettings = ({ project, onUpdate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [settings, setSettings] = useState(project.annotation_settings || {
        error_types: true,
        error_severity: false,
        domain_classification: true,
        quality_rating: true,
        translation_effort: false,
        post_editing_effort: false,
        ai_quality_rating: false,
        confidence_score: false,
        notes: true
    });
    const [saving, setSaving] = useState(false);

    const annotationFeatures = [
        { key: 'error_types', label: 'Error Types', desc: 'Fluency, Grammar, Terminology, Style, Accuracy', default: true },
        { key: 'error_severity', label: 'Error Severity', desc: 'Minor, Major, Critical levels for each error', default: false },
        { key: 'domain_classification', label: 'Domain Classification', desc: 'Domain and subdomain selection', default: true },
        { key: 'quality_rating', label: 'Quality Rating', desc: '1-5 star overall quality rating', default: true },
        { key: 'translation_effort', label: 'Translation Effort', desc: 'Easy, Medium, Hard, Very Hard tracking', default: false },
        { key: 'post_editing_effort', label: 'Post-Editing Effort', desc: 'AI translation editing effort tracking', default: false },
        { key: 'ai_quality_rating', label: 'AI Quality Rating', desc: '1-5 star AI translation quality + helpfulness', default: false },
        { key: 'confidence_score', label: 'Confidence Score', desc: 'Translator confidence + uncertainty areas', default: false },
        { key: 'notes', label: 'Notes Field', desc: 'Free text notes and comments', default: true }
    ];

    const handleToggle = (key) => {
        setSettings({ ...settings, [key]: !settings[key] });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('projects')
                .update({ annotation_settings: settings })
                .eq('id', project.id);

            if (error) {
                console.error('Error saving annotation settings:', error);
                alert('Failed to save settings');
            } else {
                alert('✓ Annotation settings saved successfully!');
                if (onUpdate) onUpdate();
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const handleResetToDefaults = () => {
        const defaults = {
            error_types: true,
            error_severity: false,
            domain_classification: true,
            quality_rating: true,
            translation_effort: false,
            post_editing_effort: false,
            ai_quality_rating: false,
            confidence_score: false,
            notes: true
        };
        setSettings(defaults);
    };

    const enabledCount = Object.values(settings).filter(v => v).length;

    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            overflow: 'hidden'
        }}>
            {/* Project Header */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    padding: '1rem 1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isExpanded ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                    transition: 'all 0.2s'
                }}
            >
                <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                        {project.name}
                    </h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>
                        {project.source_language} → {project.target_language} • {enabledCount}/9 features enabled
                    </p>
                </div>
                <div style={{ fontSize: '1.5rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                </div>
            </div>

            {/* Settings Panel */}
            {isExpanded && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    {/* Feature Toggles */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                        {annotationFeatures.map(({ key, label, desc, default: isDefault }) => (
                            <div 
                                key={key}
                                style={{
                                    padding: '1rem',
                                    background: settings[key] ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                                    border: `2px solid ${settings[key] ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings[key]}
                                        onChange={() => handleToggle(key)}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            marginTop: '2px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{label}</span>
                                            {isDefault && (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    padding: '2px 6px',
                                                    background: 'rgba(59, 130, 246, 0.2)',
                                                    color: '#60a5fa',
                                                    borderRadius: '4px',
                                                    fontWeight: '600'
                                                }}>
                                                    DEFAULT
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#888', lineHeight: '1.4' }}>
                                            {desc}
                                        </p>
                                    </div>
                                </label>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleResetToDefaults}
                            style={{
                                padding: '10px 20px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}
                        >
                            Reset to Defaults
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                padding: '10px 24px',
                                background: saving ? '#666' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {saving ? (
                                <>
                                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    💾 Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminEnhanced = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview'); // overview, users, jobs, analytics, reports, datasets, annotation-settings
    const [translators, setTranslators] = useState([]);
    const [projects, setProjects] = useState([]);
    const [datasets, setDatasets] = useState([]);
    const [annotations, setAnnotations] = useState([]);
    const [datasetStats, setDatasetStats] = useState({
        total: 0,
        byDomain: {},
        byLanguage: {},
        withErrors: 0,
        avgQuality: 0
    });
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeTranslators: 0,
        totalProjects: 0,
        completedProjects: 0,
        inProgressProjects: 0,
        totalRevenue: 0,
        totalWords: 0,
        avgCompletionTime: 0
    });
    const [activityLog, setActivityLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDomain, setFilterDomain] = useState('all');
    const [filterLanguage, setFilterLanguage] = useState('all');
    const [filterQuality, setFilterQuality] = useState('all');

    useEffect(() => {
        fetchAdminData();
        if (activeTab === 'datasets') {
            fetchDatasets();
        }
        if (activeTab === 'analytics') {
            fetchAnnotations();
        }
    }, [activeTab]);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            console.log('Fetching admin data...');
            
            // Fetch all profiles with error handling
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
            }
            setTranslators(profiles || []);

            // Fetch all projects with relations and error handling
            const { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select(`
                    *,
                    translator:translator_id(full_name, email),
                    reviewer:reviewer_id(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (projectsError) {
                console.error('Error fetching projects:', projectsError);
            }

            console.log('Fetched projects:', projectsData?.length || 0, 'projects');
            setProjects(projectsData || []);

            // Fetch activity log with error handling
            const { data: activities, error: activitiesError } = await supabase
                .from('activity_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (activitiesError) {
                console.error('Error fetching activities:', activitiesError);
            }
            setActivityLog(activities || []);

            // Calculate stats safely
            const completedProjects = projectsData?.filter(p => p.status === 'completed').length || 0;
            const inProgressProjects = projectsData?.filter(p => p.status === 'in_progress' || p.status === 'pending').length || 0;
            const totalRevenue = projectsData?.reduce((sum, p) => sum + (p.total_payment || 0), 0) || 0;
            const totalWords = projectsData?.reduce((sum, p) => sum + (p.total_words || 0), 0) || 0;

            setStats({
                totalUsers: profiles?.length || 0,
                activeTranslators: profiles?.filter(p => p.user_type === 'Translator' || p.user_type === 'Freelance Translator').length || 0,
                totalProjects: projectsData?.length || 0,
                completedProjects,
                inProgressProjects,
                totalRevenue,
                totalWords,
                avgCompletionTime: 3.5 // days - calculate from actual data later
            });

            console.log('Admin data fetch completed successfully');
        } catch (err) {
            console.error('Admin fetch error:', err);
            // Set default values to prevent crashes
            setStats({
                totalUsers: 0,
                activeTranslators: 0,
                totalProjects: 0,
                completedProjects: 0,
                inProgressProjects: 0,
                totalRevenue: 0,
                totalWords: 0,
                avgCompletionTime: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchDatasets = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('dataset_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching datasets:', error);
                return;
            }

            setDatasets(data || []);

            // Calculate dataset statistics
            const total = data?.length || 0;
            const withErrors = data?.filter(d => d.has_errors).length || 0;
            
            // Group by domain
            const byDomain = {};
            data?.forEach(d => {
                if (d.domain) {
                    byDomain[d.domain] = (byDomain[d.domain] || 0) + 1;
                }
            });

            // Group by language pair
            const byLanguage = {};
            data?.forEach(d => {
                const pair = `${d.source_language}-${d.target_language}`;
                byLanguage[pair] = (byLanguage[pair] || 0) + 1;
            });

            // Calculate average quality
            const qualityRatings = data?.filter(d => d.quality_rating).map(d => d.quality_rating) || [];
            const avgQuality = qualityRatings.length > 0 
                ? (qualityRatings.reduce((sum, r) => sum + r, 0) / qualityRatings.length).toFixed(2)
                : 0;

            setDatasetStats({
                total,
                byDomain,
                byLanguage,
                withErrors,
                avgQuality
            });
        } catch (err) {
            console.error('Dataset fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnnotations = async () => {
        try {
            console.log('Fetching annotations for Analytics Dashboard...');
            const { data, error } = await supabase
                .from('annotations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1000); // Get last 1000 annotations for analytics

            if (error) {
                console.error('Error fetching annotations:', error);
                // Set empty array but don't fail completely
                setAnnotations([]);
                return;
            }

            console.log('Successfully fetched annotations:', data?.length || 0);
            setAnnotations(data || []);
        } catch (err) {
            console.error('Annotations fetch error:', err);
            // Gracefully handle errors by setting empty array
            setAnnotations([]);
        }
    };

    const handleDeleteAllProjects = async () => {
        if (window.confirm('⚠️ WARNING: This will permanently delete ALL projects. Continue?')) {
            if (window.confirm('🚨 FINAL CONFIRMATION: Delete all projects?')) {
                try {
                    setLoading(true);
                    await supabase.from('segments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                    await supabase.from('project_files').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                    await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                    alert('✅ All projects deleted!');
                    fetchAdminData();
                } catch (err) {
                    alert('❌ Error: ' + err.message);
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    const handleSuspendUser = async (userId) => {
        try {
            await supabase
                .from('profiles')
                .update({ status: 'suspended' })
                .eq('id', userId);
            alert('User suspended');
            fetchAdminData();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const exportData = (type) => {
        let data, filename;
        if (type === 'users') {
            data = translators;
            filename = 'users_export.json';
        } else if (type === 'projects') {
            data = projects;
            filename = 'projects_export.json';
        } else if (type === 'datasets-json') {
            data = datasets;
            filename = `glossa_dataset_${new Date().toISOString().split('T')[0]}.json`;
        } else if (type === 'datasets-csv') {
            exportDatasetsCSV();
            return;
        }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    const exportDatasetsCSV = () => {
        if (datasets.length === 0) {
            alert('No datasets to export');
            return;
        }

        // CSV headers
        const headers = [
            'ID',
            'Source Text',
            'Source Language',
            'Target Language',
            'AI Translation',
            'Human Translation',
            'Domain',
            'Quality Rating',
            'Has Errors',
            'Error Types',
            'Edit Distance',
            'Created At'
        ];

        // CSV rows
        const rows = datasets.map(d => [
            d.id,
            `"${(d.source_text || '').replace(/"/g, '""')}"`,
            d.source_language,
            d.target_language,
            `"${(d.ai_translation || '').replace(/"/g, '""')}"`,
            `"${(d.human_translation || '').replace(/"/g, '""')}"`,
            d.domain || '',
            d.quality_rating || '',
            d.has_errors ? 'Yes' : 'No',
            `"${(d.error_types || []).join(', ')}"`,
            d.edit_distance || 0,
            new Date(d.created_at).toISOString()
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `glossa_dataset_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const filteredDatasets = datasets.filter(d => {
        const matchesSearch = searchTerm === '' || 
            d.source_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.human_translation?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDomain = filterDomain === 'all' || d.domain === filterDomain;
        const matchesLanguage = filterLanguage === 'all' || `${d.source_language}-${d.target_language}` === filterLanguage;
        const matchesQuality = filterQuality === 'all' || d.quality_rating === parseInt(filterQuality);
        return matchesSearch && matchesDomain && matchesLanguage && matchesQuality;
    });

    if (loading) return <div className="dashboard-page loading-state">Loading Admin Dashboard...</div>;

    return (
        <div className="dashboard-page fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>Admin Control Panel - DEPLOYMENT TEST v2.1</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleDeleteAllProjects}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        🗑️ Delete All
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/admin/create-job')}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        + Create Job
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginBottom: '2rem',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: '1rem'
            }}>
                {['overview', 'users', 'jobs', 'datasets', 'analytics', 'reports', 'annotation-settings'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px',
                            background: activeTab === tab ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab === 'datasets' ? '🧬 Datasets' : tab === 'annotation-settings' ? '⚙️ Annotation' : tab}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <>
                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '2rem' }}>
                        <div className="payment-stat-card">
                            <label>Total Users</label>
                            <h2 className="stat-value">{stats.totalUsers}</h2>
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>
                                {stats.activeTranslators} Active Translators
                            </p>
                        </div>
                        <div className="payment-stat-card highlight">
                            <label>Total Projects</label>
                            <h2 className="stat-value">{stats.totalProjects}</h2>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>
                                {stats.inProgressProjects} In Progress
                            </p>
                        </div>
                        <div className="payment-stat-card">
                            <label>Total Revenue</label>
                            <h2 className="stat-value">${stats.totalRevenue.toLocaleString()}</h2>
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>
                                {stats.completedProjects} Completed
                            </p>
                        </div>
                        <div className="payment-stat-card">
                            <label>Total Words</label>
                            <h2 className="stat-value">{stats.totalWords.toLocaleString()}</h2>
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>
                                Avg {stats.avgCompletionTime} days
                            </p>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
                        <div className="card-header">
                            <h3>Recent Activity</h3>
                        </div>
                        <div style={{ padding: '1rem' }}>
                            {activityLog.length === 0 ? (
                                <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>No recent activity</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {activityLog.slice(0, 10).map(activity => (
                                        <div key={activity.id} style={{
                                            padding: '12px',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <strong style={{ color: '#fff' }}>{activity.action}</strong>
                                                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                                                    {activity.details?.project_name || 'N/A'}
                                                </p>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: '#666' }}>
                                                {new Date(activity.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="dashboard-card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>User Management</h3>
                        <button
                            onClick={() => exportData('users')}
                            style={{
                                padding: '8px 16px',
                                background: '#667eea',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            📥 Export Users
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="payment-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Type</th>
                                    <th>Language Pairs</th>
                                    <th>Rate</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {translators.map(t => (
                                    <tr key={t.id}>
                                        <td><strong>{t.full_name}</strong></td>
                                        <td style={{ fontSize: '0.85rem', color: '#666' }}>{t.email}</td>
                                        <td><span className="status-pill">{t.user_type}</span></td>
                                        <td style={{ fontSize: '0.8rem' }}>{t.language_pairs?.join(', ') || 'N/A'}</td>
                                        <td>${t.rate}/hr</td>
                                        <td>
                                            <span className={`status-pill ${t.status === 'suspended' ? 'draft' : 'completed'}`}>
                                                {t.status || 'active'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleSuspendUser(t.id)}
                                                style={{
                                                    padding: '4px 12px',
                                                    background: '#ef4444',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Suspend
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
                <div className="dashboard-card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3>Job Management</h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '8px 16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{
                                    padding: '8px 16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                            <button
                                onClick={() => exportData('projects')}
                                style={{
                                    padding: '8px 16px',
                                    background: '#667eea',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                📥 Export
                            </button>
                        </div>
                    </div>
                    <div className="table-container">
                        <table className="payment-table">
                            <thead>
                                <tr>
                                    <th>Job Name</th>
                                    <th>Languages</th>
                                    <th>Words</th>
                                    <th>Payment</th>
                                    <th>Translator</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                            No jobs found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProjects.map(project => (
                                        <tr key={project.id}>
                                            <td><strong>{project.name}</strong></td>
                                            <td style={{ fontSize: '0.8rem' }}>
                                                {project.source_language} → {project.target_language}
                                            </td>
                                            <td>{project.total_words?.toLocaleString() || 0}</td>
                                            <td>${project.total_payment?.toFixed(2) || '0.00'}</td>
                                            <td style={{ fontSize: '0.8rem' }}>
                                                {project.translator?.full_name || 'Unassigned'}
                                            </td>
                                            <td>
                                                <span className={`status-pill ${
                                                    project.status === 'completed' ? 'completed' :
                                                    project.status === 'in_progress' ? 'in-progress' :
                                                    project.status === 'pending' ? 'pending' :
                                                    'draft'
                                                }`}>
                                                    {project.status || 'draft'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.75rem', color: '#666' }}>
                                                {new Date(project.created_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => navigate(`/dashboard/cat/${project.id}`)}
                                                    className="primary-btn"
                                                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                >
                                                    Open
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Datasets Tab */}
            {activeTab === 'datasets' && (
                <>
                    {/* Dataset Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '2rem' }}>
                        <div className="payment-stat-card highlight">
                            <label>Total Datasets</label>
                            <h2 className="stat-value">{datasetStats.total}</h2>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>
                                Training entries
                            </p>
                        </div>
                        <div className="payment-stat-card">
                            <label>With Errors</label>
                            <h2 className="stat-value">{datasetStats.withErrors}</h2>
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>
                                {datasetStats.total > 0 ? Math.round((datasetStats.withErrors / datasetStats.total) * 100) : 0}% of total
                            </p>
                        </div>
                        <div className="payment-stat-card">
                            <label>Avg Quality</label>
                            <h2 className="stat-value">{datasetStats.avgQuality}</h2>
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>
                                Out of 5 stars
                            </p>
                        </div>
                        <div className="payment-stat-card">
                            <label>Domains</label>
                            <h2 className="stat-value">{Object.keys(datasetStats.byDomain).length}</h2>
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>
                                Unique domains
                            </p>
                        </div>
                    </div>

                    {/* Domain Distribution */}
                    <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
                        <div className="card-header">
                            <h3>Dataset Distribution by Domain</h3>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                {Object.entries(datasetStats.byDomain)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 9)
                                    .map(([domain, count]) => (
                                        <div key={domain} style={{
                                            padding: '12px',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ fontSize: '0.9rem' }}>{domain}</span>
                                            <strong style={{ color: '#667eea' }}>{count}</strong>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Dataset Table */}
                    <div className="dashboard-card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <h3>Dataset Management</h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="Search datasets..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                />
                                <select
                                    value={filterDomain}
                                    onChange={(e) => setFilterDomain(e.target.value)}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <option value="all">All Domains</option>
                                    {Object.keys(datasetStats.byDomain).map(domain => (
                                        <option key={domain} value={domain}>{domain}</option>
                                    ))}
                                </select>
                                <select
                                    value={filterLanguage}
                                    onChange={(e) => setFilterLanguage(e.target.value)}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <option value="all">All Languages</option>
                                    {Object.keys(datasetStats.byLanguage).map(pair => (
                                        <option key={pair} value={pair}>{pair}</option>
                                    ))}
                                </select>
                                <select
                                    value={filterQuality}
                                    onChange={(e) => setFilterQuality(e.target.value)}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <option value="all">All Quality</option>
                                    <option value="5">5 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="2">2 Stars</option>
                                    <option value="1">1 Star</option>
                                </select>
                                <button
                                    onClick={() => exportData('datasets-csv')}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#10b981',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    📥 Export CSV
                                </button>
                                <button
                                    onClick={() => exportData('datasets-json')}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#667eea',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    📥 Export JSON
                                </button>
                            </div>
                        </div>
                        <div className="table-container">
                            <table className="payment-table">
                                <thead>
                                    <tr>
                                        <th>Source Text</th>
                                        <th>Languages</th>
                                        <th>AI Translation</th>
                                        <th>Human Translation</th>
                                        <th>Domain</th>
                                        <th>Quality</th>
                                        <th>Errors</th>
                                        <th>Edit Distance</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDatasets.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                                {datasets.length === 0 ? 'No datasets captured yet. Start translating in CAT workspace!' : 'No datasets match your filters'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDatasets.map(dataset => (
                                            <tr key={dataset.id}>
                                                <td style={{ maxWidth: '200px' }}>
                                                    <div style={{ 
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis', 
                                                        whiteSpace: 'nowrap',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {dataset.source_text}
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '0.8rem' }}>
                                                    {dataset.source_language} → {dataset.target_language}
                                                </td>
                                                <td style={{ maxWidth: '150px' }}>
                                                    <div style={{ 
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis', 
                                                        whiteSpace: 'nowrap',
                                                        fontSize: '0.8rem',
                                                        color: '#888'
                                                    }}>
                                                        {dataset.ai_translation}
                                                    </div>
                                                </td>
                                                <td style={{ maxWidth: '150px' }}>
                                                    <div style={{ 
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis', 
                                                        whiteSpace: 'nowrap',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        {dataset.human_translation}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="status-pill" style={{ fontSize: '0.75rem' }}>
                                                        {dataset.domain || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {dataset.quality_rating ? (
                                                        <div style={{ display: 'flex', gap: '2px' }}>
                                                            {[...Array(5)].map((_, i) => (
                                                                <span key={i} style={{ 
                                                                    color: i < dataset.quality_rating ? '#fbbf24' : '#333',
                                                                    fontSize: '0.9rem'
                                                                }}>★</span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#666', fontSize: '0.8rem' }}>N/A</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {dataset.has_errors ? (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                            {dataset.error_types?.map(error => (
                                                                <span key={error} style={{
                                                                    padding: '2px 6px',
                                                                    background: '#ef4444',
                                                                    color: '#fff',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.7rem'
                                                                }}>
                                                                    {error}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#10b981', fontSize: '0.8rem' }}>✓ Clean</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {dataset.edit_distance || 0}
                                                </td>
                                                <td style={{ fontSize: '0.75rem', color: '#666' }}>
                                                    {new Date(dataset.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                Showing {filteredDatasets.length} of {datasets.length} datasets
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                💡 Datasets are automatically captured when translators edit AI translations
                            </span>
                        </div>
                    </div>
                </>
            )}

            {/* Annotation Settings Tab */}
            {activeTab === 'annotation-settings' && (
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>⚙️ Global Annotation Settings</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                            Control which annotation features are available across all projects in your workspace
                        </p>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                        <GlobalAnnotationSettings onUpdate={fetchAdminData} />
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <>
                    {/* Analytics Header */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem' }}>
                            📊 Analytics Dashboard v2.1
                        </h2>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>
                            Comprehensive insights into translation quality, productivity, and error patterns - UPDATED
                        </p>
                        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                            Data loaded: {annotations.length} annotations, {projects.length} projects
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '2rem' }}>
                        {/* Quality Trends Chart */}
                        <div style={{ minHeight: '350px' }}>
                            <SimpleQualityChart data={annotations} />
                        </div>
                        
                        {/* Error Analysis and Productivity Charts */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
                            <div style={{ minHeight: '350px' }}>
                                <SimpleErrorChart data={annotations} />
                            </div>
                            <div style={{ minHeight: '350px' }}>
                                <SimpleProductivityChart projects={projects} annotations={annotations} />
                            </div>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h3>Project Status Distribution</h3>
                            </div>
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Completed</span>
                                        <div style={{ flex: 1, margin: '0 15px', height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ width: `${stats.totalProjects > 0 ? (stats.completedProjects / stats.totalProjects) * 100 : 0}%`, height: '100%', background: '#10b981' }}></div>
                                        </div>
                                        <strong>{stats.completedProjects}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>In Progress</span>
                                        <div style={{ flex: 1, margin: '0 15px', height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ width: `${stats.totalProjects > 0 ? (stats.inProgressProjects / stats.totalProjects) * 100 : 0}%`, height: '100%', background: '#3b82f6' }}></div>
                                        </div>
                                        <strong>{stats.inProgressProjects}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-card">
                            <div className="card-header">
                                <h3>Revenue Overview</h3>
                            </div>
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <h2 style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1rem' }}>
                                    ${stats.totalRevenue.toLocaleString()}
                                </h2>
                                <p style={{ color: '#666' }}>Total Platform Revenue</p>
                                <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', color: '#666' }}>Avg per Project</p>
                                        <strong style={{ fontSize: '1.5rem', color: '#fff' }}>
                                            ${stats.totalProjects > 0 ? (stats.totalRevenue / stats.totalProjects).toFixed(2) : '0.00'}
                                        </strong>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', color: '#666' }}>Avg per Word</p>
                                        <strong style={{ fontSize: '1.5rem', color: '#fff' }}>
                                            ${stats.totalWords > 0 ? (stats.totalRevenue / stats.totalWords).toFixed(3) : '0.000'}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Generate Reports</h3>
                    </div>
                    <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <button
                            onClick={() => exportData('users')}
                            style={{
                                padding: '2rem',
                                background: 'rgba(255,255,255,0.02)',
                                border: '2px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.02)'}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👥</div>
                            <h4>Users Report</h4>
                            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '10px' }}>
                                Export all user data
                            </p>
                        </button>

                        <button
                            onClick={() => exportData('projects')}
                            style={{
                                padding: '2rem',
                                background: 'rgba(255,255,255,0.02)',
                                border: '2px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.02)'}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                            <h4>Projects Report</h4>
                            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '10px' }}>
                                Export all project data
                            </p>
                        </button>

                        <button
                            onClick={() => alert('Financial report coming soon!')}
                            style={{
                                padding: '2rem',
                                background: 'rgba(255,255,255,0.02)',
                                border: '2px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.02)'}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💰</div>
                            <h4>Financial Report</h4>
                            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '10px' }}>
                                Revenue & payments
                            </p>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEnhanced;
