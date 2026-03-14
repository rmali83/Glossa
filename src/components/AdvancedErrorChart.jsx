import React from 'react';

const AdvancedErrorChart = ({ data = [] }) => {
    try {
        // Count error types and severity
        const errorAnalysis = {
            fluency: { minor: 0, major: 0, critical: 0 },
            grammar: { minor: 0, major: 0, critical: 0 },
            terminology: { minor: 0, major: 0, critical: 0 },
            style: { minor: 0, major: 0, critical: 0 },
            accuracy: { minor: 0, major: 0, critical: 0 }
        };

        let totalErrors = 0;

        data.forEach(item => {
            if (item && typeof item === 'object') {
                // Count basic error types
                if (item.error_fluency) {
                    errorAnalysis.fluency.minor++;
                    totalErrors++;
                }
                if (item.error_grammar) {
                    errorAnalysis.grammar.minor++;
                    totalErrors++;
                }
                if (item.error_terminology) {
                    errorAnalysis.terminology.minor++;
                    totalErrors++;
                }
                if (item.error_style) {
                    errorAnalysis.style.minor++;
                    totalErrors++;
                }
                if (item.error_accuracy) {
                    errorAnalysis.accuracy.minor++;
                    totalErrors++;
                }

                // If severity data exists, redistribute
                if (item.error_severity) {
                    // This would be enhanced based on your actual severity data structure
                }
            }
        });

        const errorTypes = [
            { 
                name: 'Fluency', 
                key: 'fluency',
                total: errorAnalysis.fluency.minor + errorAnalysis.fluency.major + errorAnalysis.fluency.critical,
                color: '#3b82f6',
                icon: '🌊'
            },
            { 
                name: 'Grammar', 
                key: 'grammar',
                total: errorAnalysis.grammar.minor + errorAnalysis.grammar.major + errorAnalysis.grammar.critical,
                color: '#ef4444',
                icon: '📝'
            },
            { 
                name: 'Terminology', 
                key: 'terminology',
                total: errorAnalysis.terminology.minor + errorAnalysis.terminology.major + errorAnalysis.terminology.critical,
                color: '#8b5cf6',
                icon: '📚'
            },
            { 
                name: 'Style', 
                key: 'style',
                total: errorAnalysis.style.minor + errorAnalysis.style.major + errorAnalysis.style.critical,
                color: '#ec4899',
                icon: '🎨'
            },
            { 
                name: 'Accuracy', 
                key: 'accuracy',
                total: errorAnalysis.accuracy.minor + errorAnalysis.accuracy.major + errorAnalysis.accuracy.critical,
                color: '#10b981',
                icon: '🎯'
            }
        ];

        const maxCount = Math.max(...errorTypes.map(type => type.total), 1);

        // Calculate error rate over time (last 14 days)
        const errorTrendData = [];
        for (let i = 13; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayAnnotations = data.filter(a => {
                const createdAt = new Date(a.created_at);
                return createdAt >= dayStart && createdAt <= dayEnd;
            });

            const dayErrors = dayAnnotations.filter(a => 
                a.error_fluency || a.error_grammar || a.error_terminology || 
                a.error_style || a.error_accuracy
            ).length;

            const errorRate = dayAnnotations.length > 0 
                ? Math.round((dayErrors / dayAnnotations.length) * 100) 
                : 0;

            errorTrendData.push({
                date: dateStr,
                errorRate,
                totalAnnotations: dayAnnotations.length,
                totalErrors: dayErrors
            });
        }

        const maxErrorRate = Math.max(...errorTrendData.map(d => d.errorRate), 1);

        return (
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>🎯 Error Analysis</h3>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        {totalErrors} total errors from {data.length} annotations
                    </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    {totalErrors === 0 ? (
                        <div style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                            <p>No errors found - Excellent quality!</p>
                            <p style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
                                Error analysis will appear here when annotations contain error types
                            </p>
                        </div>
                    ) : (
                        <div>
                            {/* Error Type Distribution */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>
                                    Error Type Distribution
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {errorTypes.map((error, index) => (
                                        <div key={index} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '1rem'
                                        }}>
                                            <div style={{ 
                                                width: '100px', 
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontSize: '0.9rem', 
                                                color: '#fff'
                                            }}>
                                                <span>{error.icon}</span>
                                                <span>{error.name}</span>
                                            </div>
                                            <div style={{ 
                                                flex: 1, 
                                                height: '32px', 
                                                background: 'rgba(255,255,255,0.1)', 
                                                borderRadius: '16px', 
                                                overflow: 'hidden',
                                                position: 'relative'
                                            }}>
                                                <div 
                                                    style={{
                                                        width: maxCount > 0 ? `${(error.total / maxCount) * 100}%` : '0%',
                                                        height: '100%',
                                                        background: `linear-gradient(90deg, ${error.color}, ${error.color}aa)`,
                                                        borderRadius: '16px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#fff',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold',
                                                        minWidth: error.total > 0 ? '40px' : '0px',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    {error.total > 0 ? error.total : ''}
                                                </div>
                                            </div>
                                            <div style={{ 
                                                width: '60px', 
                                                fontSize: '0.9rem', 
                                                color: '#666',
                                                textAlign: 'right'
                                            }}>
                                                {totalErrors > 0 ? Math.round((error.total / totalErrors) * 100) : 0}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Error Rate Trend */}
                            <div>
                                <h4 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>
                                    Error Rate Trend (Last 14 Days)
                                </h4>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'end', 
                                    gap: '4px', 
                                    height: '100px',
                                    marginBottom: '1rem'
                                }}>
                                    {errorTrendData.map((item, index) => (
                                        <div key={index} style={{ 
                                            flex: 1, 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center',
                                            minWidth: '20px'
                                        }}>
                                            <div 
                                                style={{
                                                    width: '100%',
                                                    height: `${(item.errorRate / maxErrorRate) * 80}px`,
                                                    background: `linear-gradient(to top, 
                                                        ${item.errorRate > 50 ? '#ef4444' : 
                                                          item.errorRate > 25 ? '#f59e0b' : '#10b981'}, 
                                                        ${item.errorRate > 50 ? '#f87171' : 
                                                          item.errorRate > 25 ? '#fbbf24' : '#34d399'})`,
                                                    borderRadius: '2px 2px 0 0',
                                                    marginBottom: '4px',
                                                    minHeight: item.errorRate > 0 ? '4px' : '0px'
                                                }}
                                                title={`${item.date}: ${item.errorRate}% error rate (${item.totalErrors}/${item.totalAnnotations})`}
                                            />
                                            <div style={{ 
                                                fontSize: '0.6rem', 
                                                color: '#666', 
                                                textAlign: 'center',
                                                transform: 'rotate(-45deg)',
                                                transformOrigin: 'center',
                                                whiteSpace: 'nowrap',
                                                marginTop: '4px'
                                            }}>
                                                {item.date}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Error Rate Summary */}
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(3, 1fr)', 
                                    gap: '1rem',
                                    marginTop: '1rem'
                                }}>
                                    <div style={{ 
                                        textAlign: 'center',
                                        padding: '1rem',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                            {data.length > 0 ? Math.round(((data.length - totalErrors) / data.length) * 100) : 0}%
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Error-Free</div>
                                    </div>
                                    <div style={{ 
                                        textAlign: 'center',
                                        padding: '1rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                                            {data.length > 0 ? Math.round((totalErrors / data.length) * 100) : 0}%
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Error Rate</div>
                                    </div>
                                    <div style={{ 
                                        textAlign: 'center',
                                        padding: '1rem',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                            {data.length > 0 ? (totalErrors / data.length).toFixed(1) : 0}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Avg Errors/Item</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error rendering AdvancedErrorChart:', error);
        return (
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>🎯 Error Analysis (Error)</h3>
                </div>
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                    <p>Error loading error analysis chart. Please refresh the page.</p>
                </div>
            </div>
        );
    }
};

export default AdvancedErrorChart;