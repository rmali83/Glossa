import { supabase } from '../lib/supabase';

/**
 * Translation Memory Service
 * Handles TM operations: matching, adding entries, and management
 */
export class TranslationMemoryService {
    
    /**
     * Find TM matches for a source text
     * @param {string} sourceText - Text to find matches for
     * @param {string} sourceLanguage - Source language code (e.g., 'en')
     * @param {string} targetLanguage - Target language code (e.g., 'es')
     * @param {number} minMatchPercentage - Minimum match percentage (default: 50)
     * @param {number} limit - Maximum number of matches to return (default: 10)
     * @returns {Promise<Array>} Array of TM matches with similarity scores
     */
    static async findMatches(sourceText, sourceLanguage, targetLanguage, minMatchPercentage = 50, limit = 10) {
        try {
            console.log('Finding TM matches for:', { sourceText: sourceText.substring(0, 50) + '...', sourceLanguage, targetLanguage });
            
            const { data, error } = await supabase.rpc('find_tm_matches', {
                p_source_text: sourceText,
                p_source_lang: sourceLanguage,
                p_target_lang: targetLanguage,
                p_min_match_percentage: minMatchPercentage,
                p_limit: limit
            });

            if (error) {
                console.error('Error finding TM matches:', error);
                return [];
            }

            // Format matches with match quality indicators
            const formattedMatches = data.map(match => ({
                id: match.tm_id,
                sourceText: match.source_text,
                targetText: match.target_text,
                matchPercentage: match.match_percentage,
                qualityScore: match.quality_score,
                usageCount: match.usage_count,
                domain: match.domain,
                createdAt: match.created_at,
                matchQuality: this.getMatchQuality(match.match_percentage),
                matchColor: this.getMatchColor(match.match_percentage)
            }));

            console.log(`Found ${formattedMatches.length} TM matches`);
            return formattedMatches;
        } catch (err) {
            console.error('TM matching error:', err);
            return [];
        }
    }

    /**
     * Add or update a TM entry
     * @param {Object} entry - TM entry data
     * @returns {Promise<string|null>} TM entry ID or null if failed
     */
    static async addEntry({
        sourceText,
        targetText,
        sourceLanguage,
        targetLanguage,
        domain = null,
        projectId = null,
        createdBy = null,
        qualityScore = 3
    }) {
        try {
            console.log('Adding TM entry:', { 
                sourceText: sourceText.substring(0, 50) + '...', 
                targetText: targetText.substring(0, 50) + '...',
                sourceLanguage, 
                targetLanguage 
            });

            const { data, error } = await supabase.rpc('upsert_tm_entry', {
                p_source_text: sourceText,
                p_target_text: targetText,
                p_source_lang: sourceLanguage,
                p_target_lang: targetLanguage,
                p_domain: domain,
                p_project_id: projectId,
                p_created_by: createdBy,
                p_quality_score: qualityScore
            });

            if (error) {
                console.error('Error adding TM entry:', error);
                return null;
            }

            console.log('TM entry added successfully:', data);
            return data;
        } catch (err) {
            console.error('TM add entry error:', err);
            return null;
        }
    }

    /**
     * Populate TM from existing completed segments
     * @returns {Promise<number>} Number of entries added
     */
    static async populateFromSegments() {
        try {
            console.log('Populating TM from existing segments...');

            const { data, error } = await supabase.rpc('populate_tm_from_segments');

            if (error) {
                console.error('Error populating TM:', error);
                return 0;
            }

            console.log(`Successfully populated TM with ${data} entries`);
            return data;
        } catch (err) {
            console.error('TM population error:', err);
            return 0;
        }
    }

    /**
     * Get TM statistics
     * @returns {Promise<Object>} TM statistics
     */
    static async getStatistics() {
        try {
            const { data, error } = await supabase
                .from('translation_memory')
                .select('*');

            if (error) {
                console.error('Error getting TM statistics:', error);
                return {
                    totalEntries: 0,
                    languagePairs: 0,
                    domains: 0,
                    avgQuality: 0
                };
            }

            // Calculate statistics
            const totalEntries = data.length;
            const languagePairs = new Set(data.map(entry => `${entry.source_lang}-${entry.target_lang}`)).size;
            const domains = new Set(data.filter(entry => entry.domain).map(entry => entry.domain)).size;
            const avgQuality = data.length > 0 
                ? (data.reduce((sum, entry) => sum + (entry.quality_score || 0), 0) / data.length).toFixed(1)
                : 0;

            return {
                totalEntries,
                languagePairs,
                domains,
                avgQuality
            };
        } catch (err) {
            console.error('TM statistics error:', err);
            return {
                totalEntries: 0,
                languagePairs: 0,
                domains: 0,
                avgQuality: 0
            };
        }
    }

    /**
     * Get match quality label based on percentage
     * @param {number} percentage - Match percentage
     * @returns {string} Quality label
     */
    static getMatchQuality(percentage) {
        if (percentage >= 100) return 'Perfect Match';
        if (percentage >= 95) return 'Excellent Match';
        if (percentage >= 85) return 'Good Match';
        if (percentage >= 75) return 'Fair Match';
        if (percentage >= 50) return 'Fuzzy Match';
        return 'Poor Match';
    }

    /**
     * Get match color based on percentage
     * @param {number} percentage - Match percentage
     * @returns {string} Color code
     */
    static getMatchColor(percentage) {
        if (percentage >= 100) return '#10b981'; // Green - Perfect
        if (percentage >= 95) return '#059669';  // Dark Green - Excellent
        if (percentage >= 85) return '#3b82f6';  // Blue - Good
        if (percentage >= 75) return '#f59e0b';  // Yellow - Fair
        if (percentage >= 50) return '#ef4444';  // Red - Fuzzy
        return '#6b7280'; // Gray - Poor
    }

    /**
     * Auto-add TM entry when segment is completed
     * @param {Object} segment - Completed segment data
     * @param {Object} project - Project data
     * @param {number} qualityScore - Quality score from annotation (optional)
     */
    static async autoAddFromSegment(segment, project, qualityScore = 3) {
        if (!segment.target_text || segment.target_text.trim() === '') {
            return null;
        }

        // Skip very short segments
        if (segment.source_text.length < 5 || segment.target_text.length < 5) {
            return null;
        }

        return await this.addEntry({
            sourceText: segment.source_text,
            targetText: segment.target_text,
            sourceLanguage: project.source_language,
            targetLanguage: project.target_language,
            domain: project.domain,
            projectId: project.id,
            createdBy: segment.translator_id,
            qualityScore: qualityScore
        });
    }

    /**
     * Search TM entries with filters
     * @param {Object} filters - Search filters
     * @returns {Promise<Array>} Filtered TM entries
     */
    static async searchEntries({
        searchText = '',
        sourceLanguage = null,
        targetLanguage = null,
        domain = null,
        minQuality = 0,
        limit = 50
    }) {
        try {
            let query = supabase
                .from('translation_memory')
                .select('*')
                .gte('quality_score', minQuality)
                .order('usage_count', { ascending: false })
                .limit(limit);

            if (searchText) {
                query = query.or(`source_text.ilike.%${searchText}%,target_text.ilike.%${searchText}%`);
            }

            if (sourceLanguage) {
                query = query.eq('source_lang', sourceLanguage);
            }

            if (targetLanguage) {
                query = query.eq('target_lang', targetLanguage);
            }

            if (domain) {
                query = query.eq('domain', domain);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error searching TM entries:', error);
                return [];
            }

            return data || [];
        } catch (err) {
            console.error('TM search error:', err);
            return [];
        }
    }
}

export default TranslationMemoryService;