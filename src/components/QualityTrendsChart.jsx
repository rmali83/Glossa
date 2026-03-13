import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const QualityTrendsChart = ({ data }) => {
    // Transform data for the chart
    const chartData = data.map(item => ({
        date: new Date(item.created_at).toLocaleDateString(),
        quality: item.quality_rating || 0,
        mqmScore: item.mqm_score || 100
    }));

    // Group by date and calculate averages
    const groupedData = chartData.reduce((acc, item) => {
        const date = item.date;
        if (!acc[date]) {
            acc[date] = { date, qualities: [], mqmScores: [] };
        }
        if (item.quality > 0) acc[date].qualities.push(item.quality);
        if (item.mqmScore < 100) acc[date].mqmScores.push(item.mqmScore);
        return acc;
    }, {});

    const trendData = Object.values(groupedData).map(group => ({
        date: group.date,
        avgQuality: group.qualities.length > 0 
            ? (group.qualities.reduce((sum, q) => sum + q, 0) / group.qualities.length).toFixed(1)
            : 0,
        avgMQM: group.mqmScores.length > 0
            ? (group.mqmScores.reduce((sum, s) => sum + s, 0) / group.mqmScores.length).toFixed(1)
            : 100
    })).slice(-7); // Last 7 days

    return (
        <div className="dashboard-card">
            <div className="card-header">
                <h3>📈 Quality Trends (Last 7 Days)</h3>
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                    Average quality ratings and MQM scores over time
                </p>
            </div>
            <div style={{ padding: '1rem', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                            dataKey="date" 
                            stroke="#666"
                            fontSize={12}
                        />
                        <YAxis 
                            stroke="#666"
                            fontSize={12}
                            domain={[0, 5]}
                        />
                        <Tooltip 
                            contentStyle={{
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="avgQuality" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                            name="Quality Rating (1-5)"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="avgMQM" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            name="MQM Score (0-100)"
                            yAxisId="right"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default QualityTrendsChart;