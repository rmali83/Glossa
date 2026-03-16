/**
 * Global DOM Scanner - High-performance text detection and translation
 * 
 * Automatically detects all visible text nodes across every page of the website
 * using MutationObserver for real-time monitoring without manual tagging.
 */

class GlobalDOMScanner {
  constructor(config = {}) {
    this.config = {
      excludeSelectors: [
        '.no-translate',
        '[data-no-translate]',
        'code',
        'pre',
        '.code-block',
        'script',
        'style',
        'noscript',
        '[contenteditable="false"]',
        '.glossa-exclude',
        ...config.excludeSelectors || []
      ],
      excludeClasses: [
        'no-translate',
        'glossa-exclude',
        'code-block',
        'syntax-highlight',
        ...config.excludeClasses || []
      ],
      excludeAttributes: [
        'data-no-translate',
        'data-glossa-exclude',
        ...config.excludeAttributes || []
      ],
      minTextLength: config.minTextLength || 2,
      maxTextLength: config.maxTextLength || 5000,
      debounceDelay: config.debounceDelay || 300,
      batchSize: config.batchSize || 50,
      ...config
    };

    // State management
    this.stringMap = new Map(); // sourceText -> { translations: {lang: text}, metadata: {} }
    this.textNodes = new WeakMap(); // DOM node -> metadata
    this.observer = null;
    this.isScanning = false;
    this.pendingTranslations = new Set();
    
    // Performance optimization
    this.debounceTimer = null;
    this.translationQueue = [];
    this.processedHashes = new Set();
    
    // Event system
    this.listeners = new Map();
    
    // Initialize
    this.init();
  }

  /**
   * Initialize the scanner
   */
  init() {
    console.log('[GlobalDOMScanner] Initializing...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }

  /**
   * Start scanning and monitoring
   */
  start() {
    console.log('[GlobalDOMScanner] Starting scan...');
    
    // Initial scan
    this.scanAllTextNodes();
    
    // Start real-time monitoring
    this.startMonitoring();
    
    // Setup language switcher
    this.setupLanguageSwitcher();
    
    console.log('[GlobalDOMScanner] Scanner active');
  }

  /**
   * Scan all existing text nodes in the document
   */
  scanAllTextNodes() {
    this.isScanning = true;
    const startTime = performance.now();
    
    try {
      // Create tree walker for text nodes
      const walker = document.createTreeWalker(
        document.body || document.documentElement,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => this.textNodeFilter(node)
        },
        false
      );

      const textNodes = [];
      let node;
      
      // Collect all text nodes
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }

      console.log(`[GlobalDOMScanner] Found ${textNodes.length} text nodes`);

      // Process text nodes in batches
      this.processTextNodesBatch(textNodes);
      
      // Scan meta tags and attributes
      this.scanMetaTags();
      this.scanFormElements();
      this.scanImageAltText();
      
      const endTime = performance.now();
      console.log(`[GlobalDOMScanner] Initial scan completed in ${(endTime - startTime).toFixed(2)}ms`);
      
    } catch (error) {
      console.error('[GlobalDOMScanner] Error during initial scan:', error);
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Filter function for text nodes
   */
  textNodeFilter(node) {
    // Skip empty or whitespace-only nodes
    const text = node.textContent.trim();
    if (!text || text.length < this.config.minTextLength) {
      return NodeFilter.FILTER_REJECT;
    }

    // Skip if text is too long (likely not user content)
    if (text.length > this.config.maxTextLength) {
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
   * Check if element should be excluded from translation
   */
  shouldExcludeElement(element) {
    if (!element || !element.tagName) return true;

    // Check tag name exclusions
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
        // Invalid selector, skip
        continue;
      }
    }

    // Check classes
    if (element.classList) {
      for (const className of this.config.excludeClasses) {
        if (element.classList.contains(className)) {
          return true;
        }
      }
    }

    // Check attributes
    for (const attr of this.config.excludeAttributes) {
      if (element.hasAttribute(attr)) {
        return true;
      }
    }

    // Check if element is hidden
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return true;
    }

    return false;
  }

  /**
   * Process text nodes in batches for performance
   */
  processTextNodesBatch(textNodes) {
    const batchSize = this.config.batchSize;
    
    for (let i = 0; i < textNodes.length; i += batchSize) {
      const batch = textNodes.slice(i, i + batchSize);
      
      // Process batch asynchronously to avoid blocking UI
      setTimeout(() => {
        batch.forEach(node => this.processTextNode(node));
      }, 0);
    }
  }

  /**
   * Process individual text node
   */
  processTextNode(node) {
    const text = node.textContent.trim();
    if (!text) return;

    // Generate unique hash for this text
    const textHash = this.hashString(text);
    
    // Skip if already processed
    if (this.processedHashes.has(textHash)) {
      return;
    }
    
    this.processedHashes.add(textHash);

    // Store node metadata
    const metadata = {
      originalText: text,
      hash: textHash,
      selector: this.generateSelector(node.parentElement),
      context: this.extractContext(node),
      timestamp: Date.now()
    };

    this.textNodes.set(node, metadata);

    // Add to string map
    if (!this.stringMap.has(text)) {
      this.stringMap.set(text, {
        translations: {},
        metadata: metadata,
        nodes: new Set([node])
      });
    } else {
      this.stringMap.get(text).nodes.add(node);
    }

    // Emit event for new text discovered
    this.emit('textDiscovered', { text, node, metadata });
  }

  /**
   * Start real-time monitoring with MutationObserver
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
      attributeFilter: ['alt', 'title', 'placeholder', 'aria-label', 'data-original-title']
    });

    console.log('[GlobalDOMScanner] Real-time monitoring started');
  }

  /**
   * Handle DOM mutations
   */
  handleMutations(mutations) {
    // Debounce mutations to avoid excessive processing
    clearTimeout(this.debounceTimer);
    
    this.debounceTimer = setTimeout(() => {
      const nodesToProcess = new Set();
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          // Handle added nodes
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
              nodesToProcess.add(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              // Find text nodes in added element
              const walker = document.createTreeWalker(
                node,
                NodeFilter.SHOW_TEXT,
                { acceptNode: (n) => this.textNodeFilter(n) },
                false
              );
              
              let textNode;
              while (textNode = walker.nextNode()) {
                nodesToProcess.add(textNode);
              }
            }
          });
        } else if (mutation.type === 'characterData') {
          // Handle text content changes
          nodesToProcess.add(mutation.target);
        } else if (mutation.type === 'attributes') {
          // Handle attribute changes (alt, title, etc.)
          this.handleAttributeChange(mutation.target, mutation.attributeName);
        }
      });

      // Process discovered nodes
      nodesToProcess.forEach(node => {
        if (node.parentNode) { // Ensure node is still in DOM
          this.processTextNode(node);
        }
      });

      if (nodesToProcess.size > 0) {
        this.emit('contentChanged', { nodesCount: nodesToProcess.size });
      }
      
    }, this.config.debounceDelay);
  }

  /**
   * Handle attribute changes (alt, title, placeholder, etc.)
   */
  handleAttributeChange(element, attributeName) {
    const translatableAttributes = ['alt', 'title', 'placeholder', 'aria-label', 'data-original-title'];
    
    if (translatableAttributes.includes(attributeName)) {
      const value = element.getAttribute(attributeName);
      if (value && value.trim().length >= this.config.minTextLength) {
        const metadata = {
          originalText: value,
          hash: this.hashString(value),
          selector: this.generateSelector(element),
          attribute: attributeName,
          context: 'attribute',
          timestamp: Date.now()
        };

        this.emit('attributeTextDiscovered', { text: value, element, metadata });
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
      { selector: 'meta[name="keywords"]', attr: 'content', key: 'meta_keywords' },
      { selector: 'meta[property="og:title"]', attr: 'content', key: 'og_title' },
      { selector: 'meta[property="og:description"]', attr: 'content', key: 'og_description' },
      { selector: 'meta[name="twitter:title"]', attr: 'content', key: 'twitter_title' },
      { selector: 'meta[name="twitter:description"]', attr: 'content', key: 'twitter_description' }
    ];

    metaSelectors.forEach(({ selector, attr, key }) => {
      const element = document.querySelector(selector);
      if (element) {
        const text = attr ? element.getAttribute(attr) : element.textContent;
        if (text && text.trim().length >= this.config.minTextLength) {
          const metadata = {
            originalText: text,
            hash: this.hashString(text),
            selector: selector,
            attribute: attr,
            key: key,
            context: 'meta',
            timestamp: Date.now()
          };

          this.emit('metaTextDiscovered', { text, element, metadata });
        }
      }
    });
  }

  /**
   * Scan form elements (labels, placeholders, buttons)
   */
  scanFormElements() {
    const formSelectors = [
      { selector: 'input[placeholder]', attr: 'placeholder' },
      { selector: 'textarea[placeholder]', attr: 'placeholder' },
      { selector: 'input[type="submit"]', attr: 'value' },
      { selector: 'input[type="button"]', attr: 'value' },
      { selector: 'button', text: true },
      { selector: 'label', text: true }
    ];

    formSelectors.forEach(({ selector, attr, text }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (this.shouldExcludeElement(element)) return;

        const textContent = text ? element.textContent.trim() : element.getAttribute(attr);
        if (textContent && textContent.length >= this.config.minTextLength) {
          const metadata = {
            originalText: textContent,
            hash: this.hashString(textContent),
            selector: this.generateSelector(element),
            attribute: attr,
            context: 'form',
            timestamp: Date.now()
          };

          this.emit('formTextDiscovered', { text: textContent, element, metadata });
        }
      });
    });
  }

  /**
   * Scan image alt text
   */
  scanImageAltText() {
    const images = document.querySelectorAll('img[alt]');
    images.forEach(img => {
      if (this.shouldExcludeElement(img)) return;

      const altText = img.getAttribute('alt').trim();
      if (altText && altText.length >= this.config.minTextLength) {
        const metadata = {
          originalText: altText,
          hash: this.hashString(altText),
          selector: this.generateSelector(img),
          attribute: 'alt',
          context: 'image',
          timestamp: Date.now()
        };

        this.emit('imageTextDiscovered', { text: altText, element: img, metadata });
      }
    });
  }

  /**
   * Generate CSS selector for element
   */
  generateSelector(element) {
    if (!element || !element.tagName) return '';

    const path = [];
    let current = element;

    while (current && current.tagName) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      }
      
      if (current.className) {
        const classes = current.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`;
        }
      }
      
      // Add nth-child if needed for uniqueness
      const siblings = Array.from(current.parentNode?.children || []);
      const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);
      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
      
      path.unshift(selector);
      current = current.parentElement;
      
      // Limit depth to avoid overly long selectors
      if (path.length >= 5) break;
    }

    return path.join(' > ');
  }

  /**
   * Extract context information for better translation
   */
  extractContext(node) {
    const parent = node.parentElement;
    if (!parent) return {};

    return {
      tagName: parent.tagName.toLowerCase(),
      className: parent.className,
      id: parent.id,
      role: parent.getAttribute('role'),
      ariaLabel: parent.getAttribute('aria-label'),
      dataContext: parent.getAttribute('data-context'),
      nearbyText: this.getNearbyText(node)
    };
  }

  /**
   * Get nearby text for context
   */
  getNearbyText(node, radius = 50) {
    const parent = node.parentElement;
    if (!parent) return '';

    const allText = parent.textContent.trim();
    const nodeText = node.textContent.trim();
    const nodeIndex = allText.indexOf(nodeText);
    
    if (nodeIndex === -1) return '';

    const start = Math.max(0, nodeIndex - radius);
    const end = Math.min(allText.length, nodeIndex + nodeText.length + radius);
    
    return allText.substring(start, end);
  }

  /**
   * Setup language switcher functionality
   */
  setupLanguageSwitcher() {
    // Look for existing language switcher elements
    const languageSwitchers = document.querySelectorAll('[data-glossa-language-switcher]');
    
    languageSwitchers.forEach(switcher => {
      switcher.addEventListener('click', (e) => {
        const language = e.target.getAttribute('data-language') || 
                        e.target.getAttribute('data-lang') ||
                        e.target.textContent.trim().toLowerCase();
        
        if (language) {
          this.switchLanguage(language);
        }
      });
    });

    // Create default language switcher if none exists
    if (languageSwitchers.length === 0) {
      this.createDefaultLanguageSwitcher();
    }
  }

  /**
   * Create default language switcher
   */
  createDefaultLanguageSwitcher() {
    const switcher = document.createElement('div');
    switcher.id = 'glossa-language-switcher';
    switcher.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;

    const languages = ['en', 'es', 'fr', 'de', 'it']; // Default languages
    languages.forEach(lang => {
      const button = document.createElement('button');
      button.textContent = lang.toUpperCase();
      button.setAttribute('data-language', lang);
      button.style.cssText = `
        margin: 0 5px;
        padding: 5px 10px;
        border: 1px solid #ccc;
        background: #f9f9f9;
        cursor: pointer;
        border-radius: 3px;
      `;
      
      button.addEventListener('click', () => this.switchLanguage(lang));
      switcher.appendChild(button);
    });

    document.body.appendChild(switcher);
  }

  /**
   * Switch to different language
   */
  switchLanguage(language) {
    console.log(`[GlobalDOMScanner] Switching to language: ${language}`);
    
    this.currentLanguage = language;
    
    // Apply translations to all discovered text
    this.applyTranslations(language);
    
    // Update URL if needed
    this.updateURL(language);
    
    // Emit language change event
    this.emit('languageChanged', { language });
  }

  /**
   * Apply translations for given language
   */
  applyTranslations(language) {
    this.stringMap.forEach((data, sourceText) => {
      const translation = data.translations[language];
      if (translation) {
        // Apply to all nodes with this text
        data.nodes.forEach(node => {
          if (node.parentNode) { // Ensure node is still in DOM
            node.textContent = translation;
          }
        });
      }
    });
  }

  /**
   * Update URL for language
   */
  updateURL(language) {
    const currentUrl = new URL(window.location.href);
    
    // Simple subdirectory approach
    const pathParts = currentUrl.pathname.split('/').filter(p => p);
    const langCodes = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
    
    // Remove existing language code
    if (langCodes.includes(pathParts[0])) {
      pathParts.shift();
    }
    
    // Add new language code (except for default language 'en')
    if (language !== 'en') {
      pathParts.unshift(language);
    }
    
    const newPath = '/' + pathParts.join('/');
    if (newPath !== currentUrl.pathname) {
      history.pushState({}, '', newPath + currentUrl.search + currentUrl.hash);
    }
  }

  /**
   * Hash string for caching
   */
  hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[GlobalDOMScanner] Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get all discovered strings
   */
  getAllStrings() {
    return Array.from(this.stringMap.keys());
  }

  /**
   * Add translation for a string
   */
  addTranslation(sourceText, targetText, language) {
    if (this.stringMap.has(sourceText)) {
      this.stringMap.get(sourceText).translations[language] = targetText;
    } else {
      this.stringMap.set(sourceText, {
        translations: { [language]: targetText },
        metadata: {},
        nodes: new Set()
      });
    }
  }

  /**
   * Get translation for a string
   */
  getTranslation(sourceText, language) {
    const data = this.stringMap.get(sourceText);
    return data ? data.translations[language] : null;
  }

  /**
   * Stop monitoring and cleanup
   */
  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    clearTimeout(this.debounceTimer);
    
    console.log('[GlobalDOMScanner] Scanner stopped');
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalStrings: this.stringMap.size,
      processedHashes: this.processedHashes.size,
      pendingTranslations: this.pendingTranslations.size,
      isScanning: this.isScanning,
      currentLanguage: this.currentLanguage
    };
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.GlobalDOMScanner = GlobalDOMScanner;
}

export default GlobalDOMScanner;