import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const AutomatedWebsiteTranslation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [automatedSiteId, setAutomatedSiteId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    domain: '',
    source_language: 'en',
    target_languages: [],
    scan_interval: 300000, // 5 minutes
    url_structure: 'subdirectory',
    deployment_method: 'javascript',
    auto_publish: true,
    exclude_selectors: ['.no-translate', 'code', 'pre', 'script', 'style']
  });

  const steps = [
    { id: 1, title: 'Configure Website', completed: false },
    { id: 2, title: 'Select Languages', completed: false },
    { id: 3, title: 'Automation Settings', completed: false },
    { id: 4, title: 'Deploy & Monitor', completed: false },
    { id: 5, title: 'Live Translation!', completed: false }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' }
  ];

  const createAutomatedSite = async () => {
    setIsProcessing(true);
    try {
      const { data: site, error } = await supabase
        .from('automated_sites')
        .insert({
          domain: formData.domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
          source_language: formData.source_language,
          target_languages: formData.target_languages,
          scan_interval: formData.scan_interval,
          config: {
            urlStructure: formData.url_structure,
            deploymentMethod: formData.deployment_method,
            autoPublish: formData.auto_publish,
            excludeSelectors: formData.exclude_selectors,
            contentTypes: {
              mainContent: true,
              navigation: true,
              forms: true,
              metadata: true,
              images: true,
              buttons: true
            }
          },
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setAutomatedSiteId(site.id);
      setCurrentStep(4);
      
      // Start initial content scan
      await initiateContentScan(site.id);
      
    } catch (error) {
      console.error('Error creating automated site:', error);
      alert('Error setting up automated translation: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const initiateContentScan = async (siteId) => {
    try {
      // This would trigger the ContentDetectionEngine
      const response = await fetch('/api/automated-translation/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId })
      });
      
      if (!response.ok) {
        console.warn('Could not trigger initial scan via API, will rely on scheduled scanning');
      }
    } catch (error) {
      console.warn('Initial scan trigger failed, will rely on scheduled scanning:', error);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configure Your Website
        </h2>
        <p className="text-gray-600 mb-6">
          Enter your website domain to set up automated translation monitoring.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          WEBSITE DOMAIN
        </label>
        <input
          type="url"
          placeholder="https://www.yourwebsite.com"
          value={formData.domain}
          onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-2">
          We'll automatically monitor this website for content changes
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SOURCE LANGUAGE
        </label>
        <select
          value={formData.source_language}
          onChange={(e) => setFormData(prev => ({ ...prev, source_language: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 text-lg">🤖</span>
          <div>
            <h4 className="font-medium text-blue-900">Fully Automated Translation</h4>
            <p className="text-sm text-blue-700 mt-1">
              Our system will automatically detect content changes, translate them, and deploy updates to your website - no manual work required!
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setCurrentStep(2)}
          disabled={!formData.domain}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Target Languages</h2>
        <p className="text-gray-600 mb-6">
          Choose which languages you want your website automatically translated into.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          TARGET LANGUAGES
        </label>
        <select
          multiple
          value={formData.target_languages}
          onChange={(e) => {
            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
            setFormData(prev => ({ ...prev, target_languages: selectedOptions }));
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[200px] bg-white"
          size="8"
          style={{
            backgroundImage: 'none',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
        >
          {languages.filter(lang => lang.code !== formData.source_language).map(lang => (
            <option 
              key={lang.code} 
              value={lang.code} 
              className="py-2 px-3 hover:bg-blue-50"
              style={{
                padding: '8px 12px',
                fontSize: '14px'
              }}
            >
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Hold Ctrl/Cmd to select multiple languages
          </p>
          <p className="text-sm font-medium text-blue-600">
            Selected: {formData.target_languages.length} language(s)
          </p>
        </div>
        
        {/* Selected Languages Preview */}
        {formData.target_languages.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Selected Languages:</p>
            <div className="flex flex-wrap gap-2">
              {formData.target_languages.map(langCode => {
                const lang = languages.find(l => l.code === langCode);
                return (
                  <span 
                    key={langCode}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {lang?.flag} {lang?.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-green-600 text-lg">⚡</span>
          <div>
            <h4 className="font-medium text-green-900">Real-time Translation</h4>
            <p className="text-sm text-green-700 mt-1">
              Visitors can instantly switch between languages with zero page reloads. All translations are cached for lightning-fast performance.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          disabled={formData.target_languages.length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Automation Settings</h2>
        <p className="text-gray-600 mb-6">
          Configure how often we check for changes and how translations are deployed.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          SCAN FREQUENCY
        </label>
        <select
          value={formData.scan_interval}
          onChange={(e) => setFormData(prev => ({ ...prev, scan_interval: parseInt(e.target.value) }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value={60000}>Every minute (for testing)</option>
          <option value={300000}>Every 5 minutes</option>
          <option value={900000}>Every 15 minutes</option>
          <option value={1800000}>Every 30 minutes</option>
          <option value={3600000}>Every hour</option>
          <option value={21600000}>Every 6 hours</option>
          <option value={86400000}>Daily</option>
        </select>
        <p className="text-sm text-gray-500 mt-2">
          How often we check your website for content changes
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          URL STRUCTURE
        </label>
        <div className="space-y-3">
          <label className="flex items-start space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
            <input
              type="radio"
              name="url_structure"
              value="subdirectory"
              checked={formData.url_structure === 'subdirectory'}
              onChange={(e) => setFormData(prev => ({ ...prev, url_structure: e.target.value }))}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Subdirectories (Recommended)</div>
              <div className="text-sm text-gray-500">yoursite.com/es/ • yoursite.com/fr/</div>
            </div>
          </label>
          <label className="flex items-start space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
            <input
              type="radio"
              name="url_structure"
              value="subdomain"
              checked={formData.url_structure === 'subdomain'}
              onChange={(e) => setFormData(prev => ({ ...prev, url_structure: e.target.value }))}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Subdomains</div>
              <div className="text-sm text-gray-500">es.yoursite.com • fr.yoursite.com</div>
            </div>
          </label>
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.auto_publish}
            onChange={(e) => setFormData(prev => ({ ...prev, auto_publish: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="font-medium text-gray-900">Auto-publish translations</div>
            <div className="text-sm text-gray-500">Automatically deploy translations when they're ready (recommended)</div>
          </div>
        </label>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-yellow-600 text-lg">🔧</span>
          <div>
            <h4 className="font-medium text-yellow-900">Advanced Configuration</h4>
            <p className="text-sm text-yellow-700 mt-1">
              You can customize exclusion rules, content types, and deployment settings after setup.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(2)}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Previous
        </button>
        <button
          onClick={createAutomatedSite}
          disabled={isProcessing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          {isProcessing ? 'Setting up...' : 'Create Automated Site'}
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Deploy & Monitor</h2>
        <p className="text-gray-600 mb-6">
          Your automated translation system is being set up. Here's what happens next.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-green-600 text-2xl">✅</span>
          <div>
            <h3 className="font-semibold text-green-900">Automated Site Created!</h3>
            <p className="text-green-700">Site ID: {automatedSiteId}</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-green-800">
          <p><strong>Domain:</strong> {formData.domain}</p>
          <p><strong>Languages:</strong> {formData.source_language} → {formData.target_languages.join(', ')}</p>
          <p><strong>Scan Frequency:</strong> {formData.scan_interval / 60000} minutes</p>
          <p><strong>URL Structure:</strong> {formData.url_structure}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">What's happening now:</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-blue-600">🔍</span>
            <div>
              <div className="font-medium text-blue-900">Content Scanning</div>
              <div className="text-sm text-blue-700">Analyzing your website for translatable content</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
            <span className="text-yellow-600">🤖</span>
            <div>
              <div className="font-medium text-yellow-900">AI Translation</div>
              <div className="text-sm text-yellow-700">Processing content through our translation pipeline</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <span className="text-purple-600">🚀</span>
            <div>
              <div className="font-medium text-purple-900">Deployment</div>
              <div className="text-sm text-purple-700">Generating translation script for your website</div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => setCurrentStep(5)}
          className="px-8 py-4 bg-green-600 text-white rounded-lg font-medium text-lg hover:bg-green-700"
        >
          View Integration Instructions
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <span className="text-6xl">🎉</span>
        <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Live Translation Ready!</h2>
        <p className="text-gray-600 mb-6">
          Your automated translation system is now active. Follow these steps to integrate it with your website.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Integration Code</h3>
        <p className="text-sm text-gray-600 mb-4">
          Add this code to your website's &lt;head&gt; section:
        </p>
        
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <div className="whitespace-pre">{`<!-- Glossa Automated Translation -->
<script>
window.GlossaConfig = {
  siteId: "${automatedSiteId}",
  sourceLanguage: "${formData.source_language}",
  targetLanguages: ${JSON.stringify(formData.target_languages)},
  urlStructure: "${formData.url_structure}",
  apiEndpoint: "${window.location.origin}/api"
};
</script>
<script src="${window.location.origin}/js/glossa-translation-engine.js"></script>`}</div>
        </div>
        
        <button
          onClick={() => navigator.clipboard.writeText(`<!-- Glossa Automated Translation -->
<script>
window.GlossaConfig = {
  siteId: "${automatedSiteId}",
  sourceLanguage: "${formData.source_language}",
  targetLanguages: ${JSON.stringify(formData.target_languages)},
  urlStructure: "${formData.url_structure}",
  apiEndpoint: "${window.location.origin}/api"
};
</script>
<script src="${window.location.origin}/js/glossa-translation-engine.js"></script>`)}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          📋 Copy Code
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">🔄 Automatic Updates</h4>
          <p className="text-sm text-blue-700">
            We monitor your website every {formData.scan_interval / 60000} minutes for changes and automatically translate new content.
          </p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">⚡ Instant Switching</h4>
          <p className="text-sm text-green-700">
            Visitors can switch languages instantly with no page reloads. All translations are cached for speed.
          </p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-2">🎯 SEO Optimized</h4>
          <p className="text-sm text-purple-700">
            Meta tags, titles, and URLs are automatically translated for perfect multilingual SEO.
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">🛡️ Quality Assured</h4>
          <p className="text-sm text-yellow-700">
            All translations go through our quality checks and can be reviewed before going live.
          </p>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={() => navigate('/dashboard/admin/automated-translation-demo')}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
        >
          🎮 Try Live Demo
        </button>
        <button
          onClick={() => navigate(`/dashboard/automated-sites/${automatedSiteId}`)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Monitor Site
        </button>
        <button
          onClick={() => navigate('/dashboard/admin')}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg" style={{ minHeight: '100vh' }}>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Automated Translation
            </h1>
            <p className="text-gray-600 text-sm mb-8">
              Set up fully automated website translation like Weglot!
            </p>
            
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep > step.id 
                      ? 'bg-green-500 text-white' 
                      : currentStep === step.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  <span className={`text-sm ${
                    currentStep >= step.id ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>

            {currentStep === 5 && (
              <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  🚀 Your website is now multilingual! Add the integration code to see it in action.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
              {currentStep === 5 && renderStep5()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomatedWebsiteTranslation;