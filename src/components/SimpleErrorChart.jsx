import React from 'react';

const SimpleErrorChart = ({ data = [] }) => {
    try {
        // Count error types
        const errorCounts = {
            fluency: 0,
            grammar: 0,
            terminology: 0,
            style: 0,
            accuracy: 0
        };

        data.forEach(item => {
            if (item && typeof item === 'object') {
                if (item.error_fluency) errorCounts.fluency++;
                if (item.error_grammar) errorCounts.grammar++;
                if (item.error_terminology) errorCounts.terminology++;
                if (item.error_style) errorCounts.style++;
                if (item.error_accuracy) errorCounts.accuracy++;
            }
        });

        const errorData = [
            { name: 'Fluency', count: errorCounts.fluency, color: '#3b82f6' },
            { name: 'Grammar', count: errorCounts.grammar, color: '#ef4444' },
            { name: 'Terminology', count: errorCounts.terminology, color: '#8b5cf6' },
            { name: 'Style', count: errorCounts.style, color: '#ec4899' },
            { name: 'Accuracy', count: errorCounts.accuracy, color: '#10b981' }
        ];

        const totalErrors = errorData.reduce((sum, item) => sum + item.count, 0);
        const maxCount = Math.max(...errorData.map(item => item.count));

        return (
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>🎯 Error Type Distribution</h3>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                        {totalErrors} total errors from {data.length} annotations
                    </p>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    {totalErrors === 0 ? (
                        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                            <p>No errors found - Excellent quality!</p>
                            <p style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
                                Error distribution will appear here when annotations contain error types
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {errorData.map((error, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ 
                                        width: '80px', 
                                        fontSize: '0.85rem', 
                                        color: '#fff',
                                        textAlign: 'right'
                                    }}>
                                        {error.name}
                                    </div>
                                    <div style={{ flex: 1, height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                                        <div 
                                            style={{
                                                width: maxCount > 0 ? `${(error.count / maxCount) * 100}%` : '0%',
                                                height: '100%',
                                                background: error.color,
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                minWidth: error.count > 0 ? '30px' : '0px'
                                            }}
                                        >
                                            {error.count > 0 ? error.count : ''}
                                        </div>
                                    </div>
                                    <div style={{ 
                                        width: '40px', 
                                        fontSize: '0.8rem', 
                                        color: '#666',
                                        textAlign: 'left'
                                    }}>
                                        {totalErrors > 0 ? Math.round((error.count / totalErrors) * 100) : 0}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error rendering SimpleErrorChart:', error);
        return (
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>🎯 Error Analysis (Error)</h3>
                </div>
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                    <p>Error loading chart. Please try refreshing the page.</p>
                </div>
            </div>
        );
    }
};

export default SimpleErrorChart;