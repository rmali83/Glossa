/**
 * Content Detection Engine - Server-side website monitoring
 * 
 * Automatically monitors websites for content changes and triggers
 * translation pipeline when new or modified content is detected.
 */

import { supabase } from '../lib/supabase';
import { WebsiteScraper } from './websiteScraper';

class ContentDetectionEngine {
  constructor() {
    this.monitoredSites = new Map();
    this.changeQueue = [];
    this.isProcessing = false;
    this.defaultInterval = 300000; // 5 minutes
    this.maxRetries = 3;
    this.webhookEndpoints = new Map();
    
    // Initialize
    this.init();
  }

  /**
   * Initialize the detection engine
   */
  async init() {
    console.log('[ContentDetectionEngine] Initializing...');
    
    // Load monitored sites from database
    await this.loadMonitoredSites();
    
    // Start processing queue
    this.startQueueProcessor();
    
    console.log(`[ContentDetectionEngine] Monitoring ${this.monitoredSites.size} sites`);
  }

  /**
   * Load monitored sites from database
   */
  async loadMonitoredSites() {
    try {
      const { data: sites, error } = await supabase
        .from('automated_sites')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      sites.forEach(site => {
        this.addSiteToMonitoring(site);
      });

    } catch (error) {
      console.error('[ContentDetectionEngine] Error loading sites:', error);
    }
  }

  /**
   * Add a website to monitoring
   */
  async addSiteToMonitoring(siteConfig) {
    const {
      id,
      domain,
      source_language,
      target_languages,
      scan_interval = this.defaultInterval,
      config = {}
    } = siteConfig;

    console.log(`[ContentDetectionEngine] Adding site to monitoring: ${domain}`);

    // Store site configuration
    this.monitoredSites.set(id, {
      ...siteConfig,
      lastScan: null,
      scanCount: 0,
      errorCount: 0,
      status: 'active'
    });

    // Start monitoring interval
    const intervalId = setInterval(async () => {
      await this.scanSite(id);
    }, scan_interval);

    // Store interval ID for cleanup
    this.monitoredSites.get(id).intervalId = intervalId;

    // Perform initial scan
    setTimeout(() => this.scanSite(id), 1000);
  }

  /**
   * Scan a specific site for changes
   */
  async scanSite(siteId) {
    const site = this.monitoredSites.get(siteId);
    if (!site || site.status !== 'active') return;

    console.log(`[ContentDetectionEngine] Scanning site: ${site.domain}`);

    try {
      // Update scan timestamp
      site.lastScan = new Date();
      site.scanCount++;

      // Scrape current content
      const scraper = new WebsiteScraper();
      const currentContent = await scraper.scrapeWebsite(`https://${site.domain}`, site.config);

      if (!currentContent.success) {
        throw new Error(currentContent.error);
      }

      // Get stored content from database
      const storedContent = await this.getStoredContent(siteId);

      // Detect changes
      const changes = this.detectChanges(currentContent.segments, storedContent);

      if (changes.length > 0) {
        console.log(`[ContentDetectionEngine] Found ${changes.length} changes for ${site.domain}`);
        
        // Process changes
        await this.processChanges(siteId, changes);
        
        // Update stored content
        await this.updateStoredContent(siteId, currentContent.segments);
      }

      // Reset error count on successful scan
      site.errorCount = 0;

      // Update database
      await this.updateSiteStatus(siteId, {
        last_scan: site.lastScan,
        status: 'active'
      });

    } catch (error) {
      console.error(`[ContentDetectionEngine] Error scanning ${site.domain}:`, error);
      
      site.errorCount++;
      
      // Disable site if too many errors
      if (site.errorCount >= this.maxRetries) {
        console.warn(`[ContentDetectionEngine] Disabling site ${site.domain} due to repeated errors`);
        await this.disableSite(siteId, error.message);
      }
    }
  }
}
  /**
   * Get stored content from database
   */
  async getStoredContent(siteId) {
    try {
      const { data, error } = await supabase
        .from('content_changes')
        .select('selector, content_hash, content_text')
        .eq('site_id', siteId)
        .eq('status', 'processed')
        .order('detected_at', { ascending: false });

      if (error) throw error;

      const contentMap = new Map();
      data.forEach(item => {
        contentMap.set(item.selector, {
          hash: item.content_hash,
          text: item.content_text
        });
      });

      return contentMap;
    } catch (error) {
      console.error('[ContentDetectionEngine] Error getting stored content:', error);
      return new Map();
    }
  }

  /**
   * Detect changes between current and stored content
   */
  detectChanges(currentSegments, storedContent) {
    const changes = [];

    currentSegments.forEach(segment => {
      const selector = segment.selector || this.generateSelectorFromSegment(segment);
      const currentHash = this.hashContent(segment.source_text);
      const stored = storedContent.get(selector);

      if (!stored) {
        // New content
        changes.push({
          selector,
          type: 'added',
          content: segment.source_text,
          hash: currentHash,
          segment: segment
        });
      } else if (stored.hash !== currentHash) {
        // Modified content
        changes.push({
          selector,
          type: 'modified',
          content: segment.source_text,
          hash: currentHash,
          segment: segment,
          previousContent: stored.text
        });
      }
    });

    // Check for deleted content
    storedContent.forEach((stored, selector) => {
      const exists = currentSegments.some(seg => 
        (seg.selector || this.generateSelectorFromSegment(seg)) === selector
      );
      
      if (!exists) {
        changes.push({
          selector,
          type: 'deleted',
          content: stored.text,
          hash: stored.hash
        });
      }
    });

    return changes;
  }

  /**
   * Process detected changes
   */
  async processChanges(siteId, changes) {
    const site = this.monitoredSites.get(siteId);
    if (!site) return;

    console.log(`[ContentDetectionEngine] Processing ${changes.length} changes for ${site.domain}`);

    // Store changes in database
    const changeRecords = changes.map(change => ({
      site_id: siteId,
      selector: change.selector,
      content_hash: change.hash,
      content_text: change.content,
      change_type: change.type,
      detected_at: new Date().toISOString(),
      status: 'pending'
    }));

    try {
      const { error } = await supabase
        .from('content_changes')
        .insert(changeRecords);

      if (error) throw error;

      // Add to translation queue
      changes.forEach(change => {
        if (change.type !== 'deleted') {
          this.addToTranslationQueue({
            siteId,
            change,
            sourceLanguage: site.source_language,
            targetLanguages: site.target_languages,
            priority: change.type === 'added' ? 'high' : 'normal'
          });
        }
      });

      // Trigger webhook if configured
      if (site.config.webhookUrl) {
        await this.triggerWebhook(site.config.webhookUrl, {
          type: 'content_changes_detected',
          domain: site.domain,
          changes: changes.length,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      console.error('[ContentDetectionEngine] Error processing changes:', error);
    }
  }

  /**
   * Add item to translation queue
   */
  addToTranslationQueue(item) {
    this.changeQueue.push({
      ...item,
      timestamp: Date.now(),
      retries: 0
    });

    console.log(`[ContentDetectionEngine] Added to translation queue: ${item.change.selector}`);
  }

  /**
   * Start queue processor
   */
  startQueueProcessor() {
    setInterval(async () => {
      if (!this.isProcessing && this.changeQueue.length > 0) {
        await this.processTranslationQueue();
      }
    }, 10000); // Process every 10 seconds
  }

  /**
   * Process translation queue
   */
  async processTranslationQueue() {
    if (this.isProcessing || this.changeQueue.length === 0) return;

    this.isProcessing = true;
    console.log(`[ContentDetectionEngine] Processing ${this.changeQueue.length} items in translation queue`);

    try {
      // Process items in batches
      const batchSize = 10;
      while (this.changeQueue.length > 0) {
        const batch = this.changeQueue.splice(0, batchSize);
        await Promise.all(batch.map(item => this.processTranslationItem(item)));
      }
    } catch (error) {
      console.error('[ContentDetectionEngine] Error processing translation queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual translation item
   */
  async processTranslationItem(item) {
    const { siteId, change, sourceLanguage, targetLanguages } = item;

    try {
      // Create translation project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: `Auto: ${change.selector}`,
          source_language: sourceLanguage,
          target_language: targetLanguages.join(', '),
          status: 'auto_processing',
          created_by: null, // System-generated
          automated_site_id: siteId
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create segment
      const { error: segmentError } = await supabase
        .from('segments')
        .insert({
          project_id: project.id,
          segment_number: 1,
          source_text: change.content,
          target_text: '',
          status: 'Draft',
          segment_key: change.selector,
          metadata: {
            selector: change.selector,
            changeType: change.type,
            detectedAt: item.timestamp
          }
        });

      if (segmentError) throw segmentError;

      // Trigger translation pipeline
      await this.triggerTranslationPipeline(project.id, targetLanguages);

      console.log(`[ContentDetectionEngine] Created translation project ${project.id} for ${change.selector}`);

    } catch (error) {
      console.error('[ContentDetectionEngine] Error processing translation item:', error);
      
      // Retry logic
      if (item.retries < this.maxRetries) {
        item.retries++;
        this.changeQueue.push(item);
      }
    }
  }

  /**
   * Trigger translation pipeline
   */
  async triggerTranslationPipeline(projectId, targetLanguages) {
    // This would integrate with your existing translation pipeline
    // For now, we'll just mark it as ready for translation
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'pending' })
        .eq('id', projectId);

      if (error) throw error;

      console.log(`[ContentDetectionEngine] Translation pipeline triggered for project ${projectId}`);
    } catch (error) {
      console.error('[ContentDetectionEngine] Error triggering translation pipeline:', error);
    }
  }

  /**
   * Update stored content in database
   */
  async updateStoredContent(siteId, segments) {
    try {
      // Mark old content as archived
      await supabase
        .from('content_changes')
        .update({ status: 'archived' })
        .eq('site_id', siteId)
        .eq('status', 'processed');

      // Insert new content
      const contentRecords = segments.map(segment => ({
        site_id: siteId,
        selector: segment.selector || this.generateSelectorFromSegment(segment),
        content_hash: this.hashContent(segment.source_text),
        content_text: segment.source_text,
        change_type: 'current',
        detected_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        status: 'processed'
      }));

      const { error } = await supabase
        .from('content_changes')
        .insert(contentRecords);

      if (error) throw error;

    } catch (error) {
      console.error('[ContentDetectionEngine] Error updating stored content:', error);
    }
  }

  /**
   * Generate selector from segment
   */
  generateSelectorFromSegment(segment) {
    if (segment.selector) return segment.selector;
    
    // Generate based on segment metadata
    const { context, type } = segment;
    return `${type || 'text'}:${this.hashContent(segment.source_text)}`;
  }

  /**
   * Hash content for comparison
   */
  hashContent(content) {
    let hash = 0;
    if (content.length === 0) return hash;
    
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * Update site status in database
   */
  async updateSiteStatus(siteId, updates) {
    try {
      const { error } = await supabase
        .from('automated_sites')
        .update(updates)
        .eq('id', siteId);

      if (error) throw error;
    } catch (error) {
      console.error('[ContentDetectionEngine] Error updating site status:', error);
    }
  }

  /**
   * Disable site monitoring
   */
  async disableSite(siteId, reason) {
    const site = this.monitoredSites.get(siteId);
    if (!site) return;

    // Clear interval
    if (site.intervalId) {
      clearInterval(site.intervalId);
    }

    // Update status
    site.status = 'disabled';

    // Update database
    await this.updateSiteStatus(siteId, {
      status: 'disabled',
      config: {
        ...site.config,
        disabledReason: reason,
        disabledAt: new Date().toISOString()
      }
    });

    console.log(`[ContentDetectionEngine] Disabled monitoring for ${site.domain}: ${reason}`);
  }

  /**
   * Trigger webhook
   */
  async triggerWebhook(webhookUrl, data) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Glossa-ContentDetectionEngine/1.0'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log(`[ContentDetectionEngine] Webhook triggered successfully: ${webhookUrl}`);
    } catch (error) {
      console.error('[ContentDetectionEngine] Webhook error:', error);
    }
  }

  /**
   * Remove site from monitoring
   */
  removeSiteFromMonitoring(siteId) {
    const site = this.monitoredSites.get(siteId);
    if (site && site.intervalId) {
      clearInterval(site.intervalId);
    }
    
    this.monitoredSites.delete(siteId);
    console.log(`[ContentDetectionEngine] Removed site from monitoring: ${siteId}`);
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      monitoredSites: this.monitoredSites.size,
      queueLength: this.changeQueue.length,
      isProcessing: this.isProcessing,
      activeSites: Array.from(this.monitoredSites.values()).filter(s => s.status === 'active').length
    };
  }

  /**
   * Cleanup and stop monitoring
   */
  stop() {
    console.log('[ContentDetectionEngine] Stopping...');
    
    // Clear all intervals
    this.monitoredSites.forEach(site => {
      if (site.intervalId) {
        clearInterval(site.intervalId);
      }
    });
    
    this.monitoredSites.clear();
    this.changeQueue = [];
    this.isProcessing = false;
    
    console.log('[ContentDetectionEngine] Stopped');
  }
}

export default ContentDetectionEngine;