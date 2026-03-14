import React from 'react';

const ProductivityChart = ({ projects = [], annotations = [], translators = [] }) => {
    try {
        // Calculate productivity metrics
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        // Projects completed in last 30 days
        const recentProjects = projects.filter(p => 
            p.status === 'completed' && 
            new Date(p.updated_at || p.created_at) >= last30Days
        );

        // Annotations created in last 30 days
        const recentAnnotations = annotations.filter(a => 
            new Date(a.created_at) >= last30Days
        );

        // Calculate daily productivity for last 14 days
        const productivityData = [];
        for (let i = 13; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayProjects = projects.filter(p => {
                const updatedAt = new Date(p.updated_at || p.created_at);
                return updatedAt >= dayStart && updatedAt <= dayEnd;
            }).length;

            const dayAnnotations = annotations.filter(a => {
                const createdAt = new Date(a.created_at);
                return createdAt >= dayStart && createdAt <= dayEnd;
            }).length;

            productivityData.push({
                date: dateStr,
                projects: dayProjects,
                annotations: dayAnnotations,
                total: dayProjects + dayAnnotations
            });
        }

        const maxActivity = Math.max(...productivityData.map(d => d.total), 1);

        // Calculate translator productivity
        const translatorStats = translators.map(translator => {
            const translatorProjects = projects.filter(p => 
                p.translator_id === translator.id && 
                p.status === 'completed'
            ).length;

            const translatorAnnotations = annotations.filter(a => 
                a.translator_id === translator.id
            ).length;

            return {
                name: translator.full_name || translator.email,
                projects: translatorProjects,
                annotations: translatorAnnotations,
                total: translatorProjects + translatorAnnotations
            };
        }).sort((a, b) => b.total - a.total).slice(0, 5);

        return (
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>⚡ Productivity Metrics</h3>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        Last 14 days activity
                    </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    {productivityData.every(d => d.total === 0) ? (
                        <div style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                            <p>No activity data available</p>
                            <p style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
                                Productivity metrics will appear here once projects and annotations are created
                            </p>
                        </div>
                    ) : (
                        <div>
                            {/* Daily Activity Chart */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>
                                    Daily Activity
                                </h4>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'end', 
                                    gap: '4px', 
                                    height: '120px',
                                    marginBottom: '1rem'
                                }}>
                                    {productivityData.map((item, index) => (
                                        <div key={index} style={{ 
                                            flex: 1, 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center',
                                            minWidth: '25px'
                                        }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                alignItems: 'center',
                                                width: '100%',
                                                height: '100px'
                                            }}>
                                                {/* Projects bar */}
                                                <div 
                                                    style={{
                                                        width: '100%',
                                                        height: `${(item.projects / maxActivity) * 50}px`,
                                                        background: 'linear-gradient(to top, #3b82f6, #60a5fa)',
                                                        borderRadius: '2px 2px 0 0',
                                                        marginBottom: '1px',
                                                        minHeight: item.projects > 0 ? '3px' : '0px'
                                                    }}
                                                    title={`${item.date}: ${item.projects} projects`}
                                                />
                                                {/* Annotations bar */}
                                                <div 
                                                    style={{
                                                        width: '100%',
                                                        height: `${(item.annotations / maxActivity) * 50}px`,
                                                        background: 'linear-gradient(to top, #10b981, #34d399)',
                                                        borderRadius: '0 0 2px 2px',
                                                        minHeight: item.annotations > 0 ? '3px' : '0px'
                                                    }}
                                                    title={`${item.date}: ${item.annotations} annotations`}
                                                />
                                            </div>
                                            <div style={{ 
                                                fontSize: '0.6rem', 
                                                color: '#666', 
                                                textAlign: 'center',
                                                marginTop: '4px',
                                                transform: 'rotate(-45deg)',
                                                transformOrigin: 'center',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {item.date}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Legend */}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px' }}></div>
                                        <span>Projects</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
                                        <span>Annotations</span>
                                    </div>
                                </div>
                            </div>

                            {/* Top Performers */}
                            {translatorStats.length > 0 && (
                                <div>
                                    <h4 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>
                                        Top Performers
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {translatorStats.map((translator, index) => (
                                            <div key={index} style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '1rem',
                                                padding: '0.75rem',
                                                background: 'rgba(255,255,255,0.02)',
                                                borderRadius: '6px'
                                            }}>
                                                <div style={{ 
                                                    width: '24px', 
                                                    height: '24px', 
                                                    borderRadius: '50%',
                                                    background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#666',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 'bold',
                                                    color: '#000'
                                                }}>
                                                    {index + 1}
                                                </div>
                                                <div style={{ flex: 1, fontSize: '0.9rem', color: '#fff' }}>
                                                    {translator.name}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                                    {translator.projects}P + {translator.annotations}A
                                                </div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#10b981' }}>
                                                    {translator.total}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error rendering ProductivityChart:', error);
        return (
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>⚡ Productivity Metrics (Error)</h3>
                </div>
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                    <p>Error loading productivity chart. Please refresh the page.</p>
                </div>
            </div>
        );
    }
};

export default ProductivityChart;