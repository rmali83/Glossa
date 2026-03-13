import React from 'react';

const SimpleProductivityChart = ({ projects = [], annotations = [] }) => {
    try {
        // Calculate productivity metrics
        const translatorMetrics = {};

        projects.forEach(project => {
            if (project && typeof project === 'object') {
                const translatorId = project.translator_id;
                const translatorName = project.translator?.full_name || 'Unknown';
                
                if (translatorId) {
                    if (!translatorMetrics[translatorId]) {
                        translatorMetrics[translatorId] = {
                            name: translatorName,
                            totalWords: 0,
                            totalProjects: 0,
                            completedProjects: 0
                        };
                    }

                    translatorMetrics[translatorId].totalWords += project.total_words || 0;
                    translatorMetrics[translatorId].totalProjects += 1;
                    
                    if (project.status === 'completed') {
                        translatorMetrics[translatorId].completedProjects += 1;
                    }
                }
            }
        });

        const chartData = Object.values(translatorMetrics)
            .filter(metrics => metrics.totalProjects > 0)
            .map(metrics => ({
                name: metrics.name.split(' ')[0], // First name only
                wordsPerProject: Math.round(metrics.totalWords / metrics.totalProjects),
                completionRate: Math.round((metrics.completedProjects / metrics.totalProjects) * 100),
                totalWords: metrics.totalWords
            }))
            .sort((a, b) => b.totalWords - a.totalWords)
            .slice(0, 6); // Top 6 translators

        const maxWords = Math.max(...chartData.map(item => item.wordsPerProject), 1);

        return (
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>⚡ Translator Productivity</h3>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                        Top translators by words per project ({projects.length} projects)
                    </p>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    {chartData.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                            <p>No translator data available yet</p>
                            <p style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
                                Productivity metrics will appear here once projects are assigned to translators
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {chartData.map((translator, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ 
                                        width: '60px', 
                                        fontSize: '0.85rem', 
                                        color: '#fff',
                                        textAlign: 'right'
                                    }}>
                                        {translator.name}
                                    </div>
                                    <div style={{ flex: 1, height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
                                        <div 
                                            style={{
                                                width: `${(translator.wordsPerProject / maxWords) * 100}%`,
                                                height: '100%',
                                                background: `linear-gradient(90deg, #3b82f6, #1d4ed8)`,
                                                borderRadius: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                minWidth: '50px'
                                            }}
                                        >
                                            {translator.wordsPerProject}
                                        </div>
                                    </div>
                                    <div style={{ 
                                        width: '60px', 
                                        fontSize: '0.8rem', 
                                        color: translator.completionRate >= 80 ? '#10b981' : translator.completionRate >= 50 ? '#f59e0b' : '#ef4444',
                                        textAlign: 'center',
                                        fontWeight: 'bold'
                                    }}>
                                        {translator.completionRate}%
                                    </div>
                                </div>
                            ))}
                            
                            {/* Legend */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.8rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px' }}></div>
                                    <span>Words/Project</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
                                    <span>Completion %</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error rendering SimpleProductivityChart:', error);
        return (
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>⚡ Productivity Metrics (Error)</h3>
                </div>
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                    <p>Error loading chart. Please try refreshing the page.</p>
                </div>
            </div>
        );
    }
};

export default SimpleProductivityChart;