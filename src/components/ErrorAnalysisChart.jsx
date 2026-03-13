import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const ErrorAnalysisChart = ({ data = [] }) => {
    try {
        // Count error types from annotations with error handling
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

        const chartData = [
            { name: 'Fluency', value: errorCounts.fluency, color: '#3b82f6' },
            { name: 'Grammar', value: errorCounts.grammar, color: '#ef4444' },
            { name: 'Terminology', value: errorCounts.terminology, color: '#8b5cf6' },
            { name: 'Style', value: errorCounts.style, color: '#ec4899' },
            { name: 'Accuracy', value: errorCounts.accuracy, color: '#10b981' }
        ].filter(item => item.value > 0);

        const totalErrors = chartData.reduce((sum, item) => sum + item.value, 0);

        return (
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>🎯 Error Type Distribution</h3>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                        Most common error categories ({totalErrors} total errors from {data.length} annotations)
                    </p>
                </div>
                <div style={{ padding: '1rem', height: '300px' }}>
                    {chartData.length === 0 ? (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            height: '100%',
                            flexDirection: 'column',
                            color: '#666'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                            <p>No errors found - Excellent quality!</p>
                            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                Error distribution will appear here when annotations contain error types
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                />
                                <Legend 
                                    wrapperStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error rendering ErrorAnalysisChart:', error);
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

export default ErrorAnalysisChart;