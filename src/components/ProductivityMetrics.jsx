import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProductivityMetrics = ({ projects, annotations }) => {
    // Calculate productivity metrics per translator
    const translatorMetrics = {};

    // Process projects for word count and completion time
    projects.forEach(project => {
        const translatorId = project.translator_id;
        const translatorName = project.translator?.full_name || 'Unknown';
        
        if (!translatorMetrics[translatorId]) {
            translatorMetrics[translatorId] = {
                name: translatorName,
                totalWords: 0,
                totalProjects: 0,
                completedProjects: 0,
                avgQuality: 0,
                qualityRatings: []
            };
        }

        translatorMetrics[translatorId].totalWords += project.total_words || 0;
        translatorMetrics[translatorId].totalProjects += 1;
        
        if (project.status === 'completed') {
            translatorMetrics[translatorId].completedProjects += 1;
        }
    });

    // Add quality ratings from annotations
    annotations.forEach(annotation => {
        const translatorId = annotation.annotator_id;
        if (translatorMetrics[translatorId] && annotation.quality_rating) {
            translatorMetrics[translatorId].qualityRatings.push(annotation.quality_rating);
        }
    });

    // Calculate averages and format for chart
    const chartData = Object.values(translatorMetrics)
        .filter(metrics => metrics.totalProjects > 0)
        .map(metrics => {
            const avgQuality = metrics.qualityRatings.length > 0
                ? metrics.qualityRatings.reduce((sum, rating) => sum + rating, 0) / metrics.qualityRatings.length
                : 0;
            
            return {
                name: metrics.name.split(' ')[0], // First name only for chart
                wordsPerProject: Math.round(metrics.totalWords / metrics.totalProjects),
                completionRate: Math.round((metrics.completedProjects / metrics.totalProjects) * 100),
                avgQuality: Number(avgQuality.toFixed(1)),
                totalWords: metrics.totalWords
            };
        })
        .sort((a, b) => b.totalWords - a.totalWords)
        .slice(0, 8); // Top 8 translators

    return (
        <div className="dashboard-card">
            <div className="card-header">
                <h3>⚡ Translator Productivity</h3>
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                    Words per project and completion rates by translator
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
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                        <p>No translator data available yet</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis 
                                dataKey="name" 
                                stroke="#666"
                                fontSize={12}
                            />
                            <YAxis 
                                stroke="#666"
                                fontSize={12}
                            />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                                formatter={(value, name) => {
                                    if (name === 'wordsPerProject') return [value, 'Words/Project'];
                                    if (name === 'completionRate') return [`${value}%`, 'Completion Rate'];
                                    if (name === 'avgQuality') return [`${value}/5`, 'Avg Quality'];
                                    return [value, name];
                                }}
                            />
                            <Bar 
                                dataKey="wordsPerProject" 
                                fill="#3b82f6" 
                                name="Words per Project"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar 
                                dataKey="completionRate" 
                                fill="#10b981" 
                                name="Completion Rate (%)"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default ProductivityMetrics;