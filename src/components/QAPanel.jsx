import React from 'react';
import { getSeverityColor, getSeverityIcon } from '../services/qaEngine';

const QAPanel = ({ issues, onRunQA, onAutoFix, isRunning }) => {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;
    const autoFixableCount = issues.filter(i => i.autoFixable).length;

    // Group issues by category
    const groupedIssues = issues.reduce((acc, issue) => {
        if (!acc[issue.category]) {
            acc[issue.category] = [];
        }
        acc[issue.category].push(issue);
        return acc;
    }, {});

    return (
        <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Quality Assurance
                </h4>
                
                {/* Summary */}
                <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {errorCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ color: '#ef4444', fontSize: '1rem' }}>❌</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#ef4444' }}>{errorCount}</span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>errors</span>
                        </div>
                    )}
                    {warningCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ color: '#f59e0b', fontSize: '1rem' }}>⚠️</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#f59e0b' }}>{warningCount}</span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>warnings</span>
                        </div>
                    )}
                    {infoCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ color: '#3b82f6', fontSize: '1rem' }}>ℹ️</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#3b82f6' }}>{infoCount}</span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>info</span>
                        </div>
                    )}
                    {issues.length === 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ color: '#10b981', fontSize: '1rem' }}>✓</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#10b981' }}>No issues</span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={onRunQA}
                        disabled={isRunning}
                        style={{
                            flex: 1,
                            padding: '0.5rem 1rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: isRunning ? 'not-allowed' : 'pointer',
                            opacity: isRunning ? 0.6 : 1
                        }}
                    >
                        {isRunning ? 'Running...' : 'Run QA Check'}
                    </button>
                    {autoFixableCount > 0 && (
                        <button
                            onClick={onAutoFix}
                            style={{
                                padding: '0.5rem 1rem',
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Fix {autoFixableCount}
                        </button>
                    )}
                </div>
            </div>

            {/* Issues List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {issues.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '2rem 1rem',
                        color: '#94a3b8',
                        fontSize: '0.875rem'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
                        <p>No quality issues detected</p>
                        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            Click "Run QA Check" to verify translation quality
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Object.entries(groupedIssues).map(([category, categoryIssues]) => (
                            <div key={category}>
                                <div style={{ 
                                    fontSize: '0.7rem', 
                                    fontWeight: 'bold', 
                                    textTransform: 'uppercase', 
                                    color: '#64748b',
                                    marginBottom: '0.5rem',
                                    letterSpacing: '0.05em'
                                }}>
                                    {category} ({categoryIssues.length})
                                </div>
                                {categoryIssues.map((issue, index) => (
                                    <div
                                        key={`${category}-${index}`}
                                        style={{
                                            padding: '0.75rem',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${getSeverityColor(issue.severity)}33`,
                                            borderLeft: `3px solid ${getSeverityColor(issue.severity)}`,
                                            borderRadius: '6px',
                                            marginBottom: '0.5rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                                                {getSeverityIcon(issue.severity)}
                                            </span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ 
                                                    fontSize: '0.875rem', 
                                                    fontWeight: '600',
                                                    color: getSeverityColor(issue.severity),
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    {issue.message}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '0.75rem', 
                                                    color: '#94a3b8',
                                                    marginBottom: '0.5rem'
                                                }}>
                                                    {issue.suggestion}
                                                </div>
                                                {issue.highlight && (
                                                    <div style={{
                                                        padding: '0.25rem 0.5rem',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        fontFamily: 'monospace',
                                                        color: '#e2e8f0',
                                                        display: 'inline-block'
                                                    }}>
                                                        {issue.highlight}
                                                    </div>
                                                )}
                                                {issue.autoFixable && (
                                                    <div style={{
                                                        marginTop: '0.5rem',
                                                        fontSize: '0.7rem',
                                                        color: '#10b981',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}>
                                                        <span>🔧</span>
                                                        <span>Auto-fixable</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Footer */}
            <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#93c5fd'
            }}>
                💡 QA checks run automatically when you save. Fix errors before confirming.
            </div>
        </div>
    );
};

export default QAPanel;
