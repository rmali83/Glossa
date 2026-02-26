import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './DashboardPages.css';

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
                // Fetch basic project info
                const { data: projData, error: projError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', projectId)
                    .single();

                if (projError) throw projError;
                setProject(projData);

                // For the purpose of the UI task, let's mock segments if none exist yet
                // Normally we would fetch: const { data: segData } = await supabase.from('segments').eq('project_id', projectId);
                const mockSegments = [
                    { id: 1, source: "Welcome to the Glossa ecosystem.", target: "", status: "Draft" },
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
        // Update DB: supabase.from('projects').update({ status: 'translation_completed' }).eq('id', projectId);
        navigate('/dashboard/cat');
    };

    const markReviewCompleted = async () => {
        alert("Marking project as 'completed'");
        // Update DB: supabase.from('projects').update({ status: 'completed' }).eq('id', projectId);
        navigate('/dashboard/cat');
    };

    const sendBackToTranslator = async () => {
        alert("Sending back to Translator - status: 'revision_required'");
        // Update DB: supabase.from('projects').update({ status: 'revision_required' }).eq('id', projectId);
        navigate('/dashboard/cat');
    };

    if (loading) return <div className="dashboard-page loading-state" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Connecting to CAT Engine...</div>;

    return (
        <div style={{ padding: '0', background: '#0a0a1a', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="cat-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 30px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={() => navigate('/dashboard/cat')} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2rem' }}>❮ Back</button>
                    <h2>{project?.name} <span style={{ fontSize: '0.8rem', color: '#666', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>{project?.source_language} to {project?.target_language}</span></h2>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {!isReviewer ? (
                        <>
                            <button className="primary-btn outline" style={{ padding: '8px 15px', fontSize: '0.8rem' }} onClick={() => alert('Saving draft...')}>Save Draft</button>
                            <button className="primary-btn" style={{ padding: '8px 15px', fontSize: '0.8rem' }} onClick={markTranslationCompleted}>Translation Completed</button>
                        </>
                    ) : (
                        <>
                            <button className="primary-btn outline" style={{ padding: '8px 15px', fontSize: '0.8rem', borderColor: '#ff4d4d', color: '#ff4d4d' }} onClick={sendBackToTranslator}>Send Back to Translator</button>
                            <button className="primary-btn" style={{ padding: '8px 15px', fontSize: '0.8rem', background: '#52b788' }} onClick={markReviewCompleted}>Approve All / Mark Completed</button>
                        </>
                    )}
                </div>
            </div>

            <div className="cat-workspace" style={{ flex: '1', display: 'flex', overflow: 'hidden' }}>
                <div className="cat-segments" style={{ flex: '2', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {segments.map((seg, index) => (
                        <div key={seg.id} className="segment-row" style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                            <div className="segment-left" style={{ flex: '1', padding: '15px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#888', fontSize: '0.8rem' }}>
                                    <span>#{seg.id}</span>
                                    <span>🔒</span>
                                </div>
                                <p style={{ margin: 0, lineHeight: '1.5', fontSize: '1rem' }}>{seg.source}</p>
                            </div>
                            <div className="segment-right" style={{ flex: '1', padding: '15px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#888', fontSize: '0.8rem' }}>
                                    <span>Translation</span>
                                    <span style={{
                                        color: seg.status === 'Confirmed' || seg.status === 'Approved' ? '#52b788' :
                                            seg.status === 'Needs Revision' ? '#ff9f1c' : '#888'
                                    }}>
                                        {seg.status}
                                    </span>
                                </div>
                                <textarea
                                    style={{ flex: '1', width: '100%', minHeight: '80px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', resize: 'none', outline: 'none' }}
                                    placeholder="Enter translation here..."
                                    value={seg.target}
                                    onChange={(e) => handleSegmentChange(index, e.target.value)}
                                    disabled={!isReviewer && (seg.status === 'Confirmed' || seg.status === 'Approved')}
                                />

                                <div className="segment-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                    {(!isReviewer || isAdmin) && (
                                        <>
                                            <button className="text-btn" style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)' }} onClick={() => alert('AI Translate Segment...')}>✨ Translate</button>
                                            <button className="primary-btn outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleConfirmSegment(index)}>Confirm</button>
                                        </>
                                    )}
                                    {isReviewer && (
                                        <>
                                            <button className="primary-btn outline" style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: '#ff9f1c', color: '#ff9f1c' }} onClick={() => handleRejectSegment(index)}>Needs Revision</button>
                                            <button className="primary-btn outline" style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: '#52b788', color: '#52b788' }} onClick={() => handleApproveSegment(index)}>Approve</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cat-sidebar" style={{ flex: '1', background: 'rgba(0,0,0,0.2)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <button style={{ flex: 1, padding: '15px', background: 'rgba(0, 255, 255, 0.05)', border: 'none', color: 'var(--neon-cyan)', borderBottom: '2px solid var(--neon-cyan)', cursor: 'pointer' }}>Translation Memory</button>
                        <button style={{ flex: 1, padding: '15px', background: 'transparent', border: 'none', color: '#888', borderBottom: '2px solid transparent', cursor: 'pointer' }}>Glossary</button>
                        {isReviewer && <button style={{ flex: 1, padding: '15px', background: 'transparent', border: 'none', color: '#888', borderBottom: '2px solid transparent', cursor: 'pointer' }}>Comments</button>}
                    </div>

                    <div className="tab-content" style={{ padding: '20px', flex: '1', overflowY: 'auto' }}>
                        <div className="tm-suggestion" style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#52b788', fontSize: '0.8rem', marginBottom: '8px' }}>
                                <span>95% Match</span>
                                <span>TM-104</span>
                            </div>
                            <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#aaa' }}>Welcome to the Glossa portal.</p>
                            <p style={{ margin: '0', fontSize: '0.9rem', color: '#fff' }}>أهلاً بك في بوابة جلوسا.</p>
                        </div>
                    </div>

                    {/* Reviewer Comment Input Logic would go here */}
                    {isReviewer && (
                        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <textarea className="glass-input" rows="3" placeholder="Add comment for translator regarding selected segment..."></textarea>
                            <button className="primary-btn outline" style={{ width: '100%', marginTop: '10px', fontSize: '0.8rem' }}>Add Comment</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CATProjectView;
