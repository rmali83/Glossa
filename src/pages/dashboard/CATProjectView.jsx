import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './GlossaCATStyle.css';

const CATProjectView = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [segments, setSegments] = useState([]);
    const [loading, setLoading] = useState(true);

    const userRole = user?.user_metadata?.user_type || 'Translator';
    const isReviewer = userRole === 'Reviewer';
    const isAdmin = userRole === 'Agencies' || user?.email === 'rmali@live.com';

    useEffect(() => {
        const fetchProjectDetails = async () => {
            setLoading(true);
            try {
                const { data: projData, error: projError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', projectId)
                    .single();

                if (projError) throw projError;
                setProject(projData);

                const mockSegments = [
                    { id: 1, source: "Welcome to the Glossa ecosystem. The most advanced translation workbench.", target: "", status: "Draft" },
                    { id: 2, source: "The quick brown fox jumps over the lazy dog.", target: "", status: "Draft" }
                ];
                setSegments(mockSegments);

            } catch (err) {
                console.error("CAT Load Error:", err);
                alert("Failed to load project details.");
            } finally {
                setLoading(false);
            }
        };
        fetchProjectDetails();
    }, [projectId]);

    const handleSegmentChange = (index, value) => {
        const newSegments = [...segments];
        newSegments[index].target = value;
        setSegments(newSegments);
    };

    const handleApproveSegment = (index) => {
        const newSegments = [...segments];
        newSegments[index].status = 'Approved';
        setSegments(newSegments);
    };

    const handleRejectSegment = (index) => {
        const newSegments = [...segments];
        newSegments[index].status = 'Needs Revision';
        setSegments(newSegments);
    };

    const handleConfirmSegment = (index) => {
        const newSegments = [...segments];
        newSegments[index].status = 'Confirmed';
        setSegments(newSegments);
    };

    const markTranslationCompleted = async () => {
        alert("Marking translation as 'translation_completed'");
        navigate('/dashboard/cat');
    };

    const markReviewCompleted = async () => {
        alert("Marking project as 'completed'");
        navigate('/dashboard/cat');
    };

    const sendBackToTranslator = async () => {
        alert("Sending back to Translator - status: 'revision_required'");
        navigate('/dashboard/cat');
    };

    if (loading) return <div className="cat-workspace-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>Connecting to Language Engine...</div>;

    return (
        <div className="cat-workspace-layout">
            <div className="cat-topbar">
                <div className="cat-topbar-title">
                    <button onClick={() => navigate('/dashboard/cat')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.2rem' }}>&larr;</button>
                    <span>{project?.name}</span>
                    <span className="cat-lang-badge">{project?.source_language} &rarr; {project?.target_language}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {!isReviewer ? (
                        <>
                            <button className="cat-btn-outline" onClick={() => alert('Saving draft...')}>Save Progress</button>
                            <button className="cat-btn-primary" onClick={markTranslationCompleted}>Submit Translation</button>
                        </>
                    ) : (
                        <>
                            <button className="cat-btn-outline" style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }} onClick={sendBackToTranslator}>Request Revision</button>
                            <button className="cat-btn-primary" style={{ background: 'var(--success)' }} onClick={markReviewCompleted}>Approve & Complete</button>
                        </>
                    )}
                </div>
            </div>

            <div className="cat-main-area">
                <div className="cat-editor-panel">
                    {segments.map((seg, index) => (
                        <div key={seg.id} className="cat-segment">
                            <div className="cat-source-col">
                                <div className="cat-segment-header">
                                    <span>#{seg.id}</span>
                                </div>
                                <p className="cat-segment-text">{seg.source}</p>
                            </div>
                            <div className="cat-target-col">
                                <div className="cat-segment-header">
                                    <span>Translation</span>
                                    <span className={`cat-segment-status ${seg.status.toLowerCase().replace(' ', '_')}`}>
                                        {seg.status}
                                    </span>
                                </div>
                                <textarea
                                    className="cat-textarea"
                                    placeholder="Enter natural translation..."
                                    value={seg.target}
                                    onChange={(e) => handleSegmentChange(index, e.target.value)}
                                    disabled={!isReviewer && (seg.status === 'Confirmed' || seg.status === 'Approved')}
                                />

                                <div className="cat-segment-actions">
                                    {(!isReviewer || isAdmin) && (
                                        <>
                                            <button className="cat-magic-btn" onClick={() => alert('AI Translate Segment...')}>
                                                ✨ AI Assist
                                            </button>
                                            <button className="cat-btn-outline cat-btn-small" onClick={() => handleConfirmSegment(index)}>
                                                Confirm
                                            </button>
                                        </>
                                    )}
                                    {isReviewer && (
                                        <>
                                            <button className="cat-btn-outline cat-btn-small" style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }} onClick={() => handleRejectSegment(index)}>Revise</button>
                                            <button className="cat-btn-outline cat-btn-small" style={{ borderColor: 'var(--success)', color: 'var(--success)' }} onClick={() => handleApproveSegment(index)}>Approve</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cat-sidebar-panel">
                    <div className="cat-sidebar-tabs">
                        <button className="cat-sidebar-tab active">Memories</button>
                        <button className="cat-sidebar-tab">Glossary</button>
                        {isReviewer && <button className="cat-sidebar-tab">Notes</button>}
                    </div>

                    <div style={{ flex: '1', overflowY: 'auto' }}>
                        <div className="cat-tm-item">
                            <div className="cat-tm-meta">
                                <span>98% Match</span>
                                <span style={{ color: 'var(--muted)', fontWeight: 'normal' }}>TM-GLOBAL</span>
                            </div>
                            <p className="cat-tm-source">Welcome to the Glossa ecosystem.</p>
                            <p className="cat-tm-target">مرحبًا بك في نظام جلوسا البيئي.</p>
                        </div>
                    </div>

                    {isReviewer && (
                        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)' }}>
                            <textarea
                                style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.75rem', color: 'var(--foreground)', fontSize: '0.85rem', resize: 'none', outline: 'none', marginBottom: '0.5rem' }}
                                rows="3"
                                placeholder="Add contextual notes..."
                            ></textarea>
                            <button className="cat-btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}>Send Note</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CATProjectView;

