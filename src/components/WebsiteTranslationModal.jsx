import React, { useState } from 'react';
import websiteScraper from '../services/websiteScraper';
import { supabase } from '../lib/supabase';
import segmentationEngine from '../services/segmentationEngine';

const WebsiteTranslationModal = ({ projectId, projectName, onClose, onComplete }) => {
  const [url, setUrl] = useState('');
  const [useSitemap, setUseSitemap] = useState(false);
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState(null);

  const handleScrape = async () => {
    if (!url.trim()) {
      alert('Please enter a website URL');
      return;
    }

    setScraping(true);
    setProgress('Fetching website...');
    setResults(null);

    try {
      let urlsToScrape = [url];

      // If sitemap is enabled, fetch URLs from sitemap
      if (useSitemap && sitemapUrl.trim()) {
        setProgress('Fetching sitemap...');
        const sitemapResult = await websiteScraper.scrapeSitemap(sitemapUrl);
        
        if (sitemapResult.success) {
          urlsToScrape = sitemapResult.urls;
          setProgress(`Found ${urlsToScrape.length} pages in sitemap`);
        } else {
          console.warn('Sitemap fetch failed, scraping single URL');
        }
      }

      const allSegments = [];
      const scrapedPages = [];

      // Scrape each URL
      for (let i = 0; i < urlsToScrape.length; i++) {
        const pageUrl = urlsToScrape[i];
        setProgress(`Scraping page ${i + 1} of ${urlsToScrape.length}: ${pageUrl}`);

        const result = await websiteScraper.scrapeWebsite(pageUrl);

        if (result.success) {
          scrapedPages.push({
            url: pageUrl,
            title: result.content.title,
            segmentCount: result.segments.length
          });

          // Add page URL to each segment for context
          result.segments.forEach(seg => {
            allSegments.push({
              ...seg,
              pageUrl: pageUrl,
              pageTitle: result.content.title
            });
          });
        } else {
          console.error(`Failed to scrape ${pageUrl}:`, result.error);
        }

        // Add small delay to avoid overwhelming the server
        if (i < urlsToScrape.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (allSegments.length === 0) {
        throw new Error('No content extracted from website. This could be because: 1) The website is blocking automated access, 2) The page is JavaScript-rendered (try a different page), or 3) The URL is incorrect. Please try a different website or contact support.');
      }

      setProgress('Saving segments to database...');

      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Create a file record for the website
      const { data: fileRecord, error: fileError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          filename: `website_${new Date().getTime()}.html`,
          file_size: 0,
          file_type: 'html',
          mime_type: 'text/html',
          storage_path: url,
          storage_url: url,
          upload_status: 'completed',
          uploaded_by: userId
        })
        .select()
        .single();

      if (fileError) throw fileError;

      // Save segments to database
      // Use only the core required fields to avoid schema cache issues
      const segmentsToInsert = allSegments.map((seg, index) => ({
        project_id: projectId,
        file_id: fileRecord.id,
        source_text: seg.source,
        target_text: '',
        status: 'pending',
        segment_number: index + 1
      }));

      console.log('[WebsiteTranslation] Inserting segments:', segmentsToInsert.length);

      const { error: segmentError } = await supabase
        .from('segments')
        .insert(segmentsToInsert);

      if (segmentError) {
        console.error('[WebsiteTranslation] Segment insert error:', segmentError);
        throw segmentError;
      }

      setProgress('Complete!');
      setResults({
        success: true,
        pagesScraped: scrapedPages.length,
        totalSegments: allSegments.length,
        pages: scrapedPages
      });

      // Call onComplete after a short delay
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);

    } catch (error) {
      console.error('[WebsiteTranslation] Error:', error);
      setResults({
        success: false,
        error: error.message
      });
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              🌐 Translate Website
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Project: {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={scraping}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Website URL {!useSitemap && '*'}
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={scraping}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
            />
            <p className="text-xs text-slate-500 mt-2">
              {useSitemap 
                ? 'Enter the homepage or any page from the website (used as reference)'
                : 'Enter the URL of the specific page you want to translate'}
            </p>
          </div>

          {/* Sitemap Option */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useSitemap}
                onChange={(e) => setUseSitemap(e.target.checked)}
                disabled={scraping}
                className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Scrape Multiple Pages (Sitemap)
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Extract content from all pages listed in your sitemap.xml file
                </p>
              </div>
            </label>

            {useSitemap && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Sitemap URL *
                </label>
                <input
                  type="url"
                  value={sitemapUrl}
                  onChange={(e) => setSitemapUrl(e.target.value)}
                  placeholder="https://example.com/sitemap.xml"
                  disabled={scraping}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                />
                <p className="text-xs text-slate-500 mt-2">
                  💡 Common sitemap locations: /sitemap.xml, /sitemap_index.xml, /sitemap-pages.xml
                </p>
              </div>
            )}
          </div>

          {/* What Will Be Extracted */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">
              📋 What Will Be Extracted:
            </h3>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>✓ Page title and headings</li>
              <li>✓ Navigation menus and links</li>
              <li>✓ Buttons and form labels</li>
              <li>✓ Paragraphs and text content</li>
              <li>✓ Image alt text and titles</li>
              <li>✓ Meta tags (SEO: title, description, keywords)</li>
              <li>✓ Open Graph tags (social media)</li>
              <li>✓ Twitter Card tags</li>
              <li>✓ Structured data (JSON-LD)</li>
              <li>✓ ARIA labels (accessibility)</li>
              <li>✓ Hidden content and data attributes</li>
              <li>✓ Form placeholders and options</li>
            </ul>
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="text-sm font-bold text-yellow-900 dark:text-yellow-100 mb-2">
              💡 Tips for Best Results:
            </h3>
            <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• Use publicly accessible websites (no login required)</li>
              <li>• Static HTML pages work best</li>
              <li>• Some websites may block automated access</li>
              <li>• If scraping fails, try the homepage or a different page</li>
              <li>• JavaScript-heavy sites may not work (try static pages)</li>
            </ul>
          </div>

          {/* Examples */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-sm font-bold text-green-900 dark:text-green-100 mb-2">
              📝 Examples:
            </h3>
            <div className="text-xs text-green-800 dark:text-green-200 space-y-2">
              <div>
                <p className="font-semibold">Single Page Mode:</p>
                <p className="ml-2">Website URL: https://example.com/about</p>
                <p className="ml-2 text-green-600 dark:text-green-400">→ Scrapes only the About page</p>
              </div>
              <div className="pt-2 border-t border-green-200 dark:border-green-700">
                <p className="font-semibold">Multiple Pages Mode:</p>
                <p className="ml-2">Website URL: https://example.com</p>
                <p className="ml-2">Sitemap URL: https://example.com/sitemap.xml</p>
                <p className="ml-2 text-green-600 dark:text-green-400">→ Scrapes all pages in sitemap</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          {scraping && (
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">{progress}</span>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className={`border rounded-lg p-4 ${
              results.success 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              {results.success ? (
                <div>
                  <h3 className="text-sm font-bold text-green-900 dark:text-green-100 mb-2">
                    ✅ Website Scraped Successfully!
                  </h3>
                  <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <p>Pages scraped: {results.pagesScraped}</p>
                    <p>Total segments: {results.totalSegments}</p>
                    {results.pages && results.pages.length > 0 && (
                      <div className="mt-3">
                        <p className="font-semibold mb-1">Pages:</p>
                        <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                          {results.pages.map((page, index) => (
                            <li key={index}>
                              {page.title || page.url} ({page.segmentCount} segments)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-bold text-red-900 dark:text-red-100 mb-2">
                    ❌ Error
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-200 mb-2">{results.error}</p>
                  {results.error.includes('schema cache') && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        <strong>Database Schema Issue:</strong> Your Supabase schema cache may be out of sync. 
                        Try refreshing the page or contact support if the issue persists.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            disabled={scraping}
            className="px-6 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {results?.success ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handleScrape}
            disabled={!url.trim() || scraping || results?.success}
            className="px-8 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scraping ? 'Scraping...' : results?.success ? 'Complete' : 'Start Scraping'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebsiteTranslationModal;
