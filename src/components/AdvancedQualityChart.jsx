import React from 'react';

const AdvancedQualityChart = ({ data = [], projects = [] }) => {
    try {
        // Process quality data over time
        const processedData = data
            .filter(item => item.quality_rating && item.created_at)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .slice(-30) // Last 30 entries
            .map(item => ({
                date: new Date(item.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                }),
                quality: item.quality_rating,
                project: item.project_id
            }));

        // Calculate metrics
        const avgQuality = processedData.length > 0 
            ? (processedData.reduce((sum, item) => sum + item.quality, 0) / processedData.length).toFixed(1)
            : 0;

        const qualityTrend = processedData.length >= 2 
            ? processedData[processedData.length - 1].quality - processedData[0].quality
            : 0;

        const maxQuality = 5;

        // Group by date for better visualization
        const groupedData = processedData.reduce((acc, item) => {
            if (!acc[item.date]) {
                acc[item.date] = [];
            }
            acc[item.date].push(item.quality);
            return acc;
        }, {});

        const chartData = Object.entries(groupedData).map(([date, qualities]) => ({
            date,
            avgQuality: (qualities.reduce((sum, q) => sum + q, 0) / qualities.length).toFixed(1),
            count: qualities.length
        })).slice(-14); // Last 14 days

        return (
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>📈 Quality Trends</h3>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#666' }}>
                        <span>Avg: {avgQuality}/5</span>
                        <span style={{ color: qualityTrend >= 0 ? '#10b981' : '#ef4444' }}>
                            {qualityTrend >= 0 ? '↗' : '↘'} {Math.abs(qualityTrend).toFixed(1)}
                        </span>
                    </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    {chartData.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                            <p>No quality data available</p>
                            <p style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
                                Quality trends will appear here once annotations with ratings are created
                            </p>
                        </div>
                    ) : (
                        <div>
                            {/* Chart Area */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'end', 
                                gap: '6px', 
                                height: '200px', 
                                marginBottom: '1rem',
                                padding: '0 1rem'
                            }}>
                                {chartData.map((item, index) => (
                                    <div key={index} style={{ 
                                        flex: 1, 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center',
                                        minWidth: '30px'
                                    }}>
                                        <div 
                                            style={{
                                                width: '100%',
                                                height: `${(parseFloat(item.avgQuality) / maxQuality) * 160}px`,
                                                background: `linear-gradient(to top, 
                                                    ${parseFloat(item.avgQuality) >= 4 ? '#10b981' : 
                                                      parseFloat(item.avgQuality) >= 3 ? '#f59e0b' : '#ef4444'}, 
                                                    ${parseFloat(item.avgQuality) >= 4 ? '#34d399' : 
                                                      parseFloat(item.avgQuality) >= 3 ? '#fbbf24' : '#f87171'})`,
                                                borderRadius: '4px 4px 0 0',
                                                marginBottom: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                minHeight: '20px',
                                                position: 'relative'
                                            }}
                                            title={`${item.date}: ${item.avgQuality}/5 (${item.count} annotations)`}
                                        >
                                            {parseFloat(item.avgQuality) > 0 ? item.avgQuality : ''}
                                        </div>
                                        <div style={{ 
                                            fontSize: '0.65rem', 
                                            color: '#666', 
                                            textAlign: 'center',
                                            transform: 'rotate(-45deg)',
                                            transformOrigin: 'center',
                                            whiteSpace: 'nowrap',
                                            marginTop: '8px'
                                        }}>
                                            {item.date}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Quality Distribution */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(5, 1fr)', 
                                gap: '0.5rem',
                                marginTop: '1.5rem'
                            }}>
                                {[5, 4, 3, 2, 1].map(rating => {
                                    const count = processedData.filter(item => item.quality === rating).length;
                                    const percentage = processedData.length > 0 
                                        ? Math.round((count / processedData.length) * 100) 
                                        : 0;
                                    
                                    return (
                                        <div key={rating} style={{ textAlign: 'center' }}>
                                            <div style={{ 
                                                fontSize: '0.8rem', 
                                                fontWeight: 'bold',
                                                color: rating >= 4 ? '#10b981' : rating >= 3 ? '#f59e0b' : '#ef4444'
                                            }}>
                                                {rating}★
                                            </div>
                                            <div style={{ 
                                                fontSize: '1.2rem', 
                                                fontWeight: 'bold', 
                                                color: '#fff' 
                                            }}>
                                                {count}
                                            </div>
                                            <div style={{ 
                                                fontSize: '0.7rem', 
                                                color: '#666' 
                                            }}>
                                                {percentage}%
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error rendering AdvancedQualityChart:', error);
        return (
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>📈 Quality Trends (Error)</h3>
                </div>
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                    <p>Error loading quality chart. Please refresh the page.</p>
                </div>
            </div>
        );
    }
};

export default AdvancedQualityChart;