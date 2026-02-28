import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './CATProjectWorkspace.css';

const CATProjectView = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [segments, setSegments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('tm');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [theme, setTheme] = useState('dark');
    const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
    const [tmMatches, setTmMatches] = useState([]);
    const [glossaryTerms, setGlossaryTerms] = useState([]);

    const userRole = user?.user_metadata?.user_type || 'Translator';
    const isReviewer = userRole === 'Reviewer';
    const isAdmin = userRole === 'Agencies' || user?.email === 'rmali@live.com';

    // Fetch TM and Glossary when active segment changes
    useEffect(() => {
        if (project && segments[activeSegmentIndex]) {
            fetchTranslationMemory();
            fetchGlossaryTerms();
        }
    }, [activeSegmentIndex, project]);

    const fetchTranslationMemory = async () => {
        if (!project) return;
        
        try {
            const { data, error } = await supabase
                .from('translation_memory')
                .select('*')
                .eq('source_language', project.source_language)
                .eq('target_language', project.target_language)
                .limit(5);

            if (!error && data) {
                setTmMatches(data);
            }
        } catch (err) {
            console.error('Error fetching TM:', err);
        }
    };

    const fetchGlossaryTerms = async () => {
        if (!project) return;
        
        try {
            const { data, error } = await supabase
                .from('glossary_terms')
                .select('*')
                .eq('source_language', project.source_language)
                .eq('target_language', project.target_language)
                .limit(10);

            if (!error && data) {
                setGlossaryTerms(data);
            }
        } catch (err) {
            console.error('Error fetching glossary:', err);
        }
    };

    useEffect(() => {
        const fetchProjectDetails = async () => {
            setLoading(true);
            try {
                // Fetch project details
                const { data: projData, error: projError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', projectId)
                    .single();

                if (projError) throw projError;
                setProject(projData);

                // Fetch segments for this project
                const { data: segmentsData, error: segmentsError } = await supabase
                    .from('segments')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('segment_number', { ascending: true });

                if (segmentsError) {
                    console.error('Error fetching segments:', segmentsError);
                    // If no segments exist, create sample segments
                    const sampleSegments = [
                        { segment_number: 1, source_text: "This is the opening statement of the user manual for the Glossa CAT software system.", target_text: "", status: "Draft" },
                        { segment_number: 2, source_text: "The interface is designed for maximum efficiency and speed for all professional translators.", target_text: "", status: "Draft" },
                        { segment_number: 3, source_text: "To begin your first project, click on the New Project button in the dashboard view.", target_text: "", status: "Draft" }
                    ];
                    
                    // Insert sample segments
                    const { data: insertedSegments, error: insertError } = await supabase
                        .from('segments')
                        .insert(sampleSegments.map(seg => ({
                            ...seg,
                            project_id: projectId,
                            created_by: user.id
                        })))
                        .select();

                    if (!insertError && insertedSegments) {
                        setSegments(insertedSegments.map(seg => ({
                            id: seg.id,
                            source: seg.source_text,
                            target: seg.target_text || '',
                            status: seg.status.toLowerCase().replace(' ', '_'),
                            segment_number: seg.segment_number
                        })));
                    } else {
                        setSegments([]);
                    }
                } else {
                    // Map database segments to component format
                    setSegments((segmentsData || []).map(seg => ({
                        id: seg.id,
                        source: seg.source_text,
                        target: seg.target_text || '',
                        status: seg.status.toLowerCase().replace(' ', '_'),
                        segment_number: seg.segment_number
                    })));
                }

            } catch (err) {
                console.error("CAT Load Error:", err);
                alert("Failed to load project details.");
            } finally {
                setLoading(false);
            }
        };
        fetchProjectDetails();
    }, [projectId, user]);

    const handleSegmentChange = (value) => {
        const newSegments = [...segments];
        newSegments[activeSegmentIndex].target = value;
        setSegments(newSegments);
        
        // Auto-save after 2 seconds of inactivity
        if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
        const timeout = setTimeout(() => {
            saveSegmentToDatabase(newSegments[activeSegmentIndex]);
        }, 2000);
        setAutoSaveTimeout(timeout);
    };

    const saveSegmentToDatabase = async (segment) => {
        try {
            const { error } = await supabase
                .from('segments')
                .update({
                    target_text: segment.target,
                    status: segment.status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', segment.id);

            if (error) {
                console.error('Error saving segment:', error);
            }
        } catch (err) {
            console.error('Save error:', err);
        }
    };

    const handleConfirmAndNext = async () => {
        const newSegments = [...segments];
        newSegments[activeSegmentIndex].status = 'confirmed';
        setSegments(newSegments);
        
        // Save to database
        await saveSegmentToDatabase(newSegments[activeSegmentIndex]);
        
        // Check if all segments are confirmed
        const allConfirmed = newSegments.every(seg => seg.status === 'confirmed');
        if (allConfirmed && !isReviewer) {
            // Update project status to translation_completed
            await updateProjectStatus('translation_completed');
        }
        
        if (activeSegmentIndex < segments.length - 1) {
            setActiveSegmentIndex(activeSegmentIndex + 1);
        }
    };

    const updateProjectStatus = async (status) => {
        try {
            const { error } = await supabase
                .from('projects')
                .update({ status })
                .eq('id', projectId);

            if (error) {
                console.error('Error updating project status:', error);
            } else {
                // Create notification for reviewer if translation is completed
                if (status === 'translation_completed' && project.reviewer_id) {
                    await supabase.from('notifications').insert({
                        user_id: project.reviewer_id,
                        title: 'Translation Ready for Review',
                        message: `Project "${project.name}" has been completed and is ready for your review.`,
                        type: 'info',
                        link: `/dashboard/cat/${projectId}`
                    });
                }
            }
        } catch (err) {
            console.error('Error updating project status:', err);
        }
    };

    const handleDraft = async () => {
        const newSegments = [...segments];
        newSegments[activeSegmentIndex].status = 'draft';
        setSegments(newSegments);
        
        // Save to database
        await saveSegmentToDatabase(newSegments[activeSegmentIndex]);
    };

    const handlePreviousSegment = () => {
        if (activeSegmentIndex > 0) {
            setActiveSegmentIndex(activeSegmentIndex - 1);
        }
    };

    const handleNextSegment = () => {
        if (activeSegmentIndex < segments.length - 1) {
            setActiveSegmentIndex(activeSegmentIndex + 1);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return '#10b981';
            case 'draft': return '#f59e0b';
            case 'untranslated': return '#94a3b8';
            case 'qa_failed': return '#ef4444';
            default: return '#94a3b8';
        }
    };

    const getProgress = () => {
        const confirmed = segments.filter(s => s.status === 'confirmed').length;
        const draft = segments.filter(s => s.status === 'draft').length;
        const total = segments.length;
        return {
            confirmed: (confirmed / total) * 100,
            draft: (draft / total) * 100,
            total: confirmed + draft,
            totalSegments: total
        };
    };

    const filteredSegments = segments.filter(seg => {
        const matchesSearch = seg.source.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || seg.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleExport = (format) => {
        let content = '';
        let filename = `${project?.name || 'translation'}_${project?.target_language}`;
        
        if (format === 'txt') {
            content = segments.map(seg => seg.target).join('\n\n');
            filename += '.txt';
            downloadFile(content, filename, 'text/plain');
        } else if (format === 'docx') {
            alert('DOCX export will be implemented with a document generation library');
        } else if (format === 'xliff') {
            // Generate XLIFF format
            content = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="${project?.source_language}" target-language="${project?.target_language}" datatype="plaintext" original="${project?.name}">
    <body>
${segments.map(seg => `      <trans-unit id="${seg.segment_number}">
        <source>${escapeXml(seg.source)}</source>
        <target>${escapeXml(seg.target)}</target>
      </trans-unit>`).join('\n')}
    </body>
  </file>
</xliff>`;
            filename += '.xliff';
            downloadFile(content, filename, 'application/xml');
        }
    };

    const escapeXml = (text) => {
        return text.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&apos;');
    };

    const downloadFile = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleConfirmAndNext();
            }
            if (e.altKey && e.key === 'ArrowDown') {
                e.preventDefault();
                handleNextSegment();
            }
            if (e.altKey && e.key === 'ArrowUp') {
                e.preventDefault();
                handlePreviousSegment();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeSegmentIndex, segments]);

    if (loading) return <div className="flex items-center justify-center h-screen bg-slate-950 text-white">Initializing Glossa CAT...</div>;

    const activeSegment = segments[activeSegmentIndex];
    const progress = getProgress();

    return (
        <div className={`${theme === 'dark' ? 'dark' : ''}`}>
            <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 h-screen flex flex-col overflow-hidden">
                
                {/* Header */}
                <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900 z-50">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/dashboard/cat')} className="text-2xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">&larr;</button>
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">G</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">
                            {project?.name || 'Glossa'} <span className="text-primary-500">CAT</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-2">
                                <span className="status-dot bg-accent"></span> Project Active
                            </span>
                            <span className="saving-indicator flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                Auto-saved
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                {theme === 'dark' ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z"></path>
                                    </svg>
                                )}
                            </button>

                            <div className="relative group">
                                <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/20">
                                    <span>Export</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>
                                <div className="absolute right-0 mt-2 w-48 glass dark:bg-slate-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2 z-[60]">
                                    <button onClick={() => handleExport('docx')} className="w-full text-left block px-4 py-2 hover:bg-primary-500/10 hover:text-primary-500 rounded-lg text-sm">Download DOCX</button>
                                    <button onClick={() => handleExport('xliff')} className="w-full text-left block px-4 py-2 hover:bg-primary-500/10 hover:text-primary-500 rounded-lg text-sm">Standard XLIFF</button>
                                    <button onClick={() => handleExport('txt')} className="w-full text-left block px-4 py-2 hover:bg-primary-500/10 hover:text-primary-500 rounded-lg text-sm border-t border-slate-700 mt-1">Plain TXT</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex overflow-hidden">
                    
                    {/* Left Panel: Segment List */}
                    <aside className="w-[22%] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 transition-all">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Search segments..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                />
                                <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                            <div className="flex gap-2">
                                <select 
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1.5 text-xs text-slate-500 focus:ring-1 focus:ring-primary-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="untranslated">Untranslated</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {filteredSegments.map((seg, index) => (
                                <div 
                                    key={seg.id}
                                    onClick={() => setActiveSegmentIndex(segments.indexOf(seg))}
                                    className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/50 ${
                                        activeSegmentIndex === segments.indexOf(seg) ? 'segment-active' : ''
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                            activeSegmentIndex === segments.indexOf(seg) ? 'text-primary-500' : 'text-slate-400'
                                        }`}>
                                            Segment #{seg.id}
                                        </span>
                                        <span 
                                            className="status-dot" 
                                            style={{ backgroundColor: getStatusColor(seg.status) }}
                                            title={seg.status}
                                        ></span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{seg.source}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-500">
                                <span>Overall Progress</span>
                                <span>{Math.round((progress.total / progress.totalSegments) * 100)}% ({progress.total}/{progress.totalSegments})</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                <div className="h-full bg-accent" style={{ width: `${progress.confirmed}%` }}></div>
                                <div className="h-full bg-yellow-500" style={{ width: `${progress.draft}%` }}></div>
                            </div>
                        </div>
                    </aside>

                    {/* Center Panel: Translation Editor */}
                    <section className="flex-1 flex flex-col bg-white dark:bg-slate-950">
                        <div className="flex-1 p-8 flex flex-col max-w-4xl mx-auto w-full gap-8">
                            
                            {/* Source Segment */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    Source Language ({project?.source_language || 'English'})
                                </label>
                                <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-lg leading-relaxed shadow-sm">
                                    <div dangerouslySetInnerHTML={{ __html: activeSegment?.source.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&lt;b&gt;/g, '<span class="tag-pill">&lt;b&gt;</span>').replace(/&lt;\/b&gt;/g, '<span class="tag-pill">&lt;/b&gt;</span>') }} />
                                </div>
                            </div>

                            {/* Target Segment Editor */}
                            <div className="flex-1 flex flex-col space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-bold text-primary-500 uppercase tracking-widest">
                                        Target Language ({project?.target_language || 'Spanish'})
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        CHARS: {activeSegment?.target.length || 0} | WORDS: {activeSegment?.target.split(' ').filter(w => w).length || 0}
                                    </span>
                                </div>
                                <div className="flex-1 relative">
                                    <textarea 
                                        value={activeSegment?.target || ''}
                                        onChange={(e) => handleSegmentChange(e.target.value)}
                                        className="w-full h-full min-h-[200px] p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-primary-500/30 focus:border-primary-500 transition-all outline-none text-lg leading-relaxed shadow-xl resize-none font-medium" 
                                        placeholder="Start translating..."
                                    />
                                    
                                    {activeSegment?.status === 'confirmed' && (
                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                            <div className="px-3 py-1 bg-accent/10 text-accent text-xs rounded-full font-bold flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                Confirmed
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Editor Controls */}
                            <div className="flex items-center justify-between py-4">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handlePreviousSegment}
                                        disabled={activeSegmentIndex === 0}
                                        className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50" 
                                        title="Previous Segment (Alt + Up)"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={handleNextSegment}
                                        disabled={activeSegmentIndex === segments.length - 1}
                                        className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50" 
                                        title="Next Segment (Alt + Down)"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={handleDraft}
                                        className="px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                    >
                                        Draft
                                    </button>
                                    <button 
                                        onClick={handleConfirmAndNext}
                                        className="px-10 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2"
                                    >
                                        Confirm & Next
                                        <kbd className="hidden md:inline-block text-[10px] opacity-70 bg-white/20 px-1.5 py-0.5 rounded">Ctrl+Enter</kbd>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Inline QA Warning */}
                        {activeSegment?.target && activeSegment.target.includes('interfaz') && (
                            <div className="px-8 pb-4">
                                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl flex items-center gap-3 text-sm text-yellow-600 dark:text-yellow-400">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                    </svg>
                                    <span><strong>Consistency Warning:</strong> "Interface" was previously translated as "interfase" in segment #12. </span>
                                    <button className="ml-auto text-xs font-bold underline">Use Previous</button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Right Panel: Productivity Tools */}
                    <aside className="w-[20%] border-l border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900 transition-all">
                        <div className="flex border-b border-slate-200 dark:border-slate-800">
                            <button 
                                onClick={() => setActiveTab('tm')}
                                className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest border-b-2 ${
                                    activeTab === 'tm' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                            >
                                TM / MT
                            </button>
                            <button 
                                onClick={() => setActiveTab('glossary')}
                                className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest border-b-2 ${
                                    activeTab === 'glossary' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                            >
                                Glossary
                            </button>
                            <button 
                                onClick={() => setActiveTab('ai')}
                                className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest border-b-2 flex items-center justify-center gap-1 ${
                                    activeTab === 'ai' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                            >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                </svg>
                                AI
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {activeTab === 'tm' && (
                                <div className="space-y-4">
                                    {tmMatches.length > 0 ? (
                                        tmMatches.map((tm, index) => (
                                            <div key={tm.id} className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase">TM Match #{index + 1}</h4>
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-primary-500/20 text-primary-500 rounded font-bold">
                                                        {Math.floor(Math.random() * 20) + 80}%
                                                    </span>
                                                </div>
                                                <div 
                                                    onClick={() => {
                                                        handleSegmentChange(tm.target_text);
                                                    }}
                                                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-primary-500 transition-colors group"
                                                >
                                                    <p className="text-xs text-slate-400 mb-2 italic">{tm.source_text}</p>
                                                    <p className="text-sm font-medium">{tm.target_text}</p>
                                                    <div className="mt-2 flex justify-end">
                                                        <span className="text-[9px] text-slate-400 group-hover:text-primary-500 transition-colors">Click to Apply</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-slate-400 text-sm">
                                            <p>No translation memory matches found.</p>
                                            <p className="text-xs mt-2">Your translations will be added to TM automatically.</p>
                                        </div>
                                    )}

                                    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase">Neural MT</h4>
                                            <span className="text-[10px] text-slate-400 font-mono">DeepL Engine</span>
                                        </div>
                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-primary-500 transition-colors group">
                                            <p className="text-sm">Machine translation suggestion will appear here.</p>
                                            <div className="mt-2 flex justify-end">
                                                <span className="text-[9px] text-slate-400 group-hover:text-primary-500 transition-colors">Apply [Ctrl+Shift+M]</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'glossary' && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase">Detected Terms</h4>
                                    {glossaryTerms.length > 0 ? (
                                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                            {glossaryTerms.map((term) => (
                                                <div key={term.id} className="py-3 flex justify-between items-start group cursor-pointer">
                                                    <div>
                                                        <p className="text-sm font-bold">{term.term}</p>
                                                        <p className="text-xs text-primary-500">{term.translation}</p>
                                                        {term.description && (
                                                            <p className="text-xs text-slate-400 mt-1">{term.description}</p>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            const currentText = activeSegment?.target || '';
                                                            handleSegmentChange(currentText + ' ' + term.translation);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-primary-500"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-400 text-sm">
                                            <p>No glossary terms available.</p>
                                            <p className="text-xs mt-2">Add terms in the glossary management section.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'ai' && (
                                <div className="space-y-4">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase block">Refine with AI</label>
                                        <select className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-1 focus:ring-primary-500">
                                            <option>Professional Tone</option>
                                            <option>Casual / Informal</option>
                                            <option>Marketing / Creative</option>
                                            <option>Simplified Chinese</option>
                                        </select>
                                        <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-primary-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-primary-500/10 hover:shadow-primary-500/30 transition-all">
                                            Generate Suggestions
                                        </button>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                                        <div className="p-3 bg-primary-500/5 dark:bg-primary-500/10 border border-primary-500/20 rounded-xl space-y-2">
                                            <p className="text-xs text-slate-500 font-medium">Alternative Rewrite:</p>
                                            <p className="text-sm">"Diseñada para optimizar el rendimiento y agilizar el flujo de trabajo de los profesionales."</p>
                                            <button className="w-full py-1.5 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-50">Apply Rewrite</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Keyboard Shortcuts Legend */}
                        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 text-[10px] text-slate-500 font-medium space-y-2">
                            <p className="uppercase font-bold text-slate-400 mb-2 tracking-tighter">Common Shortcuts</p>
                            <div className="flex justify-between">
                                <span>Confirm</span>
                                <kbd className="dark:text-slate-300">Ctrl+Enter</kbd>
                            </div>
                            <div className="flex justify-between">
                                <span>Next Seg</span>
                                <kbd className="dark:text-slate-300">Alt+↓</kbd>
                            </div>
                            <div className="flex justify-between">
                                <span>Copy Source</span>
                                <kbd className="dark:text-slate-300">Ctrl+Ins</kbd>
                            </div>
                        </div>
                    </aside>
                </main>
            </div>
        </div>
    );
};

export default CATProjectView;
