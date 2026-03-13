import React from 'react';

const SimpleQualityChart = ({ data = [] }) => {
    try {
        // Process data for simple visualization
        const processedData = data
            .filter(item => item.quality_rating && item.created_at)
            .slice(-7) // Last 7 entries
            .map(item => ({
                date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                quality: item.quality_rating,
                mqm: item.mqm_score || 100
            }));

        const maxQuality = 5;
        const avgQuality = processedData.length > 0 
            ? (processedData.reduce((sum, item) => sum + item.quality, 0) / processedData.length).toFixed(1)
            : 0;

        return (
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>📈 Quality Trends (Last 7 Days)</h3>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                        Average quality: {avgQuality}/5 stars ({data.length} annotations)
                    </p>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    {processedData.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                            <p>No quality data available yet</p>
                            <p style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
                                Quality trends will appear here once annotations with ratings are created
                            </p>
                        </div>
                    ) : (
                        <div>
                            {/* Simple bar chart */}
                            <div style={{ display: 'flex', alignItems: 'end', gap: '8px', height: '200px', marginBottom: '1rem' }}>
                                {processedData.map((item, index) => (
                                    <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div 
                                            style={{
                                                width: '100%',
                                                height: `${(item.quality / maxQuality) * 160}px`,
                                                background: `linear-gradient(to top, #10b981, #34d399)`,
                                                borderRadius: '4px 4px 0 0',
                                                marginBottom: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {item.quality}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#666', textAlign: 'center' }}>
                                            {item.date}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Legend */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
                                    <span>Quality Rating (1-5)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error rendering SimpleQualityChart:', error);
        return (
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>📈 Quality Trends (Error)</h3>
                </div>
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                    <p>Error loading chart. Please try refreshing the page.</p>
                </div>
            </div>
        );
    }
};

export default SimpleQualityChart;