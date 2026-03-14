/**
 * WebsiteScraper - Extract translatable content from websites
 * 
 * Scans websites to identify all text including:
 * - Visible text content
 * - Navigation menus
 * - Buttons and links
 * - Form labels and placeholders
 * - Image alt text
 * - Meta tags (title, description, keywords)
 * - Open Graph tags (og:title, og:description)
 * - Twitter Card tags
 * - Structured data (JSON-LD)
 * - Hidden content (aria-label, data attributes)
 */

class WebsiteScraper {
  /**
   * Fetch and parse a website URL with configuration
   * @param {string} url - Website URL to scrape
   * @param {Object} config - Scraping configuration from wizard
   * @returns {Promise<Object>} Extracted content
   */
  async scrapeWebsite(url, config = {}) {
    try {
      console.log('[WebsiteScraper] Fetching:', url);
      console.log('[WebsiteScraper] Config:', config);

      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL format');
      }

      // Fetch the webpage using CORS proxy or direct fetch
      const html = await this.fetchWebpage(url);
      
      // Parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Apply platform-specific exclusions
      if (config.platformSettings?.excludeSelectors) {
        this.removeExcludedElements(doc, config.platformSettings.excludeSelectors);
      }

      // Apply translation settings exclusions
      if (config.translationSettings?.excludeSelectors) {
        this.removeExcludedElements(doc, config.translationSettings.excludeSelectors);
      }

      // Extract content based on selected content types
      const content = {
        url: url,
        title: this.extractTitle(doc),
        metaTags: config.contentTypes?.metadata !== false ? this.extractMetaTags(doc) : [],
        openGraph: config.contentTypes?.metadata !== false ? this.extractOpenGraph(doc) : [],
        twitterCards: config.contentTypes?.metadata !== false ? this.extractTwitterCards(doc) : [],
        structuredData: config.contentTypes?.metadata !== false ? this.extractStructuredData(doc) : [],
        navigation: config.contentTypes?.navigation !== false ? this.extractNavigation(doc) : [],
        buttons: config.contentTypes?.buttons !== false ? this.extractButtons(doc) : [],
        links: config.contentTypes?.mainContent !== false ? this.extractLinks(doc) : [],
        forms: config.contentTypes?.forms !== false ? this.extractForms(doc) : [],
        images: config.contentTypes?.images !== false ? this.extractImages(doc) : [],
        headings: config.contentTypes?.mainContent !== false ? this.extractHeadings(doc) : [],
        paragraphs: config.contentTypes?.mainContent !== false ? this.extractParagraphs(doc) : [],
        lists: config.contentTypes?.mainContent !== false ? this.extractLists(doc) : [],
        tables: config.contentTypes?.mainContent !== false ? this.extractTables(doc) : [],
        footer: config.contentTypes?.footer !== false ? this.extractFooter(doc) : [],
        sidebar: config.contentTypes?.sidebar !== false ? this.extractSidebar(doc) : [],
        popups: config.contentTypes?.popups === true ? this.extractPopups(doc) : [],
        comments: config.contentTypes?.comments === true ? this.extractComments(doc) : [],
        hiddenContent: config.translationSettings?.includeHidden === true ? this.extractHiddenContent(doc) : [],
        ariaLabels: config.translationSettings?.translateAttributes !== false ? this.extractAriaLabels(doc) : [],
        dataAttributes: config.translationSettings?.translateAttributes !== false ? this.extractDataAttributes(doc) : []
      };

      // Convert to segments
      const segments = this.convertToSegments(content, config);

      return {
        success: true,
        url: url,
        content: content,
        segments: segments,
        metadata: {
          totalSegments: segments.length,
          pageTitle: content.title,
          scrapedAt: new Date().toISOString(),
          configuration: config
        }
      };

    } catch (error) {
      console.error('[WebsiteScraper] Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch webpage content
   */
  async fetchWebpage(url) {
    // List of CORS proxies to try
    const proxies = [
      // AllOrigins - returns raw HTML
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      // CORS Anywhere alternative
      (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      // ThingProxy
      (url) => `https://thingproxy.freeboard.io/fetch/${url}`
    ];

    // Try direct fetch first
    try {
      console.log('[WebsiteScraper] Trying direct fetch...');
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok) {
        const html = await response.text();
        if (html && html.length > 100) {
          console.log('[WebsiteScraper] Direct fetch successful');
          return html;
        }
      }
    } catch (error) {
      console.warn('[WebsiteScraper] Direct fetch failed:', error.message);
    }

    // Try each proxy
    for (let i = 0; i < proxies.length; i++) {
      try {
        const proxyUrl = proxies[i](url);
        console.log(`[WebsiteScraper] Trying proxy ${i + 1}/${proxies.length}...`);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        if (response.ok) {
          const html = await response.text();
          if (html && html.length > 100) {
            console.log(`[WebsiteScraper] Proxy ${i + 1} successful`);
            return html;
          }
        }
      } catch (error) {
        console.warn(`[WebsiteScraper] Proxy ${i + 1} failed:`, error.message);
        continue;
      }
    }

    // All methods failed
    throw new Error('Unable to fetch webpage. The website may be blocking automated access. Try a different URL or contact support.');
  }

  /**
   * Extract page title
   */
  extractTitle(doc) {
    const title = doc.querySelector('title');
    return title ? title.textContent.trim() : '';
  }

  /**
   * Extract meta tags (SEO content)
   */
  extractMetaTags(doc) {
    const metaTags = [];
    
    // Standard meta tags
    const metas = doc.querySelectorAll('meta[name], meta[property]');
    metas.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      
      if (content && content.trim()) {
        metaTags.push({
          name: name,
          content: content.trim(),
          type: 'meta'
        });
      }
    });

    return metaTags;
  }

  /**
   * Extract Open Graph tags
   */
  extractOpenGraph(doc) {
    const ogTags = [];
    
    const ogMetas = doc.querySelectorAll('meta[property^="og:"]');
    ogMetas.forEach(meta => {
      const property = meta.getAttribute('property');
      const content = meta.getAttribute('content');
      
      if (content && content.trim()) {
        ogTags.push({
          property: property,
          content: content.trim(),
          type: 'open_graph'
        });
      }
    });

    return ogTags;
  }

  /**
   * Extract Twitter Card tags
   */
  extractTwitterCards(doc) {
    const twitterTags = [];
    
    const twitterMetas = doc.querySelectorAll('meta[name^="twitter:"]');
    twitterMetas.forEach(meta => {
      const name = meta.getAttribute('name');
      const content = meta.getAttribute('content');
      
      if (content && content.trim()) {
        twitterTags.push({
          name: name,
          content: content.trim(),
          type: 'twitter_card'
        });
      }
    });

    return twitterTags;
  }

  /**
   * Extract structured data (JSON-LD)
   */
  extractStructuredData(doc) {
    const structuredData = [];
    
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        this.extractStringsFromObject(data, structuredData, 'structured_data');
      } catch (e) {
        console.warn('[WebsiteScraper] Failed to parse JSON-LD:', e);
      }
    });

    return structuredData;
  }

  /**
   * Extract navigation menus
   */
  extractNavigation(doc) {
    const navigation = [];
    
    // Find nav elements
    const navs = doc.querySelectorAll('nav, [role="navigation"], .nav, .menu, .navbar');
    navs.forEach((nav, index) => {
      const links = nav.querySelectorAll('a');
      links.forEach(link => {
        const text = link.textContent.trim();
        const href = link.getAttribute('href');
        
        if (text) {
          navigation.push({
            text: text,
            href: href,
            type: 'navigation',
            section: `nav_${index + 1}`
          });
        }
      });
    });

    return navigation;
  }

  /**
   * Extract buttons
   */
  extractButtons(doc) {
    const buttons = [];
    
    const buttonElements = doc.querySelectorAll('button, input[type="button"], input[type="submit"], .btn, [role="button"]');
    buttonElements.forEach((btn, index) => {
      const text = btn.textContent.trim() || btn.getAttribute('value') || btn.getAttribute('aria-label');
      
      if (text) {
        buttons.push({
          text: text,
          type: 'button',
          id: btn.id || `button_${index + 1}`
        });
      }
    });

    return buttons;
  }

  /**
   * Extract links
   */
  extractLinks(doc) {
    const links = [];
    
    const linkElements = doc.querySelectorAll('a');
    linkElements.forEach((link, index) => {
      const text = link.textContent.trim();
      const href = link.getAttribute('href');
      const title = link.getAttribute('title');
      
      if (text) {
        links.push({
          text: text,
          href: href,
          title: title,
          type: 'link'
        });
      }
    });

    return links;
  }

  /**
   * Extract form elements
   */
  extractForms(doc) {
    const forms = [];
    
    // Labels
    doc.querySelectorAll('label').forEach(label => {
      const text = label.textContent.trim();
      if (text) {
        forms.push({
          text: text,
          type: 'form_label',
          for: label.getAttribute('for')
        });
      }
    });

    // Placeholders
    doc.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(input => {
      const placeholder = input.getAttribute('placeholder');
      if (placeholder && placeholder.trim()) {
        forms.push({
          text: placeholder.trim(),
          type: 'form_placeholder',
          name: input.getAttribute('name')
        });
      }
    });

    // Select options
    doc.querySelectorAll('option').forEach(option => {
      const text = option.textContent.trim();
      if (text) {
        forms.push({
          text: text,
          type: 'form_option',
          value: option.getAttribute('value')
        });
      }
    });

    return forms;
  }

  /**
   * Extract images with alt text
   */
  extractImages(doc) {
    const images = [];
    
    doc.querySelectorAll('img[alt]').forEach((img, index) => {
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src');
      const title = img.getAttribute('title');
      
      if (alt && alt.trim()) {
        images.push({
          text: alt.trim(),
          src: src,
          title: title,
          type: 'image_alt'
        });
      }
    });

    return images;
  }

  /**
   * Extract headings
   */
  extractHeadings(doc) {
    const headings = [];
    
    doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
      const text = heading.textContent.trim();
      if (text) {
        headings.push({
          text: text,
          type: 'heading',
          level: heading.tagName.toLowerCase()
        });
      }
    });

    return headings;
  }

  /**
   * Extract paragraphs
   */
  extractParagraphs(doc) {
    const paragraphs = [];
    
    doc.querySelectorAll('p').forEach(p => {
      const text = p.textContent.trim();
      if (text) {
        paragraphs.push({
          text: text,
          type: 'paragraph'
        });
      }
    });

    return paragraphs;
  }

  /**
   * Extract lists
   */
  extractLists(doc) {
    const lists = [];
    
    doc.querySelectorAll('li').forEach(li => {
      const text = li.textContent.trim();
      if (text) {
        lists.push({
          text: text,
          type: 'list_item'
        });
      }
    });

    return lists;
  }

  /**
   * Extract tables
   */
  extractTables(doc) {
    const tables = [];
    
    doc.querySelectorAll('th, td').forEach(cell => {
      const text = cell.textContent.trim();
      if (text) {
        tables.push({
          text: text,
          type: cell.tagName.toLowerCase() === 'th' ? 'table_header' : 'table_cell'
        });
      }
    });

    return tables;
  }

  /**
   * Extract hidden content
   */
  extractHiddenContent(doc) {
    const hidden = [];
    
    // Elements with display:none or visibility:hidden might still need translation
    doc.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"], .hidden').forEach(el => {
      const text = el.textContent.trim();
      if (text && text.length < 500) { // Avoid huge hidden blocks
        hidden.push({
          text: text,
          type: 'hidden_content'
        });
      }
    });

    return hidden;
  }

  /**
   * Extract ARIA labels (accessibility)
   */
  extractAriaLabels(doc) {
    const ariaLabels = [];
    
    doc.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]').forEach(el => {
      const label = el.getAttribute('aria-label');
      if (label && label.trim()) {
        ariaLabels.push({
          text: label.trim(),
          type: 'aria_label'
        });
      }
    });

    return ariaLabels;
  }

  /**
   * Extract data attributes with text
   */
  extractDataAttributes(doc) {
    const dataAttrs = [];
    
    doc.querySelectorAll('[data-title], [data-text], [data-label], [data-tooltip]').forEach(el => {
      ['data-title', 'data-text', 'data-label', 'data-tooltip'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (value && value.trim()) {
          dataAttrs.push({
            text: value.trim(),
            type: 'data_attribute',
            attribute: attr
          });
        }
      });
    });

    return dataAttrs;
  }

  /**
   * Extract strings from nested objects (for JSON-LD)
   */
  extractStringsFromObject(obj, result, type, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.trim()) {
        result.push({
          text: value.trim(),
          type: type,
          key: prefix ? `${prefix}.${key}` : key
        });
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.extractStringsFromObject(value, result, type, prefix ? `${prefix}.${key}` : key);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'string' && item.trim()) {
            result.push({
              text: item.trim(),
              type: type,
              key: `${prefix ? prefix + '.' : ''}${key}[${index}]`
            });
          } else if (typeof item === 'object' && item !== null) {
            this.extractStringsFromObject(item, result, type, `${prefix ? prefix + '.' : ''}${key}[${index}]`);
          }
        });
      }
    }
  }

  /**
   * Convert extracted content to translation segments
   */
  convertToSegments(content) {
    const segments = [];
    let segmentId = 1;

    // Helper to add segment
    const addSegment = (text, type, metadata = {}) => {
      if (text && text.trim() && text.length > 0) {
        segments.push({
          id: segmentId++,
          source: text.trim(),
          type: type,
          ...metadata
        });
      }
    };

    // Page title
    addSegment(content.title, 'page_title');

    // Meta tags
    content.metaTags.forEach(meta => {
      addSegment(meta.content, 'meta_tag', { name: meta.name });
    });

    // Open Graph
    content.openGraph.forEach(og => {
      addSegment(og.content, 'open_graph', { property: og.property });
    });

    // Twitter Cards
    content.twitterCards.forEach(twitter => {
      addSegment(twitter.content, 'twitter_card', { name: twitter.name });
    });

    // Structured Data
    content.structuredData.forEach(data => {
      addSegment(data.text, 'structured_data', { key: data.key });
    });

    // Navigation
    content.navigation.forEach(nav => {
      addSegment(nav.text, 'navigation', { href: nav.href, section: nav.section });
    });

    // Buttons
    content.buttons.forEach(btn => {
      addSegment(btn.text, 'button', { id: btn.id });
    });

    // Links
    content.links.forEach(link => {
      addSegment(link.text, 'link', { href: link.href });
      if (link.title) addSegment(link.title, 'link_title', { href: link.href });
    });

    // Forms
    content.forms.forEach(form => {
      addSegment(form.text, form.type, { name: form.name || form.for });
    });

    // Images
    content.images.forEach(img => {
      addSegment(img.text, 'image_alt', { src: img.src });
      if (img.title) addSegment(img.title, 'image_title', { src: img.src });
    });

    // Headings
    content.headings.forEach(heading => {
      addSegment(heading.text, 'heading', { level: heading.level });
    });

    // Paragraphs
    content.paragraphs.forEach(p => {
      addSegment(p.text, 'paragraph');
    });

    // Lists
    content.lists.forEach(li => {
      addSegment(li.text, 'list_item');
    });

    // Tables
    content.tables.forEach(cell => {
      addSegment(cell.text, cell.type);
    });

    // Hidden content
    content.hiddenContent.forEach(hidden => {
      addSegment(hidden.text, 'hidden_content');
    });

    // ARIA labels
    content.ariaLabels.forEach(aria => {
      addSegment(aria.text, 'aria_label');
    });

    // Data attributes
    content.dataAttributes.forEach(data => {
      addSegment(data.text, 'data_attribute', { attribute: data.attribute });
    });

    return segments;
  }

  /**
   * Validate URL
   */
  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  /**
   * Scrape multiple pages from sitemap
   */
  async scrapeSitemap(sitemapUrl) {
    try {
      console.log('[WebsiteScraper] Fetching sitemap:', sitemapUrl);

      const xml = await this.fetchWebpage(sitemapUrl);
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');

      const urls = [];
      doc.querySelectorAll('url > loc').forEach(loc => {
        urls.push(loc.textContent.trim());
      });

      console.log(`[WebsiteScraper] Found ${urls.length} URLs in sitemap`);

      return {
        success: true,
        urls: urls
      };
    } catch (error) {
      console.error('[WebsiteScraper] Sitemap error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

  /**
   * Remove excluded elements from document
   */
  removeExcludedElements(doc, excludeSelectors) {
    if (!excludeSelectors || !Array.isArray(excludeSelectors)) return;
    
    excludeSelectors.forEach(selector => {
      try {
        const elements = doc.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      } catch (error) {
        console.warn(`Invalid CSS selector: ${selector}`);
      }
    });
  }

  /**
   * Extract footer content
   */
  extractFooter(doc) {
    const footers = [];
    const footerSelectors = [
      'footer',
      '.footer',
      '#footer',
      '[role="contentinfo"]',
      '.site-footer',
      '.page-footer'
    ];

    footerSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        const text = this.cleanText(el.textContent);
        if (text && text.length > 3) {
          footers.push({
            text: text,
            selector: selector,
            tag: el.tagName.toLowerCase()
          });
        }
      });
    });

    return footers;
  }

  /**
   * Extract sidebar content
   */
  extractSidebar(doc) {
    const sidebars = [];
    const sidebarSelectors = [
      '.sidebar',
      '.widget',
      '.aside',
      'aside',
      '[role="complementary"]',
      '.secondary'
    ];

    sidebarSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        const text = this.cleanText(el.textContent);
        if (text && text.length > 3) {
          sidebars.push({
            text: text,
            selector: selector,
            tag: el.tagName.toLowerCase()
          });
        }
      });
    });

    return sidebars;
  }

  /**
   * Extract popup and modal content
   */
  extractPopups(doc) {
    const popups = [];
    const popupSelectors = [
      '.modal',
      '.popup',
      '.overlay',
      '.lightbox',
      '[role="dialog"]',
      '.fancybox',
      '.tooltip'
    ];

    popupSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        const text = this.cleanText(el.textContent);
        if (text && text.length > 3) {
          popups.push({
            text: text,
            selector: selector,
            tag: el.tagName.toLowerCase()
          });
        }
      });
    });

    return popups;
  }

  /**
   * Extract comments content
   */
  extractComments(doc) {
    const comments = [];
    const commentSelectors = [
      '.comment',
      '.review',
      '.testimonial',
      '.feedback',
      '[class*="comment"]',
      '[class*="review"]'
    ];

    commentSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        const text = this.cleanText(el.textContent);
        if (text && text.length > 10) {
          comments.push({
            text: text,
            selector: selector,
            tag: el.tagName.toLowerCase()
          });
        }
      });
    });

    return comments;
  }

  /**
   * Convert content to segments with configuration
   */
  convertToSegments(content, config = {}) {
    const segments = [];
    let segmentId = 1;

    // Helper function to add segment
    const addSegment = (text, type, metadata = {}) => {
      if (text && text.trim().length > 0) {
        segments.push({
          id: segmentId++,
          text: text.trim(),
          type: type,
          metadata: metadata
        });
      }
    };

    // Process each content type based on configuration
    Object.entries(content).forEach(([contentType, items]) => {
      if (!items || (Array.isArray(items) && items.length === 0)) return;

      if (contentType === 'title' && typeof items === 'string') {
        addSegment(items, 'title');
      } else if (Array.isArray(items)) {
        items.forEach(item => {
          if (typeof item === 'string') {
            addSegment(item, contentType);
          } else if (item && item.text) {
            addSegment(item.text, contentType, {
              selector: item.selector,
              tag: item.tag,
              attributes: item.attributes
            });
          }
        });
      }
    });

    return segments;
  }

// Export singleton instance
const websiteScraper = new WebsiteScraper();
export default websiteScraper;
