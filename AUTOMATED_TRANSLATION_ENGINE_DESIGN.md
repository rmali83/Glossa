# Automated Translation Engine Design
## Weglot-Style "Set-and-Forget" Translation System

### Executive Summary
This document outlines the transformation of Glossa's existing manual translation system into a fully automated, real-time translation engine that mimics Weglot's core behavior. The system will automatically detect, extract, translate, and deploy multilingual content without manual intervention.

---

## 1. Current State Analysis

### Existing Strengths
- ✅ **Robust File Parser**: Supports 80+ file formats
- ✅ **Website Scraper**: Extracts comprehensive content (text, meta, images, forms)
- ✅ **Translation Memory**: Fuzzy matching with PostgreSQL Levenshtein distance
- ✅ **Quality Assurance**: 13 automated QA checks
- ✅ **Database Schema**: Well-structured segments and TM tables
- ✅ **AI Translation**: MyMemory + LibreTranslate integration

### Critical Gaps
- ❌ **No Real-time Monitoring**: No continuous website change detection
- ❌ **Manual Workflow**: Requires human intervention for each step
- ❌ **No Auto-deployment**: Translations don't automatically appear on websites
- ❌ **No Context Preservation**: Limited metadata about content location
- ❌ **No Webhook System**: No triggers for content changes
- ❌ **No Language Detection**: Manual language selection required

---

## 2. Automated Engine Architecture

### Core Components

#### 2.1 Global DOM Scanner (Client-Side)
```javascript
// High-performance MutationObserver-based scanner
class GlobalDOMScanner {
  constructor(config) {
    this.config = config;
    this.stringMap = new Map(); // Centralized translation cache
    this.observer = null;
    this.excludeSelectors = config.excludeSelectors || [];
    this.isScanning = false;
  }
  
  // Automatically detect all text nodes
  scanAllTextNodes() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      this.textNodeFilter.bind(this),
      false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    return textNodes;
  }
  
  // Real-time monitoring with MutationObserver
  startMonitoring() {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['alt', 'title', 'placeholder', 'aria-label']
    });
  }
}
```

#### 2.2 Content Detection Engine (Server-Side)
```javascript
// Automated content change detection
class ContentDetectionEngine {
  constructor() {
    this.monitoredSites = new Map();
    this.changeQueue = [];
    this.webhookEndpoints = new Map();
  }
  
  // Monitor website for changes
  async monitorWebsite(siteConfig) {
    const { url, checkInterval = 300000 } = siteConfig; // 5 minutes default
    
    setInterval(async () => {
      const currentContent = await this.scrapeWebsite(url);
      const storedContent = await this.getStoredContent(url);
      
      const changes = this.detectChanges(currentContent, storedContent);
      if (changes.length > 0) {
        await this.processChanges(url, changes);
      }
    }, checkInterval);
  }
  
  // Detect content changes using content hashing
  detectChanges(current, stored) {
    const changes = [];
    
    // Compare content hashes
    for (const [selector, content] of current.entries()) {
      const currentHash = this.hashContent(content);
      const storedHash = stored.get(selector)?.hash;
      
      if (currentHash !== storedHash) {
        changes.push({
          selector,
          type: stored.has(selector) ? 'modified' : 'added',
          content,
          timestamp: Date.now()
        });
      }
    }
    
    return changes;
  }
}
```

#### 2.3 Translation Pipeline
```javascript
// Automated translation processing
class TranslationPipeline {
  constructor() {
    this.translationQueue = [];
    this.batchSize = 50;
    this.processingInterval = 5000; // 5 seconds
  }
  
  // Process translation queue
  async processQueue() {
    if (this.translationQueue.length === 0) return;
    
    const batch = this.translationQueue.splice(0, this.batchSize);
    const translations = await Promise.all(
      batch.map(item => this.translateItem(item))
    );
    
    await this.deployTranslations(translations);
  }
  
  // Smart translation with TM and AI fallback
  async translateItem(item) {
    const { text, sourceLanguage, targetLanguage, context } = item;
    
    // 1. Check Translation Memory first
    const tmMatch = await this.findTMMatch(text, sourceLanguage, targetLanguage);
    if (tmMatch && tmMatch.matchPercentage >= 95) {
      return { ...item, translation: tmMatch.targetText, source: 'TM' };
    }
    
    // 2. Use AI translation
    const aiTranslation = await this.translateWithAI(text, sourceLanguage, targetLanguage);
    
    // 3. Store in TM for future use
    await this.storeTMEntry(text, aiTranslation, sourceLanguage, targetLanguage);
    
    return { ...item, translation: aiTranslation, source: 'AI' };
  }
}
```

#### 2.4 Deployment Engine
```javascript
// Automatic translation deployment
class DeploymentEngine {
  constructor() {
    this.deploymentMethods = {
      'javascript': this.deployJavaScript.bind(this),
      'api': this.deployAPI.bind(this),
      'cdn': this.deployCDN.bind(this),
      'webhook': this.deployWebhook.bind(this)
    };
  }
  
  // Deploy via JavaScript injection
  async deployJavaScript(translations, siteConfig) {
    const script = this.generateTranslationScript(translations, siteConfig);
    
    // Update CDN or file system
    await this.updateTranslationFile(siteConfig.domain, script);
    
    // Notify website to reload translations
    if (siteConfig.webhookUrl) {
      await this.triggerWebhook(siteConfig.webhookUrl, {
        type: 'translations_updated',
        domain: siteConfig.domain,
        languages: Object.keys(translations),
        timestamp: Date.now()
      });
    }
  }
  
  // Generate optimized translation script
  generateTranslationScript(translations, config) {
    return `
      (function() {
        const translations = ${JSON.stringify(translations)};
        const config = ${JSON.stringify(config)};
        
        // Initialize Glossa Translation Engine
        window.GlossaTranslator = new GlossaTranslationEngine(translations, config);
        window.GlossaTranslator.init();
      })();
    `;
  }
}
```

---

## 3. Technical Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)
1. **Database Schema Updates**
   ```sql
   -- Add automated translation tracking
   CREATE TABLE automated_sites (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     domain VARCHAR(255) NOT NULL,
     source_language VARCHAR(10) NOT NULL,
     target_languages TEXT[] NOT NULL,
     scan_interval INTEGER DEFAULT 300000,
     last_scan TIMESTAMP WITH TIME ZONE,
     status VARCHAR(20) DEFAULT 'active',
     config JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Track content changes
   CREATE TABLE content_changes (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     site_id UUID REFERENCES automated_sites(id),
     selector VARCHAR(500),
     content_hash VARCHAR(64),
     content_text TEXT,
     change_type VARCHAR(20), -- 'added', 'modified', 'deleted'
     detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     processed_at TIMESTAMP WITH TIME ZONE,
     status VARCHAR(20) DEFAULT 'pending'
   );
   
   -- Translation deployment tracking
   CREATE TABLE translation_deployments (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     site_id UUID REFERENCES automated_sites(id),
     language VARCHAR(10),
     deployment_method VARCHAR(20),
     deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     version INTEGER,
     status VARCHAR(20) DEFAULT 'active'
   );
   ```

2. **Content Detection Service**
   - Implement website monitoring with configurable intervals
   - Content hashing for change detection
   - Queue system for processing changes

3. **Translation Pipeline**
   - Batch processing system
   - TM integration with fuzzy matching
   - AI translation fallback

### Phase 2: Client-Side Engine (Week 3-4)
1. **Global DOM Scanner**
   ```javascript
   // Client-side translation engine
   class GlossaTranslationEngine {
     constructor(translations, config) {
       this.translations = translations;
       this.config = config;
       this.currentLanguage = this.detectLanguage();
       this.stringMap = new Map();
       this.observer = null;
     }
     
     init() {
       this.loadTranslations();
       this.scanAndTranslate();
       this.startMonitoring();
       this.setupLanguageSwitcher();
     }
     
     // Scan all text nodes and translate
     scanAndTranslate() {
       const textNodes = this.getAllTextNodes();
       textNodes.forEach(node => this.translateNode(node));
       
       // Handle meta tags
       this.translateMetaTags();
       
       // Handle form elements
       this.translateFormElements();
       
       // Handle image alt text
       this.translateImageAlt();
     }
     
     // Real-time translation of dynamic content
     startMonitoring() {
       this.observer = new MutationObserver((mutations) => {
         mutations.forEach(mutation => {
           if (mutation.type === 'childList') {
             mutation.addedNodes.forEach(node => {
               if (node.nodeType === Node.TEXT_NODE) {
                 this.translateNode(node);
               } else if (node.nodeType === Node.ELEMENT_NODE) {
                 this.scanElement(node);
               }
             });
           }
         });
       });
       
       this.observer.observe(document.body, {
         childList: true,
         subtree: true,
         characterData: true
       });
     }
   }
   ```

2. **Performance Optimization**
   - Debounced translation updates
   - Virtual DOM diffing for minimal reflows
   - Lazy loading for large translation sets
   - Memory management for long-running pages

### Phase 3: SEO & URL Handling (Week 5)
1. **URL Localization**
   ```javascript
   // URL structure management
   class URLManager {
     constructor(config) {
       this.config = config;
       this.structure = config.urlStructure; // 'subdirectory' or 'subdomain'
     }
     
     // Generate localized URLs
     generateLocalizedURL(originalUrl, language) {
       const url = new URL(originalUrl);
       
       if (this.structure === 'subdirectory') {
         // example.com/es/page
         url.pathname = `/${language}${url.pathname}`;
       } else if (this.structure === 'subdomain') {
         // es.example.com/page
         url.hostname = `${language}.${url.hostname}`;
       }
       
       return url.toString();
     }
     
     // Handle browser navigation
     setupNavigation() {
       window.addEventListener('popstate', (event) => {
         const language = this.extractLanguageFromURL(window.location.href);
         if (language !== this.currentLanguage) {
           this.switchLanguage(language);
         }
       });
     }
   }
   ```

2. **Meta Tag Translation**
   ```javascript
   // SEO meta tag handling
   translateMetaTags() {
     const metaTags = [
       { selector: 'title', key: 'page_title' },
       { selector: 'meta[name="description"]', attr: 'content', key: 'meta_description' },
       { selector: 'meta[name="keywords"]', attr: 'content', key: 'meta_keywords' },
       { selector: 'meta[property="og:title"]', attr: 'content', key: 'og_title' },
       { selector: 'meta[property="og:description"]', attr: 'content', key: 'og_description' },
       { selector: 'meta[name="twitter:title"]', attr: 'content', key: 'twitter_title' },
       { selector: 'meta[name="twitter:description"]', attr: 'content', key: 'twitter_description' }
     ];
     
     metaTags.forEach(({ selector, attr, key }) => {
       const element = document.querySelector(selector);
       if (element) {
         const originalText = attr ? element.getAttribute(attr) : element.textContent;
         const translation = this.getTranslation(originalText, key);
         
         if (translation) {
           if (attr) {
             element.setAttribute(attr, translation);
           } else {
             element.textContent = translation;
           }
         }
       }
     });
   }
   ```

### Phase 4: Advanced Features (Week 6-7)
1. **Exclusion Engine**
   ```javascript
   // Content exclusion system
   class ExclusionEngine {
     constructor(config) {
       this.excludeSelectors = config.excludeSelectors || [];
       this.excludeClasses = config.excludeClasses || [];
       this.excludeAttributes = config.excludeAttributes || [];
     }
     
     shouldExclude(element) {
       // Check CSS selectors
       for (const selector of this.excludeSelectors) {
         if (element.matches && element.matches(selector)) {
           return true;
         }
       }
       
       // Check classes
       for (const className of this.excludeClasses) {
         if (element.classList && element.classList.contains(className)) {
           return true;
         }
       }
       
       // Check attributes
       for (const attr of this.excludeAttributes) {
         if (element.hasAttribute(attr)) {
           return true;
         }
       }
       
       return false;
     }
   }
   ```

2. **State Management**
   ```javascript
   // Centralized translation state
   class TranslationState {
     constructor() {
       this.stringMap = new Map();
       this.cache = new Map();
       this.pendingTranslations = new Set();
       this.observers = [];
     }
     
     // Add translation to cache
     addTranslation(sourceText, targetText, language) {
       const key = `${sourceText}:${language}`;
       this.stringMap.set(key, targetText);
       this.cache.set(this.hashString(sourceText), {
         source: sourceText,
         translations: {
           ...this.cache.get(this.hashString(sourceText))?.translations,
           [language]: targetText
         }
       });
     }
     
     // Get translation from cache
     getTranslation(sourceText, language) {
       const key = `${sourceText}:${language}`;
       return this.stringMap.get(key);
     }
     
     // Subscribe to translation updates
     subscribe(callback) {
       this.observers.push(callback);
     }
     
     // Notify observers of changes
     notify(change) {
       this.observers.forEach(callback => callback(change));
     }
   }
   ```

### Phase 5: Integration & Testing (Week 8)
1. **API Integration**
   - Webhook system for real-time updates
   - REST API for manual triggers
   - WebSocket for live translation updates

2. **Performance Testing**
   - Load testing with large translation sets
   - Memory leak detection
   - Browser compatibility testing

3. **Quality Assurance**
   - Automated testing for translation accuracy
   - A/B testing for user experience
   - SEO impact analysis

---

## 4. Configuration System

### Site Configuration
```javascript
// Example configuration for automated translation
const siteConfig = {
  domain: "example.com",
  sourceLanguage: "en",
  targetLanguages: ["es", "fr", "de", "it"],
  
  // URL structure
  urlStructure: "subdirectory", // or "subdomain"
  
  // Content detection
  scanInterval: 300000, // 5 minutes
  contentTypes: {
    mainContent: true,
    navigation: true,
    forms: true,
    metadata: true,
    images: true,
    buttons: true
  },
  
  // Exclusions
  excludeSelectors: [
    ".no-translate",
    "[data-no-translate]",
    "code",
    "pre",
    ".code-block",
    "#admin-panel"
  ],
  
  // Translation settings
  translationEngine: "hybrid", // "tm-only", "ai-only", "hybrid"
  tmThreshold: 85, // Minimum TM match percentage
  autoPublish: true,
  
  // Performance
  batchSize: 50,
  maxCacheSize: 10000,
  debounceDelay: 500,
  
  // Deployment
  deploymentMethod: "javascript", // "api", "cdn", "webhook"
  cdnUrl: "https://cdn.glossa.com/translations/",
  webhookUrl: "https://example.com/api/translations/updated"
};
```

---

## 5. Performance Considerations

### Client-Side Optimization
1. **Lazy Loading**: Load translations on-demand
2. **Caching Strategy**: Browser localStorage + memory cache
3. **Debouncing**: Prevent excessive DOM updates
4. **Virtual DOM**: Minimize layout thrashing
5. **Web Workers**: Background translation processing

### Server-Side Optimization
1. **Queue System**: Redis-based job queue
2. **Caching**: Multi-layer caching (Redis + CDN)
3. **Rate Limiting**: API throttling
4. **Batch Processing**: Bulk translation operations
5. **Database Indexing**: Optimized queries

---

## 6. Security & Privacy

### Data Protection
1. **Content Encryption**: Encrypt sensitive content in transit
2. **Access Control**: Role-based permissions
3. **Audit Logging**: Track all translation activities
4. **GDPR Compliance**: Data retention policies
5. **API Security**: Rate limiting + authentication

### Content Safety
1. **Sanitization**: XSS prevention
2. **Content Validation**: Malicious content detection
3. **Rollback System**: Quick reversion capabilities
4. **Monitoring**: Real-time error detection

---

## 7. Success Metrics

### Performance KPIs
- **Translation Speed**: < 2 seconds for 95% of requests
- **Accuracy**: > 95% TM match utilization
- **Uptime**: 99.9% availability
- **Page Load Impact**: < 100ms additional load time

### Business KPIs
- **Automation Rate**: > 90% of translations automated
- **Cost Reduction**: 70% reduction in manual translation costs
- **Time to Market**: 80% faster multilingual deployment
- **User Satisfaction**: > 4.5/5 rating

---

## 8. Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 1 | 2 weeks | Core infrastructure, database schema, content detection |
| Phase 2 | 2 weeks | Client-side engine, DOM scanner, real-time translation |
| Phase 3 | 1 week | SEO optimization, URL handling, meta tag translation |
| Phase 4 | 2 weeks | Advanced features, exclusion engine, state management |
| Phase 5 | 1 week | Integration testing, performance optimization |
| **Total** | **8 weeks** | **Fully automated translation engine** |

---

## 9. Next Steps

1. **Immediate Actions**:
   - Review and approve this design document
   - Set up development environment
   - Create project repository structure

2. **Week 1 Priorities**:
   - Implement database schema updates
   - Create content detection service
   - Set up basic monitoring infrastructure

3. **Success Criteria**:
   - Automated detection of website changes
   - Real-time translation deployment
   - Zero manual intervention required
   - Weglot-level user experience

This design transforms Glossa from a manual CAT tool into a fully automated, enterprise-grade translation platform that can compete directly with Weglot while leveraging existing translation memory and quality assurance capabilities.