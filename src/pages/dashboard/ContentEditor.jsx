import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ContentEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = id === 'new';

  const [content, setContent] = useState({
    type: 'blog',
    status: 'draft',
    categories: []
  });
  const [translations, setTranslations] = useState({
    en: { title: '', body: '', slug: '' }
  });
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' }
  ];

  useEffect(() => {
    fetchCategories();
    if (!isNew) {
      fetchContent();
    }
  }, [id, isNew]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/content/${id}`);
      const result = await response.json();
      
      if (result.success) {
        const data = result.data;
        setContent({
          type: data.type,
          status: data.status,
          categories: data.categories?.map(c => c.id) || []
        });

        // Build translations object
        const translationsObj = {};
        data.translations.forEach(t => {
          translationsObj[t.language] = {
            title: t.title,
            body: t.body,
            slug: t.slug
          };
        });
        setTranslations(translationsObj);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newStatus = null) => {
    setSaving(true);
    try {
      const currentTranslation = translations[activeLanguage];
      if (!currentTranslation?.title || !currentTranslation?.body) {
        alert('Please fill in title and body');
        return;
      }

      const payload = {
        type: content.type,
        status: newStatus || content.status,
        title: currentTranslation.title,
        body: currentTranslation.body,
        slug: currentTranslation.slug || currentTranslation.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        language: activeLanguage,
        categories: content.categories
      };

      let response;
      if (isNew) {
        response = await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`/api/content/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const result = await response.json();
      if (result.success) {
        if (isNew) {
          navigate(`/dashboard/admin/content/${result.data.id}`);
        } else {
          alert('Content saved successfully!');
          fetchContent(); // Refresh data
        }
      }
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error saving content');
    } finally {
      setSaving(false);
    }
  };

  const handleTranslate = async (targetLanguage) => {
    if (!translations.en?.title || !translations.en?.body) {
      alert('Please fill in English content first');
      return;
    }

    try {
      // Mock translation - in real implementation, this would call your CAT tool API
      const mockTranslation = {
        title: `[${targetLanguage.toUpperCase()}] ${translations.en.title}`,
        body: `[${targetLanguage.toUpperCase()}] ${translations.en.body}`,
        slug: translations.en.slug
      };

      setTranslations(prev => ({
        ...prev,
        [targetLanguage]: mockTranslation
      }));

      setActiveLanguage(targetLanguage);
      alert(`Content translated to ${targetLanguage.toUpperCase()}! (This is a mock translation)`);
    } catch (error) {
      console.error('Error translating content:', error);
      alert('Error translating content');
    }
  };

  const updateTranslation = (field, value) => {
    setTranslations(prev => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  const currentTranslation = translations[activeLanguage] || { title: '', body: '', slug: '' };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNew ? 'Create Content' : 'Edit Content'}
              </h1>
              <p className="text-gray-600">
                {isNew ? 'Create new multilingual content' : 'Edit and manage translations'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                💾 Save Draft
              </button>
              <button
                onClick={() => handleSave('published')}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                🌐 Publish
              </button>
              <button
                onClick={() => navigate('/dashboard/admin/content')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              {/* Language Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex space-x-1">
                    {languages.slice(0, 6).map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => setActiveLanguage(lang.code)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeLanguage === lang.code
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {lang.flag} {lang.code.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Translate to:</span>
                    <select
                      onChange={(e) => e.target.value && handleTranslate(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                      value=""
                    >
                      <option value="">Select language...</option>
                      {languages.filter(l => l.code !== 'en' && !translations[l.code]).map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Content Form */}
              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title ({activeLanguage.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={currentTranslation.title}
                    onChange={(e) => updateTranslation('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="Enter title..."
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug ({activeLanguage.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={currentTranslation.slug}
                    onChange={(e) => updateTranslation('slug', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="url-friendly-slug"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content ({activeLanguage.toUpperCase()})
                  </label>
                  <textarea
                    value={currentTranslation.body}
                    onChange={(e) => updateTranslation('body', e.target.value)}
                    rows={15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Write your content here..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Content Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
              
              {/* Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={content.type}
                  onChange={(e) => setContent(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="blog">📝 Blog</option>
                  <option value="page">📄 Page</option>
                  <option value="article">📰 Article</option>
                </select>
              </div>

              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={content.status}
                  onChange={(e) => setContent(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">📝 Draft</option>
                  <option value="review">👀 Review</option>
                  <option value="approved">✅ Approved</option>
                  <option value="published">🌐 Published</option>
                </select>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {categories.map(category => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={content.categories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setContent(prev => ({
                              ...prev,
                              categories: [...prev.categories, category.id]
                            }));
                          } else {
                            setContent(prev => ({
                              ...prev,
                              categories: prev.categories.filter(id => id !== category.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Translation Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Translations</h3>
              <div className="space-y-2">
                {languages.slice(0, 6).map(lang => (
                  <div key={lang.code} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {lang.flag} {lang.name}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      translations[lang.code]?.title 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {translations[lang.code]?.title ? '✓ Done' : '○ Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;