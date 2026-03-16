/**
 * Translation Pipeline - Automated translation processing
 * 
 * Handles the automated translation of detected content changes
 * with TM matching, AI translation, and quality assurance.
 */

import { supabase } from '../lib/supabase';
import { TranslationMemoryService } from './translationMemoryService';
import { translateWithMyMemory, translateWithLibreTranslate } from './aiTranslation';

class TranslationPipeline {
  constructor() {
    this.translationQueue = [];
    this.batchSize = 20;
    this.processingInterval = 5000; // 5 seconds
    this.isProcessing = false;
    this.maxRetries = 3;
    this.tmThreshold = 85; // Minimum TM match percentage for auto-approval
    
    // Translation engines priority
    this.translationEngines = [
      { name: 'MyMemory', func: translateWithMyMemory, priority: 1 },
      { name: 'LibreTranslate', func: translateWithLibreTranslate, priority: 2 }
    ];
    
    // Start processing
    this.startProcessing();
  }

  /**
   * Start the translation pipeline processor
   */
  startProcessing() {
    console.log('[TranslationPipeline] Starting processor...');
    
    setInterval(async () => {
      if (!this.isProcessing && this.translationQueue.length > 0) {
        await this.processQueue();
      }
    }, this.processingInterval);
    
    // Load pending translations from database
    this.loadPendingTranslations();
  }

  /**
   * Load pending translations from database
   */
  async loadPendingTranslations() {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          id,
          source_language,
          target_language,
          automated_site_id,
          segments (
            id,
            source_text,
            target_text,
            status,
            segment_key,
            metadata
          )
        `)
        .eq('status', 'auto_processing')
        .limit(100);

      if (error) throw error;

      projects.forEach(project => {
        project.segments.forEach(segment => {
          if (segment.status === 'Draft' || segment.status === 'Pending') {
            this.addToQueue({
              projectId: project.id,
              segmentId: segment.id,
              sourceText: segment.source_text,
              sourceLanguage: project.source_language,
              targetLanguages: project.target_language.split(', '),
              siteId: project.automated_site_id,
              segmentKey: segment.segment_key,
              metadata: segment.metadata,
              priority: 'normal'
            });
          }
        });
      });

      console.log(`[TranslationPipeline] Loaded ${this.translationQueue.length} pending translations`);
    } catch (error) {
      console.error('[TranslationPipeline] Error loading pending translations:', error);
    }
  }

  /**
   * Add item to translation queue
   */
  addToQueue(item) {
    const queueItem = {
      ...item,
      timestamp: Date.now(),
      retries: 0,
      id: `${item.projectId}-${item.segmentId}-${Date.now()}`
    };

    // Insert based on priority
    if (item.priority === 'high') {
      this.translationQueue.unshift(queueItem);
    } else {
      this.translationQueue.push(queueItem);
    }

    console.log(`[TranslationPipeline] Added to queue: ${item.sourceText.substring(0, 50)}...`);
  }

  /**
   * Process translation queue
   */
  async processQueue() {
    if (this.isProcessing || this.translationQueue.length === 0) return;

    this.isProcessing = true;
    console.log(`[TranslationPipeline] Processing ${this.translationQueue.length} items in queue`);

    try {
      // Process items in batches
      while (this.translationQueue.length > 0) {
        const batch = this.translationQueue.splice(0, this.batchSize);
        await Promise.all(batch.map(item => this.processTranslationItem(item)));
        
        // Small delay between batches to avoid overwhelming APIs
        await this.delay(1000);
      }
    } catch (error) {
      console.error('[TranslationPipeline] Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual translation item
   */
  async processTranslationItem(item) {
    const { 
      projectId, 
      segmentId, 
      sourceText, 
      sourceLanguage, 
      targetLanguages, 
      siteId,
      segmentKey,
      metadata 
    } = item;

    console.log(`[TranslationPipeline] Processing: ${sourceText.substring(0, 50)}...`);

    try {
      // Process each target language
      for (const targetLanguage of targetLanguages) {
        const translation = await this.translateText(
          sourceText, 
          sourceLanguage, 
          targetLanguage,
          { siteId, segmentKey, metadata }
        );

        if (translation.success) {
          // Update segment with translation
          await this.updateSegmentTranslation(
            segmentId, 
            translation.text, 
            translation.source,
            translation.confidence
          );

          // Cache translation for future use
          if (siteId) {
            await this.cacheTranslation(
              siteId,
              sourceText,
              sourceLanguage,
              translation.text,
              targetLanguage,
              segmentKey,
              metadata
            );
          }

          console.log(`[TranslationPipeline] Translated to ${targetLanguage}: ${translation.text.substring(0, 50)}...`);
        } else {
          console.error(`[TranslationPipeline] Translation failed for ${targetLanguage}:`, translation.error);
        }
      }

      // Mark project as completed if all segments are translated
      await this.checkProjectCompletion(projectId);

    } catch (error) {
      console.error('[TranslationPipeline] Error processing translation item:', error);
      
      // Retry logic
      if (item.retries < this.maxRetries) {
        item.retries++;
        this.translationQueue.push(item);
        console.log(`[TranslationPipeline] Retrying item (attempt ${item.retries}/${this.maxRetries})`);
      } else {
        console.error(`[TranslationPipeline] Max retries reached for item: ${sourceText.substring(0, 50)}...`);
        
        // Mark segment as failed
        await this.markSegmentAsFailed(segmentId, error.message);
      }
    }
  }

  /**
   * Translate text using TM and AI fallback
   */
  async translateText(sourceText, sourceLanguage, targetLanguage, context = {}) {
    try {
      // 1. Check Translation Memory first
      const tmMatches = await TranslationMemoryService.findMatches(
        sourceText,
        sourceLanguage,
        targetLanguage,
        this.tmThreshold
      );

      if (tmMatches.length > 0 && tmMatches[0].matchPercentage >= this.tmThreshold) {
        const bestMatch = tmMatches[0];
        
        // Update TM usage statistics
        await this.updateTMUsage(bestMatch.id);
        
        return {
          success: true,
          text: bestMatch.targetText,
          source: 'TM',
          confidence: bestMatch.matchPercentage,
          tmId: bestMatch.id
        };
      }

      // 2. Check cached translations for this site
      if (context.siteId) {
        const cachedTranslation = await this.getCachedTranslation(
          context.siteId,
          sourceText,
          sourceLanguage,
          targetLanguage
        );

        if (cachedTranslation) {
          return {
            success: true,
            text: cachedTranslation.translation,
            source: 'Cache',
            confidence: 90,
            cacheId: cachedTranslation.id
          };
        }
      }

      // 3. Use AI translation engines
      for (const engine of this.translationEngines) {
        try {
          const result = await engine.func(sourceText, sourceLanguage, targetLanguage);
          
          if (result.success) {
            // Store in TM for future use
            await TranslationMemoryService.addEntry({
              sourceText,
              targetText: result.translation,
              sourceLanguage,
              targetLanguage,
              domain: context.metadata?.domain,
              qualityScore: this.calculateQualityScore(result.confidence || 0.8)
            });

            return {
              success: true,
              text: result.translation,
              source: engine.name,
              confidence: result.confidence || 0.8,
              engine: engine.name
            };
          }
        } catch (engineError) {
          console.warn(`[TranslationPipeline] ${engine.name} failed:`, engineError);
          continue; // Try next engine
        }
      }

      // All engines failed
      throw new Error('All translation engines failed');

    } catch (error) {
      console.error('[TranslationPipeline] Translation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get cached translation
   */
  async getCachedTranslation(siteId, sourceText, sourceLanguage, targetLanguage) {
    try {
      const { data, error } = await supabase.rpc('find_cached_translation', {
        p_site_id: siteId,
        p_source_text: sourceText,
        p_source_language: sourceLanguage,
        p_target_language: targetLanguage
      });

      if (error) throw error;
      return data[0] || null;
    } catch (error) {
      console.error('[TranslationPipeline] Error getting cached translation:', error);
      return null;
    }
  }

  /**
   * Cache translation for future use
   */
  async cacheTranslation(siteId, sourceText, sourceLanguage, targetText, targetLanguage, selector, metadata) {
    try {
      const { error } = await supabase.rpc('upsert_cached_translation', {
        p_site_id: siteId,
        p_source_text: sourceText,
        p_source_language: sourceLanguage,
        p_target_text: targetText,
        p_target_language: targetLanguage,
        p_selector: selector,
        p_context: metadata || {}
      });

      if (error) throw error;
    } catch (error) {
      console.error('[TranslationPipeline] Error caching translation:', error);
    }
  }

  /**
   * Update segment with translation
   */
  async updateSegmentTranslation(segmentId, translation, source, confidence) {
    try {
      const status = confidence >= 0.9 ? 'Completed' : 'Review';
      
      const { error } = await supabase
        .from('segments')
        .update({
          target_text: translation,
          status: status,
          metadata: {
            translationSource: source,
            confidence: confidence,
            translatedAt: new Date().toISOString()
          }
        })
        .eq('id', segmentId);

      if (error) throw error;
    } catch (error) {
      console.error('[TranslationPipeline] Error updating segment:', error);
      throw error;
    }
  }

  /**
   * Mark segment as failed
   */
  async markSegmentAsFailed(segmentId, errorMessage) {
    try {
      const { error } = await supabase
        .from('segments')
        .update({
          status: 'Failed',
          metadata: {
            error: errorMessage,
            failedAt: new Date().toISOString()
          }
        })
        .eq('id', segmentId);

      if (error) throw error;
    } catch (error) {
      console.error('[TranslationPipeline] Error marking segment as failed:', error);
    }
  }

  /**
   * Check if project is completed
   */
  async checkProjectCompletion(projectId) {
    try {
      const { data: segments, error } = await supabase
        .from('segments')
        .select('status')
        .eq('project_id', projectId);

      if (error) throw error;

      const totalSegments = segments.length;
      const completedSegments = segments.filter(s => 
        s.status === 'Completed' || s.status === 'Review'
      ).length;

      if (completedSegments === totalSegments) {
        // Mark project as completed
        await supabase
          .from('projects')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', projectId);

        console.log(`[TranslationPipeline] Project ${projectId} completed`);
        
        // Trigger deployment
        await this.triggerDeployment(projectId);
      }
    } catch (error) {
      console.error('[TranslationPipeline] Error checking project completion:', error);
    }
  }

  /**
   * Trigger deployment of translations
   */
  async triggerDeployment(projectId) {
    try {
      // Get project details
      const { data: project, error } = await supabase
        .from('projects')
        .select('automated_site_id, target_language')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      if (project.automated_site_id) {
        // Trigger deployment for automated site
        console.log(`[TranslationPipeline] Triggering deployment for project ${projectId}`);
        
        // This would integrate with your deployment system
        // For now, we'll just log it
        await this.createDeploymentRecord(project.automated_site_id, projectId, project.target_language);
      }
    } catch (error) {
      console.error('[TranslationPipeline] Error triggering deployment:', error);
    }
  }

  /**
   * Create deployment record
   */
  async createDeploymentRecord(siteId, projectId, languages) {
    try {
      const languageArray = languages.split(', ');
      
      const deploymentRecords = languageArray.map(language => ({
        site_id: siteId,
        project_id: projectId,
        language: language,
        deployment_method: 'javascript',
        status: 'active'
      }));

      const { error } = await supabase
        .from('translation_deployments')
        .insert(deploymentRecords);

      if (error) throw error;
    } catch (error) {
      console.error('[TranslationPipeline] Error creating deployment record:', error);
    }
  }

  /**
   * Update TM usage statistics
   */
  async updateTMUsage(tmId) {
    try {
      const { error } = await supabase
        .from('translation_memory')
        .update({
          usage_count: supabase.raw('usage_count + 1'),
          last_used_at: new Date().toISOString()
        })
        .eq('id', tmId);

      if (error) throw error;
    } catch (error) {
      console.error('[TranslationPipeline] Error updating TM usage:', error);
    }
  }

  /**
   * Calculate quality score based on confidence
   */
  calculateQualityScore(confidence) {
    if (confidence >= 0.95) return 5;
    if (confidence >= 0.85) return 4;
    if (confidence >= 0.75) return 3;
    if (confidence >= 0.65) return 2;
    return 1;
  }

  /**
   * Delay helper function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get pipeline statistics
   */
  getStats() {
    return {
      queueLength: this.translationQueue.length,
      isProcessing: this.isProcessing,
      batchSize: this.batchSize,
      processingInterval: this.processingInterval,
      tmThreshold: this.tmThreshold
    };
  }

  /**
   * Stop the pipeline
   */
  stop() {
    console.log('[TranslationPipeline] Stopping...');
    this.isProcessing = false;
    this.translationQueue = [];
  }
}

export default TranslationPipeline;