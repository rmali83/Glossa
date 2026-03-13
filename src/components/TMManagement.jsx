import React, { useState, useEffect } from 'react';
import { TranslationMemoryService } from '../services/translationMemoryService';

const TMManagement = () => {
    const [tmStats, setTmStats] = useState({
        totalEntries: 0,
        languagePairs: 0,
        domains: 0,
        avgQuality: 0
    });
    const [tmEntries, setTmEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchFilters, setSearchFilters] = useState({
        searchText: '',
        sourceLanguage: '',
        targetLanguage: '',
        domain: '',
        minQuality: 0
    });
    const [isPopulating, setIsPopulating] = useState(false);

    useEffect(() => {
        loadTMData();
    }, []);

    const loadTMData = async () => {
        setLoading(true);
        try {
            // Load statistics
            const stats = await TranslationMemoryService.getStatistics();
            setTmStats(stats);

            // Load recent entries
            const entries = await TranslationMemoryService.searchEntries({
                limit: 20
            });
            setTmEntries(entries);
        } catch (err) {
            console.error('Error loading TM data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const entries = await TranslationMemoryService.searchEntries({
                ...searchFilters,
                limit: 50
            });
            setTmEntries(entries);
        } catch (err) {
            console.error('Error searching TM:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePopulateTM = async () => {
        if (!window.confirm('This will populate TM from all existing completed segments. Continue?')) {
            return;
        }

        setIsPopulating(true);
        try {
            const count = await TranslationMemoryService.populateFromSegments();
            alert(`✅ Successfully added ${count} entries to Translation Memory!`);
            loadTMData(); // Refresh data
        } catch (err) {
            console.error('Error populating TM:', err);
            alert('❌ Error populating TM. Check console for details.');
        } finally {
            setIsPopulating(false);
        }
    };

    if (loading && tmEntries.length === 0) {
        return (
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>🔄 Translation Memory Management</h3>
                </div>
                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <p>Loading Translation Memory data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* TM Statistics */}
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>📊 Translation Memory Statistics</h3>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                {tmStats.totalEntries.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                                Total Entries
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                                {tmStats.languagePairs}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                                Language Pairs
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                {tmStats.domains}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                                Domains
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                                {tmStats.avgQuality}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                                Avg Quality
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <button
                            onClick={handlePopulateTM}
                            disabled={isPopulating}
                            style={{
                                padding: '12px 24px',
                                background: isPopulating ? '#666' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: isPopulating ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                margin: '0 auto'
                            }}
                        >
                            {isPopulating ? (
                                <>
                                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                                    Populating TM...
                                </>
                            ) : (
                                <>
                                    🔄 Populate TM from Segments
                                </>
                            )}
                        </button>
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                            Import all completed segments into Translation Memory
                        </p>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>🔍 Search Translation Memory</h3>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Search text..."
                            value={searchFilters.searchText}
                            onChange={(e) => setSearchFilters({ ...searchFilters, searchText: e.target.value })}
                            style={{
                                padding: '8px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '0.9rem'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Source language (e.g., en)"
                            value={searchFilters.sourceLanguage}
                            onChange={(e) => setSearchFilters({ ...searchFilters, sourceLanguage: e.target.value })}
                            style={{
                                padding: '8px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '0.9rem'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Target language (e.g., es)"
                            value={searchFilters.targetLanguage}
                            onChange={(e) => setSearchFilters({ ...searchFilters, targetLanguage: e.target.value })}
                            style={{
                                padding: '8px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Domain"
                            value={searchFilters.domain}
                            onChange={(e) => setSearchFilters({ ...searchFilters, domain: e.target.value })}
                            style={{
                                padding: '8px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '0.9rem',
                                flex: 1
                            }}
                        />
                        <select
                            value={searchFilters.minQuality}
                            onChange={(e) => setSearchFilters({ ...searchFilters, minQuality: parseInt(e.target.value) })}
                            style={{
                                padding: '8px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '0.9rem'
                            }}
                        >
                            <option value={0}>All Quality</option>
                            <option value={1}>1+ Stars</option>
                            <option value={2}>2+ Stars</option>
                            <option value={3}>3+ Stars</option>
                            <option value={4}>4+ Stars</option>
                            <option value={5}>5 Stars</option>
                        </select>
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            style={{
                                padding: '8px 16px',
                                background: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>
            </div>

            {/* TM Entries */}
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>📝 Translation Memory Entries</h3>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                        Showing {tmEntries.length} entries
                    </p>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    {tmEntries.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                            <p>No TM entries found.</p>
                            <p style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
                                Click "Populate TM from Segments" to import existing translations.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {tmEntries.map((entry, index) => (
                                <div key={entry.id || index} style={{
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                                                {entry.source_language?.toUpperCase()} → {entry.target_language?.toUpperCase()}
                                                {entry.domain && (
                                                    <span style={{ marginLeft: '1rem', padding: '2px 6px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', borderRadius: '4px', fontSize: '0.7rem' }}>
                                                        {entry.domain}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '0.5rem' }}>
                                                {entry.source_text}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '500' }}>
                                                {entry.target_text}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem' }}>
                                            {entry.quality_score > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} style={{ 
                                                            color: i < entry.quality_score ? '#fbbf24' : '#374151',
                                                            fontSize: '0.8rem'
                                                        }}>★</span>
                                                    ))}
                                                </div>
                                            )}
                                            {entry.usage_count > 0 && (
                                                <div style={{ fontSize: '0.7rem', color: '#666' }}>
                                                    Used {entry.usage_count}x
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {entry.created_at && (
                                        <div style={{ fontSize: '0.7rem', color: '#666' }}>
                                            Created: {new Date(entry.created_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TMManagement;