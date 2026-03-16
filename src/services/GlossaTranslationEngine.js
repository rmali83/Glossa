/**
 * Glossa Translation Engine - Client-side automatic translation
 * 
 * This script is injected into websites to provide real-time translation
 * capabilities similar to Weglot. It automatically detects and translates
 * all text content without manual intervention.
 */

class GlossaTranslationEngine {
  constructor(config = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || 'https://api.glossa.com',
      siteId: config.siteId,
      sourceLanguage: config.sourceLanguage || 'en',
      targetLanguages: config.targetLanguages || ['es', 'fr', 'de'],
      currentLanguage: config.currentLanguage || this.detectLanguageFromURL(),
      urlStructure: config.urlStructure || 'subdirectory', // 'subdirectory' or 'subdomain'
      autoDetect: config.autoDetect !== false,
      cacheEnabled: config.cacheEnabled !== false,
      debugMode: config.debugMode || false,
      excludeSelectors: [
        '.no-translate',
        '[data-no-translate]',
        'code',
        'pre',
        'script',
        'style',
        'noscript',
        '.glossa-exclude',
        ...config.excludeSelectors || []
      ],
      ...config
    };

    // State management
    this.translations = new Map(); // sourceText -> { [lang]: translation }
    this.textNodes = new WeakMap(); // DOM node -> metadata
    this.observer = null;
    this.isInitialized = false;
    this.isTranslating = false;
    
    // Performance optimization
    this.debounceTimer = null;
    this.translationQueue = [];
    this.cache = this.cacheEnabled ? this.loadCache() : new Map();
    
    // Language switcher
    this.languageSwitcher = null;
    
    // Initialize
    this.init();
  }

  /**
   * Initialize the translation engine
   */
  async init() {
    if (this.isInitialized) return;
    
    this.log('Initializing Glossa Translation Engine...');
    
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Load translations from API
      await this.loadTranslations();
      
      // Scan and translate existing content
      await this.scanAndTranslate();
      
      // Start monitoring for dynamic content
      this.startMonitoring();
      
      // Setup language switcher
      this.setupLanguageSwitcher();
      
      // Setup URL handling
      this.setupURLHandling();
      
      // Apply current language
      if (this.currentLanguage !== this.config.sourceLanguage) {
        await this.switchLanguage(this.currentLanguage);
      }
      
      this.isInitialized = true;
      this.log('Translation engine initialized successfully');
      
      // Dispatch ready event
      this.dispatchEvent('glossa:ready', {
        sourceLanguage: this.config.sourceLanguage,
        currentLanguage: this.currentLanguage,
        availableLanguages: this.config.targetLanguages
      });
      
    } catch (error) {
      console.error('[GlossaTranslationEngine] Initialization error:', error);
    }
  }

  /**
   * Load translations from API
   */
  async loadTranslations() {
    if (!this.config.siteId) {
      this.log('No site ID provided, skipping API load');
      return;
    }

    try {
      const response = await fetch(`${this.config.apiEndpoint}/translations/${this.config.siteId}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GlossaTranslationEngine/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Load translations into memory
      if (data.translations) {
        Object.entries(data.translations).forEach(([sourceText, translations]) => {
          this.translations.set(sourceText, translations);
        });
      }

      this.log(`Loaded ${this.translations.size} translations from API`);
      
    } catch (error) {
      this.log('Failed to load translations from API:', error);
      // Continue with cached translations if available
    }
  }

  /**
   * Scan and translate all text content
   */
  async scanAndTranslate() {
    this.log('Scanning page for translatable content...');
    
    const startTime = performance.now();
    
    // Scan text nodes
    const textNodes = this.getAllTextNodes();
    this.log(`Found ${textNodes.length} text nodes`);
    
    // Scan meta tags
    this.scanMetaTags();
    
    // Scan form elements
    this.scanFormElements();
    
    // Scan image alt text
    this.scanImageAltText();
    
    const endTime = performance.now();
    this.log(`Scan completed in ${(endTime - startTime).toFixed(2)}ms`);
  }

  /**
   * Get all translatable text nodes
   */
  getAllTextNodes() {
    const walker = document.createTreeWalker(
      document.body || document.documentElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => this.shouldTranslateTextNode(node)
      },
      false
    );

    const textNodes = [];
    let node;
    
    while (node = walker.nextNode()) {
      textNodes.push(node);
      this.processTextNode(node);
    }

    return textNodes;
  }

  /**
   * Check if text node should be translated
   */
  shouldTranslateTextNode(node) {
    const text = node.textContent.trim();
    
    // Skip empty or very short text
    if (!text || text.length < 2) {
      return NodeFilter.FILTER_REJECT;
    }

    // Skip if parent element should be excluded
    const parent = node.parentElement;
    if (!parent || this.shouldExcludeElement(parent)) {
      return NodeFilter.FILTER_REJECT;
    }

    // Skip if text contains only numbers, symbols, or whitespace
    if (!/[a-zA-Z\u00C0-\u017F\u0400-\u04FF\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      return NodeFilter.FILTER_REJECT;
    }

    return NodeFilter.FILTER_ACCEPT;
  }

  /**
   * Check if element should be excluded
   */
  shouldExcludeElement(element) {
    if (!element || !element.tagName) return true;

    // Check tag exclusions
    const excludedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE'];
    if (excludedTags.includes(element.tagName)) {
      return true;
    }

    // Check CSS selectors
    for (const selector of this.config.excludeSelectors) {
      try {
        if (element.matches && element.matches(selector)) {
          return true;
        }
      } catch (e) {
        continue;
      }
    }

    // Check if element is hidden
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return true;
    }

    return false;
  }

  /**
   * Process individual text node
   */
  processTextNode(node) {
    const text = node.textContent.trim();
    if (!text) return;

    // Store original text and metadata
    this.textNodes.set(node, {
      originalText: text,
      translated: false,
      selector: this.generateSelector(node.parentElement)
    });

    // Add to translations map if not exists
    if (!this.translations.has(text)) {
      this.translations.set(text, {});
      
      // Queue for translation if auto-detect is enabled
      if (this.config.autoDetect) {
        this.queueForTranslation(text);
      }
    }
  }

  /**
   * Scan meta tags for SEO content
   */
  scanMetaTags() {
    const metaSelectors = [
      { selector: 'title', key: 'page_title' },
      { selector: 'meta[name="description"]', attr: 'content', key: 'meta_description' },
      { selector: 'meta[property="og:title"]', attr: 'content', key: 'og_title' },
      { selector: 'meta[property="og:description"]', attr: 'content', key: 'og_description' }
    ];

    metaSelectors.forEach(({ selector, attr, key }) => {
      const element = document.querySelector(selector);
      if (element && !this.shouldExcludeElement(element)) {
        const text = attr ? element.getAttribute(attr) : element.textContent;
        if (text && text.trim().length > 2) {
          this.processMetaElement(element, text, attr, key);
        }
      }
    });
  }

  /**
   * Process meta element
   */
  processMetaElement(element, text, attribute, key) {
    // Store metadata
    this.textNodes.set(element, {
      originalText: text,
      translated: false,
      attribute: attribute,
      key: key,
      type: 'meta'
    });

    // Add to translations
    if (!this.translations.has(text)) {
      this.translations.set(text, {});
      
      if (this.config.autoDetect) {
        this.queueForTranslation(text);
      }
    }
  }

  /**
   * Scan form elements
   */
  scanFormElements() {
    const formSelectors = [
      { selector: 'input[placeholder]', attr: 'placeholder' },
      { selector: 'textarea[placeholder]', attr: 'placeholder' },
      { selector: 'input[type="submit"]', attr: 'value' },
      { selector: 'input[type="button"]', attr: 'value' }
    ];

    formSelectors.forEach(({ selector, attr }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!this.shouldExcludeElement(element)) {
          const text = element.getAttribute(attr);
          if (text && text.trim().length > 2) {
            this.processFormElement(element, text, attr);
          }
        }
      });
    });
  }

  /**
   * Process form element
   */
  processFormElement(element, text, attribute) {
    this.textNodes.set(element, {
      originalText: text,
      translated: false,
      attribute: attribute,
      type: 'form'
    });

    if (!this.translations.has(text)) {
      this.translations.set(text, {});
      
      if (this.config.autoDetect) {
        this.queueForTranslation(text);
      }
    }
  }

  /**
   * Scan image alt text
   */
  scanImageAltText() {
    const images = document.querySelectorAll('img[alt]');
    images.forEach(img => {
      if (!this.shouldExcludeElement(img)) {
        const altText = img.getAttribute('alt').trim();
        if (altText && altText.length > 2) {
          this.processImageElement(img, altText);
        }
      }
    });
  }

  /**
   * Process image element
   */
  processImageElement(element, text) {
    this.textNodes.set(element, {
      originalText: text,
      translated: false,
      attribute: 'alt',
      type: 'image'
    });

    if (!this.translations.has(text)) {
      this.translations.set(text, {});
      
      if (this.config.autoDetect) {
        this.queueForTranslation(text);
      }
    }
  }

  /**
   * Start monitoring for dynamic content
   */
  startMonitoring() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['alt', 'title', 'placeholder', 'value']
    });

    this.log('Started monitoring for dynamic content');
  }

  /**
   * Handle DOM mutations
   */
  handleMutations(mutations) {
    clearTimeout(this.debounceTimer);
    
    this.debounceTimer = setTimeout(() => {
      const nodesToProcess = new Set();
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
              if (this.shouldTranslateTextNode(node) === NodeFilter.FILTER_ACCEPT) {
                nodesToProcess.add(node);
              }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              // Find text nodes in added element
              const walker = document.createTreeWalker(
                node,
                NodeFilter.SHOW_TEXT,
                { acceptNode: (n) => this.shouldTranslateTextNode(n) },
                false
              );
              
              let textNode;
              while (textNode = walker.nextNode()) {
                nodesToProcess.add(textNode);
              }
            }
          });
        } else if (mutation.type === 'characterData') {
          if (this.shouldTranslateTextNode(mutation.target) === NodeFilter.FILTER_ACCEPT) {
            nodesToProcess.add(mutation.target);
          }
        }
      });

      // Process new nodes
      nodesToProcess.forEach(node => {
        if (node.parentNode) { // Ensure node is still in DOM
          this.processTextNode(node);
          
          // Translate immediately if not in source language
          if (this.currentLanguage !== this.config.sourceLanguage) {
            this.translateNode(node, this.currentLanguage);
          }
        }
      });
      
    }, 300); // Debounce delay
  }
}
  /**
   * Switch to different language
   */
  async switchLanguage(language) {
    if (language === this.currentLanguage) return;
    
    this.log(`Switching to language: ${language}`);
    this.isTranslating = true;
    
    try {
      const previousLanguage = this.currentLanguage;
      this.currentLanguage = language;
      
      if (language === this.config.sourceLanguage) {
        // Switch back to original language
        this.restoreOriginalText();
      } else {
        // Translate to target language
        await this.translateAllContent(language);
      }
      
      // Update URL
      this.updateURL(language);
      
      // Update language switcher
      this.updateLanguageSwitcher(language);
      
      // Save preference
      this.saveLanguagePreference(language);
      
      // Dispatch language change event
      this.dispatchEvent('glossa:languageChanged', {
        from: previousLanguage,
        to: language
      });
      
      this.log(`Language switched to: ${language}`);
      
    } catch (error) {
      console.error('[GlossaTranslationEngine] Error switching language:', error);
    } finally {
      this.isTranslating = false;
    }
  }

  /**
   * Translate all content to target language
   */
  async translateAllContent(language) {
    const startTime = performance.now();
    let translatedCount = 0;
    
    // Translate text nodes
    this.textNodes.forEach((metadata, node) => {
      if (this.translateNode(node, language)) {
        translatedCount++;
      }
    });
    
    const endTime = performance.now();
    this.log(`Translated ${translatedCount} elements in ${(endTime - startTime).toFixed(2)}ms`);
  }

  /**
   * Translate individual node
   */
  translateNode(node, language) {
    const metadata = this.textNodes.get(node);
    if (!metadata) return false;
    
    const { originalText, attribute, type } = metadata;
    const translation = this.getTranslation(originalText, language);
    
    if (!translation) {
      // Queue for translation if not available
      this.queueForTranslation(originalText);
      return false;
    }
    
    try {
      if (attribute) {
        // Update attribute (alt, placeholder, etc.)
        node.setAttribute(attribute, translation);
      } else if (type === 'meta') {
        // Update meta content
        if (node.tagName === 'TITLE') {
          node.textContent = translation;
        } else {
          node.setAttribute('content', translation);
        }
      } else {
        // Update text content
        node.textContent = translation;
      }
      
      metadata.translated = true;
      return true;
      
    } catch (error) {
      this.log('Error translating node:', error);
      return false;
    }
  }

  /**
   * Restore original text
   */
  restoreOriginalText() {
    this.textNodes.forEach((metadata, node) => {
      if (metadata.translated) {
        const { originalText, attribute, type } = metadata;
        
        try {
          if (attribute) {
            node.setAttribute(attribute, originalText);
          } else if (type === 'meta') {
            if (node.tagName === 'TITLE') {
              node.textContent = originalText;
            } else {
              node.setAttribute('content', originalText);
            }
          } else {
            node.textContent = originalText;
          }
          
          metadata.translated = false;
          
        } catch (error) {
          this.log('Error restoring original text:', error);
        }
      }
    });
  }

  /**
   * Get translation for text
   */
  getTranslation(text, language) {
    const translations = this.translations.get(text);
    return translations ? translations[language] : null;
  }

  /**
   * Queue text for translation
   */
  queueForTranslation(text) {
    if (!this.translationQueue.includes(text)) {
      this.translationQueue.push(text);
      
      // Process queue periodically
      setTimeout(() => this.processTranslationQueue(), 1000);
    }
  }

  /**
   * Process translation queue
   */
  async processTranslationQueue() {
    if (this.translationQueue.length === 0 || !this.config.siteId) return;
    
    const textsToTranslate = this.translationQueue.splice(0, 20); // Process in batches
    
    try {
      const response = await fetch(`${this.config.apiEndpoint}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          siteId: this.config.siteId,
          texts: textsToTranslate,
          sourceLanguage: this.config.sourceLanguage,
          targetLanguages: this.config.targetLanguages
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update translations
        Object.entries(data.translations || {}).forEach(([text, translations]) => {
          this.translations.set(text, { ...this.translations.get(text), ...translations });
        });
        
        // Save to cache
        if (this.cacheEnabled) {
          this.saveCache();
        }
        
        // Re-translate current page if needed
        if (this.currentLanguage !== this.config.sourceLanguage) {
          this.translateAllContent(this.currentLanguage);
        }
      }
      
    } catch (error) {
      this.log('Error processing translation queue:', error);
    }
  }

  /**
   * Setup language switcher
   */
  setupLanguageSwitcher() {
    // Look for existing language switcher
    let switcher = document.querySelector('[data-glossa-language-switcher]');
    
    if (!switcher) {
      // Create default language switcher
      switcher = this.createLanguageSwitcher();
    }
    
    this.languageSwitcher = switcher;
    this.bindLanguageSwitcherEvents();
  }

  /**
   * Create default language switcher
   */
  createLanguageSwitcher() {
    const switcher = document.createElement('div');
    switcher.id = 'glossa-language-switcher';
    switcher.setAttribute('data-glossa-language-switcher', 'true');
    
    // Styling
    switcher.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      min-width: 120px;
    `;

    // Create language buttons
    const languages = [this.config.sourceLanguage, ...this.config.targetLanguages];
    const languageNames = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'ru': 'Русский',
      'ja': '日本語',
      'ko': '한국어',
      'zh': '中文'
    };

    languages.forEach(lang => {
      const button = document.createElement('button');
      button.textContent = languageNames[lang] || lang.toUpperCase();
      button.setAttribute('data-language', lang);
      button.style.cssText = `
        display: block;
        width: 100%;
        margin: 4px 0;
        padding: 8px 12px;
        border: 1px solid #e0e0e0;
        background: ${lang === this.currentLanguage ? '#007cba' : '#f9f9f9'};
        color: ${lang === this.currentLanguage ? '#fff' : '#333'};
        cursor: pointer;
        border-radius: 4px;
        font-size: 13px;
        transition: all 0.2s ease;
      `;
      
      button.addEventListener('mouseenter', () => {
        if (lang !== this.currentLanguage) {
          button.style.background = '#e9e9e9';
        }
      });
      
      button.addEventListener('mouseleave', () => {
        if (lang !== this.currentLanguage) {
          button.style.background = '#f9f9f9';
        }
      });
      
      switcher.appendChild(button);
    });

    document.body.appendChild(switcher);
    return switcher;
  }

  /**
   * Bind language switcher events
   */
  bindLanguageSwitcherEvents() {
    if (!this.languageSwitcher) return;
    
    this.languageSwitcher.addEventListener('click', (e) => {
      const button = e.target.closest('[data-language]');
      if (button) {
        const language = button.getAttribute('data-language');
        this.switchLanguage(language);
      }
    });
  }

  /**
   * Update language switcher active state
   */
  updateLanguageSwitcher(activeLanguage) {
    if (!this.languageSwitcher) return;
    
    const buttons = this.languageSwitcher.querySelectorAll('[data-language]');
    buttons.forEach(button => {
      const lang = button.getAttribute('data-language');
      const isActive = lang === activeLanguage;
      
      button.style.background = isActive ? '#007cba' : '#f9f9f9';
      button.style.color = isActive ? '#fff' : '#333';
    });
  }

  /**
   * Setup URL handling
   */
  setupURLHandling() {
    // Handle browser back/forward
    window.addEventListener('popstate', (event) => {
      const language = this.detectLanguageFromURL();
      if (language !== this.currentLanguage) {
        this.switchLanguage(language);
      }
    });
  }

  /**
   * Detect language from URL
   */
  detectLanguageFromURL() {
    const path = window.location.pathname;
    const langCodes = [this.config.sourceLanguage, ...this.config.targetLanguages];
    
    if (this.config.urlStructure === 'subdirectory') {
      const pathParts = path.split('/').filter(p => p);
      if (pathParts.length > 0 && langCodes.includes(pathParts[0])) {
        return pathParts[0];
      }
    } else if (this.config.urlStructure === 'subdomain') {
      const subdomain = window.location.hostname.split('.')[0];
      if (langCodes.includes(subdomain)) {
        return subdomain;
      }
    }
    
    return this.config.sourceLanguage;
  }

  /**
   * Update URL for language
   */
  updateURL(language) {
    const currentUrl = new URL(window.location.href);
    
    if (this.config.urlStructure === 'subdirectory') {
      const pathParts = currentUrl.pathname.split('/').filter(p => p);
      const langCodes = [this.config.sourceLanguage, ...this.config.targetLanguages];
      
      // Remove existing language code
      if (pathParts.length > 0 && langCodes.includes(pathParts[0])) {
        pathParts.shift();
      }
      
      // Add new language code (except for source language)
      if (language !== this.config.sourceLanguage) {
        pathParts.unshift(language);
      }
      
      const newPath = '/' + pathParts.join('/');
      if (newPath !== currentUrl.pathname) {
        history.pushState({ language }, '', newPath + currentUrl.search + currentUrl.hash);
      }
    }
    // Note: Subdomain URL structure would require server-side handling
  }

  /**
   * Generate CSS selector for element
   */
  generateSelector(element) {
    if (!element || !element.tagName) return '';

    const path = [];
    let current = element;

    while (current && current.tagName && path.length < 5) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      }
      
      if (current.className) {
        const classes = current.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          selector += `.${classes.slice(0, 2).join('.')}`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * Load cache from localStorage
   */
  loadCache() {
    try {
      const cached = localStorage.getItem(`glossa_cache_${this.config.siteId}`);
      return cached ? new Map(JSON.parse(cached)) : new Map();
    } catch (error) {
      this.log('Error loading cache:', error);
      return new Map();
    }
  }

  /**
   * Save cache to localStorage
   */
  saveCache() {
    try {
      const cacheData = Array.from(this.translations.entries());
      localStorage.setItem(`glossa_cache_${this.config.siteId}`, JSON.stringify(cacheData));
    } catch (error) {
      this.log('Error saving cache:', error);
    }
  }

  /**
   * Save language preference
   */
  saveLanguagePreference(language) {
    try {
      localStorage.setItem('glossa_preferred_language', language);
    } catch (error) {
      this.log('Error saving language preference:', error);
    }
  }

  /**
   * Get saved language preference
   */
  getSavedLanguagePreference() {
    try {
      return localStorage.getItem('glossa_preferred_language');
    } catch (error) {
      return null;
    }
  }

  /**
   * Dispatch custom event
   */
  dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }

  /**
   * Log message (only in debug mode)
   */
  log(...args) {
    if (this.config.debugMode) {
      console.log('[GlossaTranslationEngine]', ...args);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalStrings: this.translations.size,
      translatedNodes: Array.from(this.textNodes.values()).filter(m => m.translated).length,
      totalNodes: this.textNodes.size,
      currentLanguage: this.currentLanguage,
      queueLength: this.translationQueue.length,
      isTranslating: this.isTranslating,
      cacheSize: this.cache.size
    };
  }

  /**
   * Destroy the translation engine
   */
  destroy() {
    this.log('Destroying translation engine...');
    
    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Clear timers
    clearTimeout(this.debounceTimer);
    
    // Restore original text
    this.restoreOriginalText();
    
    // Remove language switcher if we created it
    if (this.languageSwitcher && this.languageSwitcher.id === 'glossa-language-switcher') {
      this.languageSwitcher.remove();
    }
    
    // Clear state
    this.translations.clear();
    this.translationQueue = [];
    this.isInitialized = false;
    
    this.log('Translation engine destroyed');
  }
}

// Auto-initialize if config is provided
if (typeof window !== 'undefined' && window.GlossaConfig) {
  window.GlossaTranslator = new GlossaTranslationEngine(window.GlossaConfig);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GlossaTranslationEngine;
} else if (typeof window !== 'undefined') {
  window.GlossaTranslationEngine = GlossaTranslationEngine;
}

export default GlossaTranslationEngine;