import React, { useState, useEffect } from 'react';
import websiteScraper from '../services/websiteScraper';
import { supabase } from '../lib/supabase';

const WebsiteTranslationWizard = ({ projectId, projectName, onClose, onComplete }) => {
    console.log('🧙‍♂️ WebsiteTranslationWizard v2.0 Loading...'); // Debug log
    const [currentStep, setCurrentStep] = useState(1);
    const [wizardData, setWizardData] = useState({
        // Step 1: Website URL & Detection
        url: '',
        websiteType: null,
        detectedPlatform: null,
        
        // Step 2: Platform Configuration
        platformSettings: {},
        
        // Step 3: Content Selection
        contentTypes: {
            mainContent: true,
            navigation: true,
            footer: true,
            forms: true,
            metadata: true,
            images: true,
            buttons: true,
            popups: false,
            comments: false,
            sidebar: true
        },
        
        // Step 4: Translation Settings
        translationSettings: {
            excludeSelectors: [],
            includeHidden: false,
            preserveFormatting: true,
            translateAttributes: true,
            handleDynamicContent: false
        },
        
        // Step 5: Crawling Options
        crawlingOptions: {
            crawlType: 'single', // single, sitemap, custom
            sitemapUrl: '',
            maxPages: 10,
            includeSubdomains: false,
            excludePatterns: [],
            followExternalLinks: false
        }
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Website types and their characteristics
    const websiteTypes = {
        wordpress: {
            name: 'WordPress',
            icon: '📝',
            description: 'WordPress CMS website',
            detectionSignals: ['wp-content', 'wp-includes', 'wordpress', 'wp-json'],
            defaultSettings: {
                excludeSelectors: ['.wp-admin', '#wpadminbar', '.screen-reader-text'],
                includeHidden: false,
                handleDynamicContent: true
            }
        },
        drupal: {
            name: 'Drupal',
            icon: '🔷',
            description: 'Drupal CMS website',
            detectionSignals: ['drupal', 'sites/default', 'modules/system'],
            defaultSettings: {
                excludeSelectors: ['.contextual-links', '.admin-menu'],
                includeHidden: false,
                handleDynamicContent: true
            }
        },
        shopify: {
            name: 'Shopify',
            icon: '🛒',
            description: 'Shopify e-commerce store',
            detectionSignals: ['shopify', 'cdn.shopify.com', 'myshopify.com'],
            defaultSettings: {
                excludeSelectors: ['.shopify-section--header', '.cart-drawer'],
                includeHidden: false,
                translateAttributes: true
            }
        },
        woocommerce: {
            name: 'WooCommerce',
            icon: '🛍️',
            description: 'WooCommerce store (WordPress)',
            detectionSignals: ['woocommerce', 'wc-', 'wp-content/plugins/woocommerce'],
            defaultSettings: {
                excludeSelectors: ['.woocommerce-admin', '.cart-contents'],
                includeHidden: false,
                translateAttributes: true
            }
        },
        react: {
            name: 'React App',
            icon: '⚛️',
            description: 'React single-page application',
            detectionSignals: ['react', '__REACT_DEVTOOLS_GLOBAL_HOOK__', 'react-dom'],
            defaultSettings: {
                excludeSelectors: [],
                includeHidden: true,
                handleDynamicContent: true
            }
        },
        vue: {
            name: 'Vue.js App',
            icon: '💚',
            description: 'Vue.js application',
            detectionSignals: ['vue', '__VUE__', 'v-'],
            defaultSettings: {
                excludeSelectors: [],
                includeHidden: true,
                handleDynamicContent: true
            }
        },
        angular: {
            name: 'Angular App',
            icon: '🅰️',
            description: 'Angular application',
            detectionSignals: ['angular', 'ng-', '_angular'],
            defaultSettings: {
                excludeSelectors: [],
                includeHidden: true,
                handleDynamicContent: true
            }
        },
        magento: {
            name: 'Magento',
            icon: '🏪',
            description: 'Magento e-commerce platform',
            detectionSignals: ['magento', 'mage', 'skin/frontend'],
            defaultSettings: {
                excludeSelectors: ['.admin__menu', '.customer-menu'],
                includeHidden: false,
                translateAttributes: true
            }
        },
        joomla: {
            name: 'Joomla',
            icon: '🌟',
            description: 'Joomla CMS',
            detectionSignals: ['joomla', 'com_content', 'administrator/index.php'],
            defaultSettings: {
                excludeSelectors: ['.admin-menu', '.module-chrome'],
                includeHidden: false
            }
        },
        static: {
            name: 'Static HTML',
            icon: '📄',
            description: 'Static HTML website',
            detectionSignals: [],
            defaultSettings: {
                excludeSelectors: [],
                includeHidden: false,
                translateAttributes: true
            }
        }
    };

    // Step 1: Analyze website
    const analyzeWebsite = async () => {
        if (!wizardData.url.trim()) {
            alert('Please enter a website URL');
            return;
        }

        setIsAnalyzing(true);
        try {
            // Fetch website content for analysis
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(wizardData.url)}`);
            const data = await response.json();
            const html = data.contents;

            // Detect website platform
            const detectedPlatform = detectWebsitePlatform(html, wizardData.url);
            
            // Analyze content structure
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const analysis = {
                platform: detectedPlatform,
                pageTitle: doc.title || 'Untitled',
                hasNavigation: doc.querySelector('nav, .navigation, .menu') !== null,
                hasFooter: doc.querySelector('footer, .footer') !== null,
                hasForms: doc.querySelector('form') !== null,
                hasImages: doc.querySelectorAll('img').length,
                hasMetaTags: doc.querySelectorAll('meta').length,
                estimatedPages: 1, // Will be updated if sitemap is found
                language: doc.documentElement.lang || 'en',
                charset: doc.characterSet || 'UTF-8'
            };

            setAnalysisResults(analysis);
            setWizardData(prev => ({
                ...prev,
                detectedPlatform: detectedPlatform,
                websiteType: detectedPlatform,
                platformSettings: websiteTypes[detectedPlatform]?.defaultSettings || {}
            }));

            setCurrentStep(2);
        } catch (error) {
            console.error('Website analysis failed:', error);
            alert('Failed to analyze website. Please check the URL and try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Detect website platform based on HTML content and URL
    const detectWebsitePlatform = (html, url) => {
        const htmlLower = html.toLowerCase();
        
        // Check each platform's detection signals
        for (const [key, platform] of Object.entries(websiteTypes)) {
            const signals = platform.detectionSignals;
            const matchCount = signals.filter(signal => 
                htmlLower.includes(signal.toLowerCase()) || 
                url.toLowerCase().includes(signal.toLowerCase())
            ).length;
            
            // If more than half the signals match, consider it detected
            if (matchCount > 0 && matchCount >= signals.length * 0.5) {
                return key;
            }
        }
        
        return 'static'; // Default to static HTML
    };

    // Handle step navigation
    const nextStep = () => {
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Update wizard data
    const updateWizardData = (section, data) => {
        setWizardData(prev => ({
            ...prev,
            [section]: { ...prev[section], ...data }
        }));
    };

    // Start translation process
    const startTranslation = async () => {
        setIsProcessing(true);
        try {
            // Prepare scraping configuration
            const scrapingConfig = {
                url: wizardData.url,
                contentTypes: wizardData.contentTypes,
                translationSettings: wizardData.translationSettings,
                crawlingOptions: wizardData.crawlingOptions,
                platformSettings: wizardData.platformSettings
            };

            // Use existing websiteScraper with enhanced configuration
            const results = await websiteScraper.scrapeWebsite(wizardData.url, scrapingConfig);
            
            // Create segments in database
            if (results.segments && results.segments.length > 0) {
                const { error } = await supabase
                    .from('segments')
                    .insert(
                        results.segments.map((segment, index) => ({
                            project_id: projectId,
                            segment_number: index + 1,
                            source_text: segment.text,
                            target_text: '',
                            status: 'Draft'
                        }))
                    );

                if (error) {
                    throw error;
                }

                onComplete({
                    segmentCount: results.segments.length,
                    websiteType: wizardData.websiteType,
                    platform: wizardData.detectedPlatform,
                    configuration: scrapingConfig
                });
            }
        } catch (error) {
            console.error('Translation process failed:', error);
            alert('Failed to process website. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">🧙‍♂️ Advanced Website Translation Wizard v2.0</h2>
                        <p className="text-gray-400">Step {currentStep} of 5 • Weglot-Style Experience</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {[1, 2, 3, 4, 5].map(step => (
                            <div
                                key={step}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    step <= currentStep
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-600 text-gray-400'
                                }`}
                            >
                                {step}
                            </div>
                        ))}
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(currentStep / 5) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                    {currentStep === 1 && (
                        <Step1_WebsiteAnalysis
                            wizardData={wizardData}
                            setWizardData={setWizardData}
                            isAnalyzing={isAnalyzing}
                            analyzeWebsite={analyzeWebsite}
                            analysisResults={analysisResults}
                        />
                    )}

                    {currentStep === 2 && (
                        <Step2_PlatformConfiguration
                            wizardData={wizardData}
                            updateWizardData={updateWizardData}
                            websiteTypes={websiteTypes}
                            analysisResults={analysisResults}
                        />
                    )}

                    {currentStep === 3 && (
                        <Step3_ContentSelection
                            wizardData={wizardData}
                            updateWizardData={updateWizardData}
                            analysisResults={analysisResults}
                        />
                    )}

                    {currentStep === 4 && (
                        <Step4_TranslationSettings
                            wizardData={wizardData}
                            updateWizardData={updateWizardData}
                        />
                    )}

                    {currentStep === 5 && (
                        <Step5_CrawlingOptions
                            wizardData={wizardData}
                            updateWizardData={updateWizardData}
                            isProcessing={isProcessing}
                            startTranslation={startTranslation}
                        />
                    )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                    >
                        Previous
                    </button>
                    
                    {currentStep < 5 ? (
                        <button
                            onClick={nextStep}
                            disabled={currentStep === 1 && !analysisResults}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={startTranslation}
                            disabled={isProcessing}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
                        >
                            {isProcessing ? 'Processing...' : 'Start Translation'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Step 1: Website Analysis
const Step1_WebsiteAnalysis = ({ wizardData, setWizardData, isAnalyzing, analyzeWebsite, analysisResults }) => (
    <div>
        <h3 className="text-xl font-bold text-white mb-4">🔍 Website Analysis</h3>
        <p className="text-gray-400 mb-6">
            Enter your website URL and we'll analyze its structure and platform to provide the best translation experience.
        </p>

        <div className="space-y-4">
            <div>
                <label className="block text-white font-medium mb-2">Website URL</label>
                <input
                    type="url"
                    value={wizardData.url}
                    onChange={(e) => setWizardData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
            </div>

            <button
                onClick={analyzeWebsite}
                disabled={isAnalyzing || !wizardData.url.trim()}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isAnalyzing ? (
                    <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Analyzing Website...
                    </span>
                ) : (
                    'Analyze Website'
                )}
            </button>

            {analysisResults && (
                <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                    <h4 className="text-white font-medium mb-3">✅ Analysis Complete</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400">Platform:</span>
                            <span className="text-white ml-2 font-medium">
                                {analysisResults.platform ? 
                                    `${analysisResults.platform.charAt(0).toUpperCase() + analysisResults.platform.slice(1)}` : 
                                    'Static HTML'
                                }
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400">Page Title:</span>
                            <span className="text-white ml-2">{analysisResults.pageTitle}</span>
                        </div>
                        <div>
                            <span className="text-gray-400">Language:</span>
                            <span className="text-white ml-2">{analysisResults.language}</span>
                        </div>
                        <div>
                            <span className="text-gray-400">Images:</span>
                            <span className="text-white ml-2">{analysisResults.hasImages} found</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
);

export default WebsiteTranslationWizard;

// Step 2: Platform Configuration
const Step2_PlatformConfiguration = ({ wizardData, updateWizardData, websiteTypes, analysisResults }) => (
    <div>
        <h3 className="text-xl font-bold text-white mb-4">⚙️ Platform Configuration</h3>
        <p className="text-gray-400 mb-6">
            We detected your website platform. Choose the correct one and configure platform-specific settings.
        </p>

        {/* Platform Selection */}
        <div className="mb-6">
            <label className="block text-white font-medium mb-3">Website Platform</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(websiteTypes).map(([key, platform]) => (
                    <button
                        key={key}
                        onClick={() => {
                            updateWizardData('websiteType', key);
                            updateWizardData('platformSettings', platform.defaultSettings);
                        }}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                            wizardData.websiteType === key
                                ? 'border-blue-500 bg-blue-600 bg-opacity-20'
                                : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                        }`}
                    >
                        <div className="text-2xl mb-2">{platform.icon}</div>
                        <div className="text-white font-medium">{platform.name}</div>
                        <div className="text-gray-400 text-sm">{platform.description}</div>
                        {wizardData.detectedPlatform === key && (
                            <div className="text-green-400 text-xs mt-2">✓ Auto-detected</div>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Platform-Specific Settings */}
        {wizardData.websiteType && (
            <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="text-white font-medium mb-3">
                    {websiteTypes[wizardData.websiteType]?.icon} {websiteTypes[wizardData.websiteType]?.name} Settings
                </h4>
                
                <div className="space-y-4">
                    {/* Exclude Selectors */}
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">
                            Exclude CSS Selectors (Optional)
                        </label>
                        <input
                            type="text"
                            value={wizardData.platformSettings.excludeSelectors?.join(', ') || ''}
                            onChange={(e) => updateWizardData('platformSettings', {
                                excludeSelectors: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                            })}
                            placeholder=".admin-menu, #header-admin, .no-translate"
                            className="w-full p-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none text-sm"
                        />
                        <p className="text-gray-400 text-xs mt-1">
                            Elements matching these selectors will be excluded from translation
                        </p>
                    </div>

                    {/* Platform-specific checkboxes */}
                    <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={wizardData.platformSettings.includeHidden || false}
                                onChange={(e) => updateWizardData('platformSettings', {
                                    includeHidden: e.target.checked
                                })}
                                className="mr-2"
                            />
                            <span className="text-white text-sm">Include Hidden Content</span>
                        </label>

                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={wizardData.platformSettings.handleDynamicContent || false}
                                onChange={(e) => updateWizardData('platformSettings', {
                                    handleDynamicContent: e.target.checked
                                })}
                                className="mr-2"
                            />
                            <span className="text-white text-sm">Handle Dynamic Content</span>
                        </label>

                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={wizardData.platformSettings.translateAttributes || false}
                                onChange={(e) => updateWizardData('platformSettings', {
                                    translateAttributes: e.target.checked
                                })}
                                className="mr-2"
                            />
                            <span className="text-white text-sm">Translate Attributes</span>
                        </label>
                    </div>
                </div>
            </div>
        )}
    </div>
);

// Step 3: Content Selection
const Step3_ContentSelection = ({ wizardData, updateWizardData, analysisResults }) => (
    <div>
        <h3 className="text-xl font-bold text-white mb-4">📄 Content Selection</h3>
        <p className="text-gray-400 mb-6">
            Choose which types of content you want to translate from your website.
        </p>

        <div className="grid grid-cols-2 gap-4">
            {[
                { key: 'mainContent', label: 'Main Content', icon: '📝', desc: 'Articles, paragraphs, headings' },
                { key: 'navigation', label: 'Navigation', icon: '🧭', desc: 'Menus, breadcrumbs, links', detected: analysisResults?.hasNavigation },
                { key: 'footer', label: 'Footer', icon: '🦶', desc: 'Footer content and links', detected: analysisResults?.hasFooter },
                { key: 'forms', label: 'Forms', icon: '📋', desc: 'Form labels, placeholders, buttons', detected: analysisResults?.hasForms },
                { key: 'metadata', label: 'SEO Metadata', icon: '🏷️', desc: 'Meta tags, titles, descriptions' },
                { key: 'images', label: 'Image Alt Text', icon: '🖼️', desc: 'Alt text and image titles', detected: analysisResults?.hasImages > 0 },
                { key: 'buttons', label: 'Buttons & CTAs', icon: '🔘', desc: 'Button text and call-to-actions' },
                { key: 'sidebar', label: 'Sidebar', icon: '📌', desc: 'Sidebar widgets and content' },
                { key: 'popups', label: 'Popups & Modals', icon: '💬', desc: 'Modal dialogs and popups' },
                { key: 'comments', label: 'Comments', icon: '💭', desc: 'User comments and reviews' }
            ].map(({ key, label, icon, desc, detected }) => (
                <div
                    key={key}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        wizardData.contentTypes[key]
                            ? 'border-blue-500 bg-blue-600 bg-opacity-20'
                            : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                    onClick={() => updateWizardData('contentTypes', {
                        [key]: !wizardData.contentTypes[key]
                    })}
                >
                    <div className="flex items-start justify-between mb-2">
                        <div className="text-2xl">{icon}</div>
                        {detected && <div className="text-green-400 text-xs">✓ Found</div>}
                    </div>
                    <div className="text-white font-medium mb-1">{label}</div>
                    <div className="text-gray-400 text-sm">{desc}</div>
                </div>
            ))}
        </div>

        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h4 className="text-white font-medium mb-2">📊 Selection Summary</h4>
            <p className="text-gray-400 text-sm">
                {Object.values(wizardData.contentTypes).filter(Boolean).length} content types selected for translation
            </p>
        </div>
    </div>
);

// Step 4: Translation Settings
const Step4_TranslationSettings = ({ wizardData, updateWizardData }) => (
    <div>
        <h3 className="text-xl font-bold text-white mb-4">🔧 Translation Settings</h3>
        <p className="text-gray-400 mb-6">
            Configure advanced translation settings and content handling options.
        </p>

        <div className="space-y-6">
            {/* Exclude Patterns */}
            <div>
                <label className="block text-white font-medium mb-2">Exclude CSS Selectors</label>
                <textarea
                    value={wizardData.translationSettings.excludeSelectors.join('\n')}
                    onChange={(e) => updateWizardData('translationSettings', {
                        excludeSelectors: e.target.value.split('\n').filter(s => s.trim())
                    })}
                    placeholder=".no-translate&#10;#admin-bar&#10;.cookie-notice"
                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none h-24 text-sm"
                />
                <p className="text-gray-400 text-sm mt-1">
                    One CSS selector per line. Elements matching these selectors will be excluded.
                </p>
            </div>

            {/* Translation Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="text-white font-medium">Content Handling</h4>
                    
                    <label className="flex items-start">
                        <input
                            type="checkbox"
                            checked={wizardData.translationSettings.includeHidden}
                            onChange={(e) => updateWizardData('translationSettings', {
                                includeHidden: e.target.checked
                            })}
                            className="mr-3 mt-1"
                        />
                        <div>
                            <span className="text-white">Include Hidden Content</span>
                            <p className="text-gray-400 text-sm">Translate content that's hidden by CSS or JavaScript</p>
                        </div>
                    </label>

                    <label className="flex items-start">
                        <input
                            type="checkbox"
                            checked={wizardData.translationSettings.preserveFormatting}
                            onChange={(e) => updateWizardData('translationSettings', {
                                preserveFormatting: e.target.checked
                            })}
                            className="mr-3 mt-1"
                        />
                        <div>
                            <span className="text-white">Preserve Formatting</span>
                            <p className="text-gray-400 text-sm">Keep HTML tags and formatting in translations</p>
                        </div>
                    </label>

                    <label className="flex items-start">
                        <input
                            type="checkbox"
                            checked={wizardData.translationSettings.translateAttributes}
                            onChange={(e) => updateWizardData('translationSettings', {
                                translateAttributes: e.target.checked
                            })}
                            className="mr-3 mt-1"
                        />
                        <div>
                            <span className="text-white">Translate Attributes</span>
                            <p className="text-gray-400 text-sm">Translate alt text, titles, and other attributes</p>
                        </div>
                    </label>
                </div>

                <div className="space-y-4">
                    <h4 className="text-white font-medium">Advanced Options</h4>
                    
                    <label className="flex items-start">
                        <input
                            type="checkbox"
                            checked={wizardData.translationSettings.handleDynamicContent}
                            onChange={(e) => updateWizardData('translationSettings', {
                                handleDynamicContent: e.target.checked
                            })}
                            className="mr-3 mt-1"
                        />
                        <div>
                            <span className="text-white">Handle Dynamic Content</span>
                            <p className="text-gray-400 text-sm">Wait for JavaScript to load dynamic content</p>
                        </div>
                    </label>

                    <div>
                        <label className="block text-white font-medium mb-2">Content Priority</label>
                        <select
                            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                            defaultValue="balanced"
                        >
                            <option value="speed">Speed (Basic content only)</option>
                            <option value="balanced">Balanced (Recommended)</option>
                            <option value="comprehensive">Comprehensive (All content)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// Step 5: Crawling Options
const Step5_CrawlingOptions = ({ wizardData, updateWizardData, isProcessing, startTranslation }) => (
    <div>
        <h3 className="text-xl font-bold text-white mb-4">🕷️ Crawling Options</h3>
        <p className="text-gray-400 mb-6">
            Choose how many pages to translate and configure crawling behavior.
        </p>

        <div className="space-y-6">
            {/* Crawl Type */}
            <div>
                <label className="block text-white font-medium mb-3">Crawling Method</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { key: 'single', label: 'Single Page', icon: '📄', desc: 'Translate only the entered URL' },
                        { key: 'sitemap', label: 'Sitemap', icon: '🗺️', desc: 'Use sitemap.xml to find pages' },
                        { key: 'custom', label: 'Custom List', icon: '📝', desc: 'Provide specific URLs to translate' }
                    ].map(({ key, label, icon, desc }) => (
                        <button
                            key={key}
                            onClick={() => updateWizardData('crawlingOptions', { crawlType: key })}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                                wizardData.crawlingOptions.crawlType === key
                                    ? 'border-blue-500 bg-blue-600 bg-opacity-20'
                                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                            }`}
                        >
                            <div className="text-2xl mb-2">{icon}</div>
                            <div className="text-white font-medium">{label}</div>
                            <div className="text-gray-400 text-sm">{desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Sitemap URL */}
            {wizardData.crawlingOptions.crawlType === 'sitemap' && (
                <div>
                    <label className="block text-white font-medium mb-2">Sitemap URL</label>
                    <input
                        type="url"
                        value={wizardData.crawlingOptions.sitemapUrl}
                        onChange={(e) => updateWizardData('crawlingOptions', { sitemapUrl: e.target.value })}
                        placeholder="https://example.com/sitemap.xml"
                        className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                </div>
            )}

            {/* Custom URLs */}
            {wizardData.crawlingOptions.crawlType === 'custom' && (
                <div>
                    <label className="block text-white font-medium mb-2">URLs to Translate</label>
                    <textarea
                        placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
                        className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none h-32"
                    />
                    <p className="text-gray-400 text-sm mt-1">One URL per line</p>
                </div>
            )}

            {/* Crawling Limits */}
            {wizardData.crawlingOptions.crawlType !== 'single' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-white font-medium mb-2">Maximum Pages</label>
                        <input
                            type="number"
                            value={wizardData.crawlingOptions.maxPages}
                            onChange={(e) => updateWizardData('crawlingOptions', { maxPages: parseInt(e.target.value) || 10 })}
                            min="1"
                            max="1000"
                            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={wizardData.crawlingOptions.includeSubdomains}
                                onChange={(e) => updateWizardData('crawlingOptions', { includeSubdomains: e.target.checked })}
                                className="mr-2"
                            />
                            <span className="text-white">Include Subdomains</span>
                        </label>

                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={wizardData.crawlingOptions.followExternalLinks}
                                onChange={(e) => updateWizardData('crawlingOptions', { followExternalLinks: e.target.checked })}
                                className="mr-2"
                            />
                            <span className="text-white">Follow External Links</span>
                        </label>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="text-white font-medium mb-3">🎯 Translation Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-400">Method:</span>
                        <span className="text-white ml-2 capitalize">{wizardData.crawlingOptions.crawlType}</span>
                    </div>
                    <div>
                        <span className="text-gray-400">Max Pages:</span>
                        <span className="text-white ml-2">
                            {wizardData.crawlingOptions.crawlType === 'single' ? '1' : wizardData.crawlingOptions.maxPages}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400">Content Types:</span>
                        <span className="text-white ml-2">
                            {Object.values(wizardData.contentTypes).filter(Boolean).length} selected
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400">Platform:</span>
                        <span className="text-white ml-2 capitalize">{wizardData.websiteType}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);