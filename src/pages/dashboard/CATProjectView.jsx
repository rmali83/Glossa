import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { translateText, generateAISuggestions, checkTranslationQuality } from '../../services/aiTranslation';
import SimpleUploadModal from '../../components/SimpleUploadModal';
import simpleUploadManager from '../../services/simpleUploadManager';
import { getTextDirection, getTextAlign, isRTL } from '../../data/languageDirections';
import { translationDomains, getDomainNames, getSubdomains, getDomainIcon } from '../../data/translationDomains';
import { runQAChecks, getQASummary, autoFixIssues, getSeverityIcon, getSeverityColor } from '../../services/qaEngine';
import QAPanel from '../../components/QAPanel';
import './CATProjectWorkspace.css';

/**
 * Highlights placeholders and special codes in text that should not be translated
 * Supports: {0}, {name}, {{var}}, %s, %d, %1$s, <tags>, [0], $var, ${var}, etc.
 */
const highlightPlaceholders = (text) => {
    if (!text) return '';
    
    // Escape HTML to prevent XSS
    const escapeHtml = (str) => {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    };
    
    let result = escapeHtml(text);
    
    // Define placeholder patterns with their colors
    const patterns = [
        // Curly braces: {0}, {name}, {variable_name}
        { regex: /\{[a-zA-Z0-9_]+\}/g, color: '#a855f7', label: 'Variable' },
        
        // Double curly braces: {{variable}}, {{user.name}}
        { regex: /\{\{[a-zA-Z0-9_.]+\}\}/g, color: '#8b5cf6', label: 'Template' },
        
        // Percent formats: %s, %d, %f, %1$s, %2$d
        { regex: /%(?:\d+\$)?[sdfioxXeEgGcpn]/g, color: '#3b82f6', label: 'Format' },
        
        // HTML/XML tags: <b>, </b>, <span class="x">, <br/>, <img src="..."/>
        { regex: /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s+[a-zA-Z][a-zA-Z0-9-]*(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?>/g, color: '#10b981', label: 'Tag' },
        
        // Square brackets: [0], [link], [variable]
        { regex: /\[[a-zA-Z0-9_]+\]/g, color: '#f59e0b', label: 'Placeholder' },
        
        // Dollar signs: $variable, ${var}, ${user.name}
        { regex: /\$\{[a-zA-Z0-9_.]+\}|\$[a-zA-Z_][a-zA-Z0-9_]*/g, color: '#ec4899', label: 'Variable' },
        
        // Angle brackets: <variable>, <0>
        { regex: /&lt;[a-zA-Z0-9_]+&gt;/g, color: '#06b6d4', label: 'Placeholder' },
        
        // Numbered placeholders: #1, #2, #name
        { regex: /#[a-zA-Z0-9_]+/g, color: '#84cc16', label: 'Ref' },
        
        // Colon placeholders: :variable, :name
        { regex: /:[a-zA-Z_][a-zA-Z0-9_]*/g, color: '#f97316', label: 'Symbol' }
    ];
    
    // Apply highlighting for each pattern
    patterns.forEach(({ regex, color, label }) => {
        result = result.replace(regex, (match) => {
            return `<span class="tag-pill" style="background-color: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; font-weight: 600; font-family: 'Courier New', monospace; white-space: nowrap; display: inline-block; margin: 0 2px;" title="${label}: Do not translate">${match}</span>`;
        });
    });
    
    return result;
};

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
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
    const [tmMatches, setTmMatches] = useState([]);
    const [glossaryTerms, setGlossaryTerms] = useState([]);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [isTranslating, setIsTranslating] = useState(false);
    const [selectedTone, setSelectedTone] = useState('professional');
    const [mtSuggestion, setMtSuggestion] = useState(null);
    
    // Annotation settings from project (admin-controlled)
    const [annotationSettings, setAnnotationSettings] = useState({
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

    // Annotation state
    const [annotation, setAnnotation] = useState({
        error_fluency: false,
        error_grammar: false,
        error_terminology: false,
        error_style: false,
        error_accuracy: false,
        // Severity levels for each error
        error_fluency_severity: '',
        error_grammar_severity: '',
        error_terminology_severity: '',
        error_style_severity: '',
        error_accuracy_severity: '',
        // Effort tracking
        translation_effort: '',
        post_editing_effort: '',
        // AI translation quality
        ai_translation_quality: null,
        ai_helpfulness: '',
        // Confidence score
        confidence_score: null,
        uncertain_about: [],
        // Existing fields
        domain: '',
        quality_rating: null,
        notes: ''
    });
    const [savingAnnotation, setSavingAnnotation] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState('');
    const [selectedSubdomain, setSelectedSubdomain] = useState('');

    // QA state
    const [qaIssues, setQaIssues] = useState([]);
    const [isRunningQA, setIsRunningQA] = useState(false);

    const userRole = user?.user_metadata?.user_type || 'Translator';
    const isReviewer = userRole === 'Reviewer';
    const isAdmin = userRole === 'Agencies' || user?.email === 'rmali@live.com';

    // Fetch TM and Glossary when active segment changes
    useEffect(() => {
        if (project && segments[activeSegmentIndex]) {
            fetchTranslationMemory();
            fetchGlossaryTerms();
            fetchMTSuggestion();
            fetchAnnotation();
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

    const fetchMTSuggestion = async () => {
        if (!project || !segments[activeSegmentIndex]) return;
        
        setIsTranslating(true);
        try {
            const result = await translateText(
                segments[activeSegmentIndex].source,
                project.source_language,
                project.target_language
            );
            
            if (result.success) {
                setMtSuggestion(result);
                
                // Store AI translation in segment for dataset capture
                const currentSegment = segments[activeSegmentIndex];
                if (!currentSegment.ai_translation) {
                    await supabase
                        .from('segments')
                        .update({ ai_translation: result.translation })
                        .eq('id', currentSegment.id);
                    
                    // Update local state
                    const newSegments = [...segments];
                    newSegments[activeSegmentIndex].ai_translation = result.translation;
                    setSegments(newSegments);
                }
            }
        } catch (err) {
            console.error('Error fetching MT:', err);
        } finally {
            setIsTranslating(false);
        }
    };

    const fetchAnnotation = async () => {
        if (!segments[activeSegmentIndex]) return;
        
        try {
            const { data, error } = await supabase
                .from('annotations')
                .select('*')
                .eq('segment_id', segments[activeSegmentIndex].id)
                .eq('annotator_id', user.id)
                .single();

            if (!error && data) {
                // Parse domain string "Domain: Subdomain"
                const domainParts = data.domain ? data.domain.split(': ') : ['', ''];
                const domain = domainParts[0] || '';
                const subdomain = domainParts[1] || '';
                
                setAnnotation({
                    error_fluency: data.error_fluency || false,
                    error_grammar: data.error_grammar || false,
                    error_terminology: data.error_terminology || false,
                    error_style: data.error_style || false,
                    error_accuracy: data.error_accuracy || false,
                    // Severity levels
                    error_fluency_severity: data.error_fluency_severity || '',
                    error_grammar_severity: data.error_grammar_severity || '',
                    error_terminology_severity: data.error_terminology_severity || '',
                    error_style_severity: data.error_style_severity || '',
                    error_accuracy_severity: data.error_accuracy_severity || '',
                    // Effort tracking
                    translation_effort: data.translation_effort || '',
                    post_editing_effort: data.post_editing_effort || '',
                    // AI quality
                    ai_translation_quality: data.ai_translation_quality || null,
                    ai_helpfulness: data.ai_helpfulness || '',
                    // Confidence
                    confidence_score: data.confidence_score || null,
                    uncertain_about: data.uncertain_about || [],
                    // Existing fields
                    domain: data.domain || '',
                    quality_rating: data.quality_rating || null,
                    notes: data.notes || ''
                });
                setSelectedDomain(domain);
                setSelectedSubdomain(subdomain);
            } else {
                // Reset annotation for new segment
                setAnnotation({
                    error_fluency: false,
                    error_grammar: false,
                    error_terminology: false,
                    error_style: false,
                    error_accuracy: false,
                    error_fluency_severity: '',
                    error_grammar_severity: '',
                    error_terminology_severity: '',
                    error_style_severity: '',
                    error_accuracy_severity: '',
                    translation_effort: '',
                    post_editing_effort: '',
                    ai_translation_quality: null,
                    ai_helpfulness: '',
                    confidence_score: null,
                    uncertain_about: [],
                    domain: '',
                    quality_rating: null,
                    notes: ''
                });
                setSelectedDomain('');
                setSelectedSubdomain('');
            }
        } catch (err) {
            console.error('Error fetching annotation:', err);
        }
    };


    const saveAnnotation = async () => {
        if (!segments[activeSegmentIndex]) return;
        
        setSavingAnnotation(true);
        try {
            const annotationData = {
                segment_id: segments[activeSegmentIndex].id,
                project_id: projectId,
                annotator_id: user.id,
                ...annotation
            };

            const { error } = await supabase
                .from('annotations')
                .upsert(annotationData, {
                    onConflict: 'segment_id,annotator_id'
                });

            if (error) {
                console.error('Error saving annotation:', error);
                alert('Failed to save annotation');
            } else {
                console.log('Annotation saved successfully');
                // Optionally show success message
            }
        } catch (err) {
            console.error('Save annotation error:', err);
            alert('Error saving annotation');
        } finally {
            setSavingAnnotation(false);
        }
    };
    // QA Functions
    const runQA = () => {
        if (!segments[activeSegmentIndex]) return;

        setIsRunningQA(true);
        try {
            const issues = runQAChecks(
                segments[activeSegmentIndex].source,
                segments[activeSegmentIndex].target,
                {
                    maxLength: 1000,
                    warnThreshold: 0.8
                }
            );
            setQaIssues(issues);
            console.log('QA check complete:', issues.length, 'issues found');
        } catch (err) {
            console.error('QA check error:', err);
        } finally {
            setIsRunningQA(false);
        }
    };

    const handleAutoFix = () => {
        if (!segments[activeSegmentIndex] || qaIssues.length === 0) return;

        const fixed = autoFixIssues(segments[activeSegmentIndex].target, qaIssues);
        handleSegmentChange(fixed);

        // Re-run QA after fix
        setTimeout(() => runQA(), 100);
    };

    // Run QA automatically when target changes
    useEffect(() => {
        if (segments[activeSegmentIndex]?.target) {
            const timer = setTimeout(() => {
                runQA();
            }, 1000); // Debounce 1 second

            return () => clearTimeout(timer);
        }
    }, [segments[activeSegmentIndex]?.target]);


    const handleGenerateAISuggestions = async () => {
        if (!project || !segments[activeSegmentIndex]) return;
        
        setIsTranslating(true);
        try {
            const result = await generateAISuggestions(
                segments[activeSegmentIndex].source,
                project.source_language,
                project.target_language,
                selectedTone
            );
            
            if (result.success) {
                setAiSuggestions(result.suggestions);
            } else {
                alert('Failed to generate AI suggestions: ' + result.error);
            }
        } catch (err) {
            console.error('Error generating AI suggestions:', err);
            alert('Error generating AI suggestions');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleApplyMT = () => {
        if (mtSuggestion && mtSuggestion.translation) {
            handleSegmentChange(mtSuggestion.translation);
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
                
                // Load annotation settings from project
                if (projData.annotation_settings) {
                    setAnnotationSettings(projData.annotation_settings);
                }

                // Fetch segments for this project
                await fetchSegments();

            } catch (err) {
                console.error("CAT Load Error:", err);
                alert("Failed to load project details.");
            } finally {
                setLoading(false);
            }
        };
        fetchProjectDetails();

        // Set up real-time subscription for segments
        const segmentsSubscription = supabase
            .channel(`segments-${projectId}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'segments',
                    filter: `project_id=eq.${projectId}`
                }, 
                (payload) => {
                    console.log('Segment change detected:', payload);
                    fetchSegments();
                }
            )
            .subscribe();

        // Set up real-time subscription for project updates
        const projectSubscription = supabase
            .channel(`project-${projectId}`)
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'projects',
                    filter: `id=eq.${projectId}`
                },
                (payload) => {
                    console.log('Project updated:', payload);
                    setProject(payload.new);
                }
            )
            .subscribe();

        // Cleanup subscriptions on unmount
        return () => {
            supabase.removeChannel(segmentsSubscription);
            supabase.removeChannel(projectSubscription);
        };
    }, [projectId, user]);

    const fetchSegments = async () => {
        try {
            console.log('Fetching segments for project:', projectId);
            console.log('Current user:', user?.id);
            
            const { data: segmentsData, error: segmentsError } = await supabase
                .from('segments')
                .select('*')
                .eq('project_id', projectId)
                .order('id', { ascending: true }); // Changed from segment_number to id

            console.log('Segments response:', { data: segmentsData, error: segmentsError });

            if (segmentsError) {
                console.error('Error fetching segments:', segmentsError);
                console.error('Error details:', JSON.stringify(segmentsError, null, 2));
                
                // Check if it's an auth error
                if (segmentsError.code === 'PGRST301' || segmentsError.message?.includes('JWT')) {
                    alert('Authentication error. Please log out and log back in.');
                    return;
                }
                
                setSegments([]);
                return;
            }

            if (!segmentsData || segmentsData.length === 0) {
                console.log('No segments found, creating sample segments...');
                
                // First, verify the project exists and user has access
                const { data: projectCheck, error: projectError } = await supabase
                    .from('projects')
                    .select('id, translator_id, reviewer_id, created_by')
                    .eq('id', projectId)
                    .single();
                
                console.log('Project check:', { project: projectCheck, error: projectError });
                
                if (projectError || !projectCheck) {
                    alert('Cannot access this project. You may not have permission.');
                    navigate('/dashboard/cat');
                    return;
                }
                
                // Create sample segments - removed segment_number field
                const sampleSegments = [
                    { source_text: "Welcome to this translation project. Please translate each segment carefully.", target_text: "", status: "Draft" },
                    { source_text: "The interface is designed for maximum efficiency and speed for all professional translators.", target_text: "", status: "Draft" },
                    { source_text: "To begin your first project, click on the New Project button in the dashboard view.", target_text: "", status: "Draft" },
                    { source_text: "Use the CAT tool features to improve your translation workflow and productivity.", target_text: "", status: "Draft" }
                ];
                
                console.log('Attempting to insert segments...');
                const { data: insertedSegments, error: insertError } = await supabase
                    .from('segments')
                    .insert(sampleSegments.map(seg => ({
                        ...seg,
                        project_id: projectId,
                        created_by: user.id
                    })))
                    .select();

                console.log('Insert result:', { data: insertedSegments, error: insertError });

                if (insertError) {
                    console.error('Failed to create sample segments:', insertError);
                    console.error('Insert error details:', JSON.stringify(insertError, null, 2));
                    alert(`Failed to create segments: ${insertError.message}`);
                    setSegments([]);
                } else if (insertedSegments) {
                    setSegments(insertedSegments.map((seg, index) => ({
                        id: seg.id,
                        source: seg.source_text,
                        target: seg.target_text || '',
                        status: seg.status.toLowerCase().replace(' ', '_'),
                        segment_number: index + 1, // Generate segment number from index
                        ai_translation: seg.ai_translation || null
                    })));
                }
            } else {
                // Map database segments to component format
                console.log('Mapping', segmentsData.length, 'segments to component format...');
                const mappedSegments = segmentsData.map((seg, index) => ({
                    id: seg.id,
                    source: seg.source_text,
                    target: seg.target_text || '',
                    status: seg.status.toLowerCase().replace(' ', '_'),
                    segment_number: index + 1, // Generate segment number from index
                    ai_translation: seg.ai_translation || null
                }));
                console.log('Mapped segments:', mappedSegments);
                setSegments(mappedSegments);
            }
        } catch (err) {
            console.error('Error in fetchSegments:', err);
            console.error('Error stack:', err.stack);
            setSegments([]);
        }
    };

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
            // 1. Update segment
            const { error } = await supabase
                .from('segments')
                .update({
                    target_text: segment.target,
                    status: segment.status.charAt(0).toUpperCase() + segment.status.slice(1).replace('_', ' '),
                    updated_at: new Date().toISOString()
                })
                .eq('id', segment.id);

            if (error) {
                console.error('Error saving segment:', error);
                return;
            }

            console.log('Segment saved successfully');

            // 2. Auto-capture dataset if AI translation exists and human edited it
            if (segment.ai_translation && segment.target && segment.target !== segment.ai_translation) {
                await captureDataset(segment);
            }
        } catch (err) {
            console.error('Save error:', err);
        }
    };

    const captureDataset = async (segment) => {
        console.log('🔍 Starting dataset capture for segment:', segment.id);
        console.log('📊 Segment data:', {
            hasAI: !!segment.ai_translation,
            hasTarget: !!segment.target,
            aiLength: segment.ai_translation?.length,
            targetLength: segment.target?.length
        });
        
        try {
            // Calculate edit distance (simple character difference for now)
            const editDistance = Math.abs(segment.target.length - segment.ai_translation.length);

            // 1. Log to post_edits table
            console.log('📝 Logging to post_edits...');
            const { error: postEditError } = await supabase
                .from('post_edits')
                .upsert({
                    segment_id: segment.id,
                    project_id: projectId,
                    ai_translation: segment.ai_translation,
                    human_translation: segment.target,
                    edit_distance: editDistance,
                    editor_id: user.id,
                    created_at: new Date().toISOString()
                }, {
                    onConflict: 'segment_id'
                });

            if (postEditError) {
                console.error('❌ Error logging post-edit:', postEditError);
            } else {
                console.log('✅ Post-edit logged successfully');
            }

            // 2. Fetch annotation data if exists
            console.log('🔍 Fetching annotation data...');
            const { data: annotationData, error: annotationError } = await supabase
                .from('annotations')
                .select('*')
                .eq('segment_id', segment.id)
                .eq('annotator_id', user.id)
                .single();

            if (annotationError && annotationError.code !== 'PGRST116') {
                console.error('⚠️ Annotation fetch error:', annotationError);
            } else {
                console.log('✅ Annotation data:', annotationData);
            }

            // 3. Prepare error types array
            const errorTypes = [];
            if (annotationData) {
                if (annotationData.error_fluency) errorTypes.push('fluency');
                if (annotationData.error_grammar) errorTypes.push('grammar');
                if (annotationData.error_terminology) errorTypes.push('terminology');
                if (annotationData.error_style) errorTypes.push('style');
                if (annotationData.error_accuracy) errorTypes.push('accuracy');
            }
            console.log('🏷️ Error types:', errorTypes);

            // 4. Log to dataset_logs table
            console.log('💾 Logging to dataset_logs...');
            const datasetPayload = {
                segment_id: segment.id,
                project_id: projectId,
                source_text: segment.source,
                source_language: project.source_language,
                target_language: project.target_language,
                ai_translation: segment.ai_translation,
                human_translation: segment.target,
                has_errors: errorTypes.length > 0,
                error_types: errorTypes,
                domain: annotationData?.domain || null,
                quality_rating: annotationData?.quality_rating || null,
                annotation_notes: annotationData?.notes || null,
                edit_distance: editDistance,
                translator_id: user.id,
                annotator_id: annotationData ? user.id : null,
                created_at: new Date().toISOString(),
                exported: false
            };
            console.log('📦 Dataset payload:', datasetPayload);
            
            const { error: datasetError } = await supabase
                .from('dataset_logs')
                .upsert(datasetPayload, {
                    onConflict: 'segment_id'
                });

            if (datasetError) {
                console.error('❌ Error logging to dataset:', datasetError);
            } else {
                console.log('✅ Dataset captured successfully!');
            }
        } catch (err) {
            console.error('💥 Dataset capture error:', err);
        }
    };

    const handleConfirmAndNext = async () => {
        // Check for QA errors before confirming
        const errorCount = qaIssues.filter(i => i.severity === 'error').length;
        
        if (errorCount > 0) {
            const confirmed = window.confirm(
                `⚠️ This segment has ${errorCount} QA error(s).\n\n` +
                `Errors:\n${qaIssues.filter(i => i.severity === 'error').map(i => `• ${i.message}`).join('\n')}\n\n` +
                `Do you want to confirm anyway?`
            );
            
            if (!confirmed) {
                // Switch to QA tab to show issues
                setActiveTab('qa');
                return;
            }
        }
        
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
        
        // Calculate actual word counts from segments
        const totalWords = segments.reduce((sum, seg) => {
            const wordCount = seg.source.trim().split(/\s+/).filter(w => w.length > 0).length;
            return sum + wordCount;
        }, 0);
        
        const completedWords = segments
            .filter(s => s.status === 'confirmed')
            .reduce((sum, seg) => {
                const wordCount = seg.source.trim().split(/\s+/).filter(w => w.length > 0).length;
                return sum + wordCount;
            }, 0);
        
        const draftWords = segments
            .filter(s => s.status === 'draft')
            .reduce((sum, seg) => {
                const wordCount = seg.source.trim().split(/\s+/).filter(w => w.length > 0).length;
                return sum + wordCount;
            }, 0);
        
        return {
            confirmed: (confirmed / total) * 100,
            draft: (draft / total) * 100,
            total: confirmed + draft,
            totalSegments: total,
            totalWords,
            completedWords,
            draftWords
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

    // Upload handlers
    const fetchUploadedFiles = async () => {
        const result = await simpleUploadManager.getProjectFiles(projectId);
        if (result.success) {
            setUploadedFiles(result.files);
        }
    };

    const handleOpenUploadModal = () => {
        setShowUploadModal(true);
    };

    const handleCloseUploadModal = () => {
        setShowUploadModal(false);
    };

    const handleUploadComplete = async () => {
        console.log('Upload completed, refreshing data...');
        
        // Close the modal first
        setShowUploadModal(false);
        
        // Refresh uploaded files list
        await fetchUploadedFiles();
        
        // Force refresh segments from database
        console.log('Forcing segment refresh...');
        try {
            const { data: segmentsData, error: segmentsError } = await supabase
                .from('segments')
                .select('*')
                .eq('project_id', projectId)
                .order('id', { ascending: true });

            if (segmentsError) {
                console.error('Error fetching segments:', segmentsError);
            } else if (segmentsData) {
                console.log('Fetched segments:', segmentsData.length);
                const mappedSegments = segmentsData.map((seg, index) => ({
                    id: seg.id,
                    source: seg.source_text,
                    target: seg.target_text || '',
                    status: seg.status.toLowerCase().replace(' ', '_'),
                    segment_number: index + 1,
                    ai_translation: seg.ai_translation || null
                }));
                setSegments(mappedSegments);
                console.log('Segments updated in UI');
            }
        } catch (err) {
            console.error('Error refreshing segments:', err);
        }
        
        console.log('Upload complete! Segments refreshed.');
    };

    // Fetch uploaded files on mount
    useEffect(() => {
        if (projectId) {
            fetchUploadedFiles();
        }
    }, [projectId]);

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

    if (!loading && segments.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950 text-white flex-col gap-4">
                <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h2 className="text-xl font-bold">No Segments Found</h2>
                <p className="text-slate-400">This project doesn't have any segments yet.</p>
                <button 
                    onClick={() => fetchSegments()}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all"
                >
                    Create Sample Segments
                </button>
                <button 
                    onClick={() => navigate('/dashboard/cat')}
                    className="px-6 py-3 border border-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold transition-all"
                >
                    Back to Projects
                </button>
            </div>
        );
    }

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

                    {/* Progress Bar - Center of Header */}
                    <div className="flex-1 max-w-md mx-8">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Overall Progress</span>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                {Math.round((progress.completedWords / progress.totalWords) * 100)}% ({progress.completedWords} / {progress.totalWords} words)
                            </span>
                        </div>
                        <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div className="h-full bg-accent transition-all duration-300" style={{ width: `${(progress.completedWords / progress.totalWords) * 100}%` }}></div>
                            <div className="h-full bg-yellow-500 transition-all duration-300" style={{ width: `${(progress.draftWords / progress.totalWords) * 100}%` }}></div>
                        </div>
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
                            <button 
                                onClick={() => fetchSegments()}
                                className="flex items-center gap-1 text-xs hover:text-primary-500 transition-colors"
                                title="Refresh segments"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                Sync
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* Upload Button - Only for Admins */}
                            {isAdmin && (
                                <button 
                                    onClick={handleOpenUploadModal}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-500/20"
                                    title="Upload files"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span>Upload</span>
                                </button>
                            )}

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

                {/* Tabs Navigation - Below Header */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2">
                    <div className="max-w-7xl mx-auto">
                        {/* Tool Tabs */}
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setActiveTab(activeTab === 'tm' ? null : 'tm')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                    activeTab === 'tm' 
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                                </svg>
                                TM
                            </button>
                            <button 
                                onClick={() => setActiveTab(activeTab === 'glossary' ? null : 'glossary')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                    activeTab === 'glossary' 
                                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                </svg>
                                Glossary
                            </button>
                            <button 
                                onClick={() => setActiveTab(activeTab === 'ai' ? null : 'ai')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                    activeTab === 'ai' 
                                        ? 'bg-gradient-to-r from-pink-600 to-pink-700 text-white shadow-md' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                </svg>
                                AI
                            </button>
                            <button 
                                onClick={() => setActiveTab(activeTab === 'annotation' ? null : 'annotation')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                    activeTab === 'annotation' 
                                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                                </svg>
                                Annotate
                            </button>
                            <button 
                                onClick={() => setActiveTab(activeTab === 'qa' ? null : 'qa')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                                    activeTab === 'qa' 
                                        ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-md' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                QA
                                {qaIssues.length > 0 && (
                                    <span style={{
                                        background: qaIssues.some(i => i.severity === 'error') ? '#ef4444' : '#f59e0b',
                                        color: '#fff',
                                        fontSize: '0.6rem',
                                        padding: '0.1rem 0.3rem',
                                        borderRadius: '9999px',
                                        fontWeight: 'bold',
                                        minWidth: '1rem',
                                        textAlign: 'center'
                                    }}>
                                        {qaIssues.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

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
                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2" 
                                       dir={getTextDirection(project?.source_language)}
                                       style={{ textAlign: getTextAlign(project?.source_language) }}>
                                        {seg.source}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Center Panel: Translation Editor */}
                    <section className="flex-1 flex flex-col bg-white dark:bg-slate-950">
                        <div className="flex-1 p-8 flex flex-col w-full gap-8">
                            
                            {/* Source Segment */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    Source Language ({project?.source_language || 'English'})
                                </label>
                                <div 
                                    className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-lg leading-relaxed shadow-sm"
                                    dir={getTextDirection(project?.source_language)}
                                    style={{ textAlign: getTextAlign(project?.source_language) }}
                                >
                                    {activeSegment?.source ? (
                                        <div dangerouslySetInnerHTML={{ 
                                            __html: highlightPlaceholders(activeSegment.source)
                                        }} />
                                    ) : (
                                        <div className="text-slate-400 italic">No source text available for this segment</div>
                                    )}
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
                                <div className="flex-1 flex flex-col space-y-3">
                                    <div className="relative">
                                        <textarea 
                                            value={activeSegment?.target || ''}
                                            onChange={(e) => handleSegmentChange(e.target.value)}
                                            className="w-full h-full min-h-[200px] p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-primary-500/30 focus:border-primary-500 transition-all outline-none text-lg leading-relaxed shadow-xl resize-none font-medium" 
                                            placeholder="Start translating..."
                                            dir={getTextDirection(project?.target_language)}
                                            style={{ textAlign: getTextAlign(project?.target_language) }}
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
                                    
                                    {/* QA Warning Badges - Below textarea */}
                                    {qaIssues.length > 0 && (
                                        <div style={{
                                            marginTop: '0.75rem',
                                            display: 'flex',
                                            gap: '0.5rem',
                                            flexWrap: 'wrap',
                                            alignItems: 'center'
                                        }}>
                                            {qaIssues.slice(0, 3).map((issue, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        position: 'relative',
                                                        cursor: 'pointer'
                                                    }}
                                                    className="qa-warning-badge"
                                                    title={`${issue.message}\n${issue.suggestion}`}
                                                >
                                                    <div style={{
                                                        padding: '0.5rem 0.75rem',
                                                        background: getSeverityColor(issue.severity) + '20',
                                                        border: `2px solid ${getSeverityColor(issue.severity)}`,
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        color: getSeverityColor(issue.severity),
                                                        boxShadow: `0 2px 8px ${getSeverityColor(issue.severity)}40`
                                                    }}>
                                                        <span style={{ fontSize: '1rem' }}>{getSeverityIcon(issue.severity)}</span>
                                                        <span>{issue.type.replace(/_/g, ' ')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {qaIssues.length > 3 && (
                                                <div style={{
                                                    padding: '0.5rem 0.75rem',
                                                    background: 'rgba(100, 116, 139, 0.2)',
                                                    border: '1px solid #64748b',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    color: '#94a3b8'
                                                }}>
                                                    +{qaIssues.length - 3} more issues
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setActiveTab('qa')}
                                                style={{
                                                    padding: '0.5rem 0.75rem',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}
                                            >
                                                View All
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Editor Controls */}
                            <div className="flex items-center justify-between py-2">
                                <div className="flex gap-1.5">
                                    <button 
                                        onClick={handlePreviousSegment}
                                        disabled={activeSegmentIndex === 0}
                                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50" 
                                        title="Previous Segment (Alt + Up)"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={handleNextSegment}
                                        disabled={activeSegmentIndex === segments.length - 1}
                                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50" 
                                        title="Next Segment (Alt + Down)"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={handleApplyMT}
                                        disabled={!mtSuggestion || isTranslating}
                                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[10px] transition-all disabled:opacity-50 flex items-center gap-1.5" 
                                        title="Apply AI Translation"
                                    >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                        </svg>
                                        AI Translate
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleDraft}
                                        className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                    >
                                        Draft
                                    </button>
                                    <button 
                                        onClick={handleConfirmAndNext}
                                        className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-[10px] shadow-lg shadow-primary-500/30 transition-all flex items-center gap-1.5"
                                    >
                                        Confirm & Next
                                        <kbd className="hidden md:inline-block text-[9px] opacity-70 bg-white/20 px-1 py-0.5 rounded">Ctrl+Enter</kbd>
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

                    {/* Slide-out Panel for Tools */}
                    {activeTab && (
                        <aside 
                            className="w-[400px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shadow-2xl animate-slide-in"
                            style={{
                                animation: 'slideIn 0.3s ease-out'
                            }}
                        >
                            {/* Panel Header */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    {activeTab === 'tm' && '📁 Translation Memory'}
                                    {activeTab === 'glossary' && '📚 Glossary'}
                                    {activeTab === 'ai' && '✨ AI Suggestions'}
                                    {activeTab === 'annotation' && '📝 Annotation'}
                                    {activeTab === 'qa' && '✓ Quality Assurance'}
                                </h3>
                                <button 
                                    onClick={() => setActiveTab(null)}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Close panel"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>

                            {/* Panel Content */}
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
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {mtSuggestion?.engine || 'MyMemory'}
                                                </span>
                                            </div>
                                            {isTranslating ? (
                                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    <p className="text-sm text-slate-400">Translating...</p>
                                                </div>
                                            ) : mtSuggestion ? (
                                                <div 
                                                    onClick={handleApplyMT}
                                                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-primary-500 transition-colors group"
                                                >
                                                    <p className="text-sm">{mtSuggestion.translation}</p>
                                                    <div className="mt-2 flex justify-end">
                                                        <span className="text-[9px] text-slate-400 group-hover:text-primary-500 transition-colors">Click to Apply</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    <p className="text-sm text-slate-400">No MT suggestion available</p>
                                                </div>
                                            )}
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
                                            <select 
                                                value={selectedTone}
                                                onChange={(e) => setSelectedTone(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-1 focus:ring-primary-500"
                                            >
                                                <option value="professional">Professional Tone</option>
                                                <option value="casual">Casual / Informal</option>
                                                <option value="formal">Formal / Academic</option>
                                                <option value="marketing">Marketing / Creative</option>
                                            </select>
                                            <button 
                                                onClick={handleGenerateAISuggestions}
                                                disabled={isTranslating}
                                                className="w-full py-2 bg-gradient-to-r from-purple-600 to-primary-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-primary-500/10 hover:shadow-primary-500/30 transition-all disabled:opacity-50"
                                            >
                                                {isTranslating ? 'Generating...' : 'Generate Suggestions'}
                                            </button>
                                        </div>

                                        {aiSuggestions.length > 0 && (
                                            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                                                {aiSuggestions.map((suggestion, index) => (
                                                    <div key={index} className="p-3 bg-primary-500/5 dark:bg-primary-500/10 border border-primary-500/20 rounded-xl space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-xs text-slate-500 font-medium">{suggestion.tone}:</p>
                                                            <span className="text-[9px] text-slate-400">{suggestion.description}</span>
                                                        </div>
                                                        <p className="text-sm">{suggestion.text}</p>
                                                        <button 
                                                            onClick={() => handleSegmentChange(suggestion.text)}
                                                            className="w-full py-1.5 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-50"
                                                        >
                                                            Apply This Version
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {aiSuggestions.length === 0 && !isTranslating && (
                                            <div className="text-center py-8 text-slate-400 text-sm">
                                                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                                </svg>
                                                <p>Click "Generate Suggestions" to get AI-powered alternatives</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'qa' && (
                                    <QAPanel 
                                        issues={qaIssues}
                                        onRunQA={runQA}
                                        onAutoFix={handleAutoFix}
                                        isRunning={isRunningQA}
                                    />
                                )}

                                {activeTab === 'annotation' && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase">Quality Annotation</h4>
                                        
                                        {/* Error Types with Severity */}
                                        {annotationSettings.error_types && (
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase block">Error Types{annotationSettings.error_severity && ' & Severity'}</label>
                                                <div className="space-y-2">
                                                    {[
                                                        { key: 'error_fluency', label: 'Fluency', icon: '💬', color: 'bg-blue-500' },
                                                        { key: 'error_grammar', label: 'Grammar', icon: '📝', color: 'bg-red-500' },
                                                        { key: 'error_terminology', label: 'Terminology', icon: '📚', color: 'bg-purple-500' },
                                                        { key: 'error_style', label: 'Style', icon: '🎨', color: 'bg-pink-500' },
                                                        { key: 'error_accuracy', label: 'Accuracy', icon: '🎯', color: 'bg-green-500' }
                                                    ].map(({ key, label, icon, color }) => (
                                                        <div key={key} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                            <label className="flex items-center gap-3 p-3 cursor-pointer hover:border-primary-500 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={annotation[key]}
                                                                    onChange={(e) => setAnnotation({ ...annotation, [key]: e.target.checked })}
                                                                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                                />
                                                                <span className="text-lg">{icon}</span>
                                                                <span className="text-sm font-medium flex-1">{label}</span>
                                                                {annotation[key] && (
                                                                    <span className={`w-2 h-2 rounded-full ${color}`}></span>
                                                                )}
                                                            </label>
                                                            {/* Severity selector - only show if error is checked AND severity feature is enabled */}
                                                            {annotationSettings.error_severity && annotation[key] && (
                                                                <div className="px-3 pb-3 flex gap-2">
                                                                    {['minor', 'major', 'critical'].map((severity) => (
                                                                        <button
                                                                            key={severity}
                                                                            onClick={() => setAnnotation({ ...annotation, [`${key}_severity`]: severity })}
                                                                            className={`flex-1 px-2 py-1 text-xs rounded transition-all ${
                                                                                annotation[`${key}_severity`] === severity
                                                                                    ? 'bg-primary-500 text-white font-bold'
                                                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                                                            }`}
                                                                        >
                                                                            {severity.charAt(0).toUpperCase() + severity.slice(1)}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Domain Classification */}
                                        {annotationSettings.domain_classification && (
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase block">Domain / Specialization</label>
                                                
                                                {/* Domain Dropdown */}
                                                <select
                                                    value={selectedDomain}
                                                    onChange={(e) => {
                                                        const domain = e.target.value;
                                                        setSelectedDomain(domain);
                                                        setSelectedSubdomain('');
                                                        setAnnotation({ ...annotation, domain: '' });
                                                    }}
                                                    className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-2 text-sm focus:ring-1 focus:ring-primary-500"
                                                    style={{ borderRadius: '12px' }}
                                                >
                                                    <option value="">Select Domain</option>
                                                    {getDomainNames().map((domain) => (
                                                        <option key={domain} value={domain}>
                                                            {getDomainIcon(domain)} {domain}
                                                        </option>
                                                    ))}
                                                </select>

                                                {/* Subdomain Dropdown */}
                                                {selectedDomain && (
                                                    <select
                                                        value={selectedSubdomain}
                                                        onChange={(e) => {
                                                            const subdomain = e.target.value;
                                                            setSelectedSubdomain(subdomain);
                                                            const fullDomain = subdomain ? `${selectedDomain}: ${subdomain}` : '';
                                                            setAnnotation({ ...annotation, domain: fullDomain });
                                                        }}
                                                        className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-2 text-sm focus:ring-1 focus:ring-primary-500"
                                                        style={{ borderRadius: '12px' }}
                                                    >
                                                        <option value="">Select Subdomain</option>
                                                        {getSubdomains(selectedDomain).map((subdomain) => (
                                                            <option key={subdomain} value={subdomain}>
                                                                {subdomain}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}

                                                {/* Display selected domain/subdomain */}
                                                {annotation.domain && (
                                                    <div className="p-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                            {getDomainIcon(selectedDomain)} {annotation.domain}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* NEW FEATURE 1: Effort Tracking */}
                                        {annotationSettings.translation_effort && (
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase block">⏱️ Translation Effort</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { value: 'easy', label: 'Easy', desc: '< 5 min', color: 'from-green-500 to-emerald-500' },
                                                        { value: 'medium', label: 'Medium', desc: '5-15 min', color: 'from-yellow-500 to-orange-500' },
                                                        { value: 'hard', label: 'Hard', desc: '15-30 min', color: 'from-orange-500 to-red-500' },
                                                        { value: 'very_hard', label: 'Very Hard', desc: '> 30 min', color: 'from-red-500 to-pink-500' }
                                                    ].map(({ value, label, desc, color }) => (
                                                        <button
                                                            key={value}
                                                            onClick={() => setAnnotation({ ...annotation, translation_effort: value })}
                                                            className={`p-2 rounded-lg border-2 transition-all text-left ${
                                                                annotation.translation_effort === value
                                                                    ? `bg-gradient-to-r ${color} text-white border-transparent font-bold`
                                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-500'
                                                            }`}
                                                        >
                                                            <div className="text-xs font-bold">{label}</div>
                                                            <div className="text-[10px] opacity-75">{desc}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* NEW FEATURE 2: Post-Editing Effort (only show if AI translation exists AND feature enabled) */}
                                        {annotationSettings.post_editing_effort && segments[activeSegmentIndex]?.ai_translation && (
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase block">🤖 Post-Editing Effort</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { value: 'no_editing', label: 'No Editing', icon: '✓' },
                                                        { value: 'light_editing', label: 'Light', icon: '✏️' },
                                                        { value: 'heavy_editing', label: 'Heavy', icon: '🔧' },
                                                        { value: 'complete_retranslation', label: 'Retranslated', icon: '🔄' }
                                                    ].map(({ value, label, icon }) => (
                                                        <button
                                                            key={value}
                                                            onClick={() => setAnnotation({ ...annotation, post_editing_effort: value })}
                                                            className={`p-2 rounded-lg border-2 transition-all ${
                                                                annotation.post_editing_effort === value
                                                                    ? 'bg-primary-500 text-white border-transparent font-bold'
                                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-500'
                                                            }`}
                                                        >
                                                            <div className="text-xs font-bold">{icon} {label}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* NEW FEATURE 3: AI Translation Quality (only show if AI translation exists AND feature enabled) */}
                                        {annotationSettings.ai_quality_rating && segments[activeSegmentIndex]?.ai_translation && (
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase block">🤖 AI Translation Quality</label>
                                                <div className="flex gap-2 justify-center">
                                                    {[1, 2, 3, 4, 5].map((rating) => (
                                                        <button
                                                            key={rating}
                                                            onClick={() => setAnnotation({ ...annotation, ai_translation_quality: rating })}
                                                            className={`w-10 h-10 rounded-lg border-2 transition-all ${
                                                                annotation.ai_translation_quality === rating
                                                                    ? 'border-blue-500 bg-blue-500/20 scale-110'
                                                                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-500'
                                                            }`}
                                                        >
                                                            <svg className={`w-6 h-6 mx-auto ${annotation.ai_translation_quality >= rating ? 'text-blue-500' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                                            </svg>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 px-1">
                                                    <span>Poor</span>
                                                    <span>Excellent</span>
                                                </div>
                                                
                                                {/* AI Helpfulness */}
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    {[
                                                        { value: 'very_helpful', label: 'Very Helpful', desc: 'Used as-is' },
                                                        { value: 'helpful', label: 'Helpful', desc: 'Minor edits' },
                                                        { value: 'somewhat_helpful', label: 'Somewhat', desc: 'Major edits' },
                                                        { value: 'not_helpful', label: 'Not Helpful', desc: 'Retranslated' }
                                                    ].map(({ value, label, desc }) => (
                                                        <button
                                                            key={value}
                                                            onClick={() => setAnnotation({ ...annotation, ai_helpfulness: value })}
                                                            className={`p-2 rounded-lg border transition-all text-left ${
                                                                annotation.ai_helpfulness === value
                                                                    ? 'bg-blue-500 text-white border-transparent font-bold'
                                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500'
                                                            }`}
                                                        >
                                                            <div className="text-xs font-bold">{label}</div>
                                                            <div className="text-[10px] opacity-75">{desc}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* NEW FEATURE 4: Confidence Score */}
                                        {annotationSettings.confidence_score && (
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase block">💪 Your Confidence</label>
                                            <div className="flex gap-2 justify-center">
                                                {[1, 2, 3, 4, 5].map((rating) => (
                                                    <button
                                                        key={rating}
                                                        onClick={() => setAnnotation({ ...annotation, confidence_score: rating })}
                                                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                                                            annotation.confidence_score === rating
                                                                ? 'border-purple-500 bg-purple-500/20 scale-110'
                                                                : 'border-slate-300 dark:border-slate-700 hover:border-purple-500'
                                                        }`}
                                                    >
                                                        <svg className={`w-6 h-6 mx-auto ${annotation.confidence_score >= rating ? 'text-purple-500' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                                        </svg>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex justify-between text-[10px] text-slate-400 px-1">
                                                <span>Uncertain</span>
                                                <span>Very Confident</span>
                                            </div>
                                            
                                            {/* Uncertainty Areas */}
                                            {annotation.confidence_score && annotation.confidence_score < 4 && (
                                                <div className="mt-2">
                                                    <label className="text-[10px] text-slate-500 uppercase block mb-2">Uncertain About:</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['terminology', 'grammar', 'cultural', 'technical'].map((area) => (
                                                            <label key={area} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-purple-500 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={annotation.uncertain_about.includes(area)}
                                                                    onChange={(e) => {
                                                                        const updated = e.target.checked
                                                                            ? [...annotation.uncertain_about, area]
                                                                            : annotation.uncertain_about.filter(a => a !== area);
                                                                        setAnnotation({ ...annotation, uncertain_about: updated });
                                                                    }}
                                                                    className="w-3 h-3 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                                                />
                                                                <span className="text-xs capitalize">{area}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            </div>
                                        )}

                                        {/* Quality Rating */}
                                        {annotationSettings.quality_rating && (
                                            <div className="space-y-3">
                                            <label className="text-xs font-bold text-slate-500 uppercase block">Quality Rating</label>
                                            <div className="flex gap-2 justify-center">
                                                {[1, 2, 3, 4, 5].map((rating) => (
                                                    <button
                                                        key={rating}
                                                        onClick={() => setAnnotation({ ...annotation, quality_rating: rating })}
                                                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                                                            annotation.quality_rating === rating
                                                                ? 'border-yellow-500 bg-yellow-500/20 scale-110'
                                                                : 'border-slate-300 dark:border-slate-700 hover:border-yellow-500'
                                                        }`}
                                                    >
                                                        <svg className={`w-6 h-6 mx-auto ${annotation.quality_rating >= rating ? 'text-yellow-500' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                                        </svg>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex justify-between text-[10px] text-slate-400 px-1">
                                                <span>Poor</span>
                                                <span>Excellent</span>
                                            </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {annotationSettings.notes && (
                                            <div className="space-y-3">
                                            <label className="text-xs font-bold text-slate-500 uppercase block">Notes</label>
                                            <textarea
                                                value={annotation.notes}
                                                onChange={(e) => setAnnotation({ ...annotation, notes: e.target.value })}
                                                placeholder="Add any additional comments..."
                                                className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-1 focus:ring-primary-500 resize-none"
                                                rows="3"
                                            />
                                            </div>
                                        )}

                                        {/* Save Button */}
                                        <button
                                            onClick={saveAnnotation}
                                            disabled={savingAnnotation}
                                            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {savingAnnotation ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                    Save Annotation
                                                </>
                                            )}
                                        </button>

                                        {/* Info Box */}
                                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                                💡 Enhanced annotations with effort tracking, AI quality rating, and confidence scoring help improve translation quality and train better AI models.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>
                    )}
                </main>

                {/* Upload Modal */}
                {showUploadModal && (
                    <SimpleUploadModal
                        projectId={projectId}
                        projectName={project?.name}
                        onClose={handleCloseUploadModal}
                        onUploadComplete={handleUploadComplete}
                    />
                )}
            </div>
        </div>
    );
};

export default CATProjectView;
