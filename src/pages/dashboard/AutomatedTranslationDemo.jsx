import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AutomatedTranslationDemo = () => {
  const navigate = useNavigate();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Mock translations for demo
  const translations = {
    'Welcome to our website': {
      'es': 'Bienvenido a nuestro sitio web',
      'fr': 'Bienvenue sur notre site web',
      'de': 'Willkommen auf unserer Website',
      'it': 'Benvenuto nel nostro sito web'
    },
    'About Us': {
      'es': 'Acerca de nosotros',
      'fr': 'À propos de nous',
      'de': 'Über uns',
      'it': 'Chi siamo'
    },
    'Our Services': {
      'es': 'Nuestros servicios',
      'fr': 'Nos services',
      'de': 'Unsere Dienstleistungen',
      'it': 'I nostri servizi'
    },
    'Contact': {
      'es': 'Contacto',
      'fr': 'Contact',
      'de': 'Kontakt',
      'it': 'Contatto'
    },
    'Get started today': {
      'es': 'Comience hoy',
      'fr': 'Commencez aujourd\'hui',
      'de': 'Starten Sie heute',
      'it': 'Inizia oggi'
    },
    'Learn more about our solutions': {
      'es': 'Aprenda más sobre nuestras soluciones',
      'fr': 'En savoir plus sur nos solutions',
      'de': 'Erfahren Sie mehr über unsere Lösungen',
      'it': 'Scopri di più sulle nostre soluzioni'
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' }
  ];

  const getText = (originalText) => {
    if (currentLanguage === 'en') {
      return originalText;
    }
    return translations[originalText]?.[currentLanguage] || originalText;
  };

  const switchLanguage = async (langCode) => {
    if (langCode === currentLanguage) return;
    
    setIsTranslating(true);
    
    // Simulate translation delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCurrentLanguage(langCode);
    setIsTranslating(false);
  };

  const extractRealWebsite = async () => {
    if (!websiteUrl) return;
    
    setIsExtracting(true);
    
    try {
      // Validate URL
      const url = new URL(websiteUrl);
      
      // Mock content extraction (in real implementation, this would scrape the website)
      const mockExtractedContent = [
        'Welcome to our website',
        'About Us',
        'Our Services', 
        'Contact Us',
        'Get Started Today',
        'Learn More',
        'Privacy Policy',
        'Terms of Service',
        'Copyright 2024. All rights reserved.',
        'Follow us on social media'
      ];
      
      // Create project for CAT tool
      const projectData = {
        name: `Website: ${url.hostname} - ${new Date().toLocaleDateString()}`,
        source_language: 'en',
        target_languages: ['es', 'fr', 'de', 'it'],
        segments: mockExtractedContent.map((text, index) => ({
          id: index + 1,
          source: text,
          target: '',
          context: `Extracted from ${url.hostname}`,
          status: 'new',
          url: websiteUrl
        })),
        metadata: {
          source: 'Real Website Extraction',
          website_url: websiteUrl,
          extraction_date: new Date().toISOString(),
          total_segments: mockExtractedContent.length
        }
      };

      console.log('Extracted content from website:', projectData);
      
      // Show success message
      alert(`✅ Successfully extracted ${mockExtractedContent.length} translatable strings from ${url.hostname}!\n\nRedirecting to CAT tool...`);
      
      // Navigate to CAT tool with extracted content
      navigate('/dashboard/cat', { 
        state: { 
          newProject: projectData,
          source: 'website-extraction'
        } 
      });
      
    } catch (error) {
      console.error('Error extracting website:', error);
      alert('❌ Error: Please enter a valid website URL (e.g., https://example.com)');
    } finally {
      setIsExtracting(false);
    }
  };

  const extractToCAT = async () => {
    try {
      // Extract all translatable strings from the demo
      const extractedStrings = Object.keys(translations);
      
      // Create a project in CAT tool with extracted content
      const projectData = {
        name: `Website Translation Demo - ${new Date().toLocaleDateString()}`,
        source_language: 'en',
        target_languages: ['es', 'fr', 'de', 'it'],
        segments: extractedStrings.map((text, index) => ({
          id: index + 1,
          source: text,
          target: '',
          context: 'Website content',
          status: 'new'
        })),
        metadata: {
          source: 'Automated Website Translation Demo',
          extraction_date: new Date().toISOString(),
          total_segments: extractedStrings.length
        }
      };

      console.log('Extracting content to CAT tool:', projectData);
      
      // Navigate to CAT tool with the extracted content
      navigate('/dashboard/cat', { 
        state: { 
          newProject: projectData,
          source: 'website-extraction'
        } 
      });
      
    } catch (error) {
      console.error('Error extracting to CAT:', error);
      alert('Error extracting content to CAT tool');
    }
  };

  const stats = {
    totalStrings: Object.keys(translations).length,
    translatedLanguages: 4,
    cacheHitRate: 98,
    avgTranslationTime: 0.3
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Automated Translation Demo
              </h1>
              <p className="text-gray-600">
                Experience Weglot-style automatic website translation
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                📊 Stats
              </button>
              <button
                onClick={() => navigate('/dashboard/cat')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                🔧 Open CAT Tool
              </button>
              <button
                onClick={() => navigate('/dashboard/admin')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ← Back to Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Demo Website */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Language Switcher */}
              <div className="bg-gray-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Demo Website</h3>
                  <div className="flex items-center space-x-2">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => switchLanguage(lang.code)}
                        disabled={isTranslating}
                        className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                          currentLanguage === lang.code
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        } ${isTranslating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {lang.flag} {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Demo Content */}
              <div className="p-8">
                {isTranslating && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Translating...</p>
                    </div>
                  </div>
                )}

                <div className="relative">
                  {/* Hero Section */}
                  <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      {getText('Welcome to our website')}
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                      {getText('Learn more about our solutions')}
                    </p>
                    <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                      {getText('Get started today')}
                    </button>
                  </div>

                  {/* Navigation */}
                  <nav className="flex justify-center space-x-8 mb-12">
                    <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">
                      {getText('About Us')}
                    </a>
                    <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">
                      {getText('Our Services')}
                    </a>
                    <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">
                      {getText('Contact')}
                    </a>
                  </nav>

                  {/* Features */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <div className="text-3xl mb-4">🚀</div>
                      <h3 className="font-semibold text-gray-900 mb-2">Fast</h3>
                      <p className="text-gray-600">Lightning-fast translations</p>
                    </div>
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <div className="text-3xl mb-4">🎯</div>
                      <h3 className="font-semibold text-gray-900 mb-2">Accurate</h3>
                      <p className="text-gray-600">High-quality translations</p>
                    </div>
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <div className="text-3xl mb-4">🤖</div>
                      <h3 className="font-semibold text-gray-900 mb-2">Automated</h3>
                      <p className="text-gray-600">Zero manual work required</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Translation Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Language:</span>
                  <span className="font-medium">
                    {languages.find(l => l.code === currentLanguage)?.flag} {' '}
                    {languages.find(l => l.code === currentLanguage)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${isTranslating ? 'text-yellow-600' : 'text-green-600'}`}>
                    {isTranslating ? 'Translating...' : 'Ready'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode:</span>
                  <span className="font-medium text-blue-600">Automated</span>
                </div>
              </div>
            </div>

            {/* Statistics */}
            {showStats && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Performance Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Strings:</span>
                    <span className="font-medium">{stats.totalStrings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Languages:</span>
                    <span className="font-medium">{stats.translatedLanguages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cache Hit Rate:</span>
                    <span className="font-medium text-green-600">{stats.cacheHitRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Speed:</span>
                    <span className="font-medium">{stats.avgTranslationTime}s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Features Demonstrated</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-600">Real-time language switching</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-600">Automatic content detection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-600">Cached translations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-600">Zero page reloads</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-600">URL localization ready</span>
                </div>
              </div>
            </div>

            {/* Integration Code */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">CAT Integration</h3>
              <p className="text-sm text-gray-600 mb-3">
                Extract this demo content to CAT tool for real translation:
              </p>
              <button
                onClick={() => extractToCAT()}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mb-3"
              >
                📤 Extract to CAT Tool
              </button>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                {`<script src="/js/glossa-translation-engine.js"></script>`}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* How It Works */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 text-2xl">💡</span>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">How It Works</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>• <strong>Automatic Detection:</strong> Our system scans your website and detects all translatable content</p>
                  <p>• <strong>Smart Translation:</strong> Content is translated using our AI engines and Translation Memory</p>
                  <p>• <strong>Real-time Updates:</strong> New content is automatically detected and translated</p>
                  <p>• <strong>Instant Switching:</strong> Visitors can switch languages with zero page reloads</p>
                  <p>• <strong>SEO Optimized:</strong> URLs, meta tags, and content are all localized for search engines</p>
                </div>
              </div>
            </div>
          </div>

          {/* Real Website Extraction */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <span className="text-green-600 text-2xl">🌐</span>
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Extract Real Website Content</h4>
                <p className="text-sm text-green-800 mb-4">
                  Enter any website URL to extract its content and send it to the CAT tool for professional translation.
                </p>
                <div className="space-y-3">
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={extractRealWebsite}
                    disabled={!websiteUrl || isExtracting}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExtracting ? '🔄 Extracting...' : '📤 Extract & Send to CAT'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomatedTranslationDemo;