import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import PermissionService, { PERMISSIONS } from '../services/permissionService';

const ProjectAssignment = ({ project, onUpdate }) => {
    const { user } = useAuth();
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [assignments, setAssignments] = useState({
        translator_id: project?.translator_id || '',
        reviewer_id: project?.reviewer_id || ''
    });

    // Check permissions
    const canAssignProjects = PermissionService.hasPermission(user, PERMISSIONS.ASSIGN_PROJECTS);

    useEffect(() => {
        if (canAssignProjects) {
            fetchAvailableUsers();
        }
    }, [canAssignProjects]);

    const fetchAvailableUsers = async () => {
        try {
            const { data: users, error } = await supabase
                .from('profiles')
                .select('id, full_name, user_type, language_pairs, availability')
                .in('user_type', ['Freelance Translator', 'Translator', 'Reviewer'])
                .order('full_name');

            if (error) throw error;
            setAvailableUsers(users || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleAssignmentChange = (role, userId) => {
        setAssignments({ ...assignments, [role]: userId });
    };

    const handleSaveAssignments = async () => {
        if (!project) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('projects')
                .update({
                    translator_id: assignments.translator_id || null,
                    reviewer_id: assignments.reviewer_id || null
                })
                .eq('id', project.id);

            if (error) throw error;

            // Create notifications for assigned users
            const notifications = [];
            
            if (assignments.translator_id && assignments.translator_id !== project.translator_id) {
                notifications.push({
                    user_id: assignments.translator_id,
                    title: 'New Project Assignment',
                    message: `You have been assigned as translator for project "${project.name}"`,
                    type: 'info',
                    link: `/dashboard/cat/${project.id}`
                });
            }

            if (assignments.reviewer_id && assignments.reviewer_id !== project.reviewer_id) {
                notifications.push({
                    user_id: assignments.reviewer_id,
                    title: 'New Review Assignment',
                    message: `You have been assigned as reviewer for project "${project.name}"`,
                    type: 'info',
                    link: `/dashboard/cat/${project.id}`
                });
            }

            if (notifications.length > 0) {
                await supabase.from('notifications').insert(notifications);
            }

            alert('Project assignments updated successfully!');
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('Error updating assignments:', err);
            alert('Error updating assignments');
        } finally {
            setLoading(false);
        }
    };

    const getMatchingUsers = (role) => {
        if (role === 'translator_id') {
            return availableUsers.filter(user => 
                user.user_type === 'Freelance Translator' || user.user_type === 'Translator'
            );
        } else if (role === 'reviewer_id') {
            return availableUsers.filter(user => user.user_type === 'Reviewer');
        }
        return [];
    };

    const getUserLanguageMatch = (user) => {
        if (!project || !user.language_pairs) return false;
        
        const projectPair = `${project.source_language} → ${project.target_language}`;
        return user.language_pairs.some(pair => 
            pair.includes(project.source_language) && pair.includes(project.target_language)
        );
    };

    if (!canAssignProjects) {
        return (
            <div style={{ 
                padding: '1rem', 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                borderRadius: '8px',
                color: '#f87171'
            }}>
                You don't have permission to assign projects.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>Project Assignment</h3>
                <button
                    onClick={handleSaveAssignments}
                    disabled={loading}
                    style={{
                        padding: '8px 16px',
                        background: loading ? '#666' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Saving...' : 'Save Assignments'}
                </button>
            </div>

            {/* Translator Assignment */}
            <div>
                <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.9rem', 
                    fontWeight: '600', 
                    color: '#ccc' 
                }}>
                    Translator
                </label>
                <select
                    value={assignments.translator_id}
                    onChange={(e) => handleAssignmentChange('translator_id', e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.9rem'
                    }}
                >
                    <option value="">Select Translator</option>
                    {getMatchingUsers('translator_id').map(user => (
                        <option key={user.id} value={user.id}>
                            {user.full_name} 
                            {getUserLanguageMatch(user) ? ' ✓' : ' (No language match)'}
                            {user.availability ? ` - ${user.availability}h/week` : ''}
                        </option>
                    ))}
                </select>
                
                {assignments.translator_id && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
                        {(() => {
                            const selectedUser = availableUsers.find(u => u.id === assignments.translator_id);
                            if (!selectedUser) return null;
                            
                            return (
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span>
                                        Languages: {selectedUser.language_pairs?.join(', ') || 'Not specified'}
                                    </span>
                                    {getUserLanguageMatch(selectedUser) && (
                                        <span style={{ color: '#10b981', fontWeight: '600' }}>✓ Language Match</span>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Reviewer Assignment */}
            <div>
                <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.9rem', 
                    fontWeight: '600', 
                    color: '#ccc' 
                }}>
                    Reviewer
                </label>
                <select
                    value={assignments.reviewer_id}
                    onChange={(e) => handleAssignmentChange('reviewer_id', e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.9rem'
                    }}
                >
                    <option value="">Select Reviewer</option>
                    {getMatchingUsers('reviewer_id').map(user => (
                        <option key={user.id} value={user.id}>
                            {user.full_name}
                            {getUserLanguageMatch(user) ? ' ✓' : ' (No language match)'}
                            {user.availability ? ` - ${user.availability}h/week` : ''}
                        </option>
                    ))}
                </select>
                
                {assignments.reviewer_id && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
                        {(() => {
                            const selectedUser = availableUsers.find(u => u.id === assignments.reviewer_id);
                            if (!selectedUser) return null;
                            
                            return (
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span>
                                        Languages: {selectedUser.language_pairs?.join(', ') || 'Not specified'}
                                    </span>
                                    {getUserLanguageMatch(selectedUser) && (
                                        <span style={{ color: '#10b981', fontWeight: '600' }}>✓ Language Match</span>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Assignment Summary */}
            <div style={{
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px'
            }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#60a5fa', fontSize: '0.9rem' }}>
                    Assignment Summary
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>
                    <div>Project: {project?.name}</div>
                    <div>Languages: {project?.source_language} → {project?.target_language}</div>
                    <div>
                        Translator: {
                            assignments.translator_id 
                                ? availableUsers.find(u => u.id === assignments.translator_id)?.full_name || 'Unknown'
                                : 'Not assigned'
                        }
                    </div>
                    <div>
                        Reviewer: {
                            assignments.reviewer_id 
                                ? availableUsers.find(u => u.id === assignments.reviewer_id)?.full_name || 'Unknown'
                                : 'Not assigned'
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectAssignment;