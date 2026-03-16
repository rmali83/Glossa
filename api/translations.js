// API endpoint for automated translation system
import { supabase } from '../src/lib/supabase';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;
  const { siteId } = req.query;

  try {
    switch (method) {
      case 'GET':
        // Get translations for a site
        if (!siteId) {
          return res.status(400).json({ error: 'Site ID required' });
        }

        const { data: translations, error: translationsError } = await supabase
          .from('string_cache')
          .select('source_text, target_text, target_language')
          .eq('site_id', siteId);

        if (translationsError) {
          throw translationsError;
        }

        // Format translations for client
        const formattedTranslations = {};
        translations.forEach(({ source_text, target_text, target_language }) => {
          if (!formattedTranslations[source_text]) {
            formattedTranslations[source_text] = {};
          }
          formattedTranslations[source_text][target_language] = target_text;
        });

        return res.status(200).json({
          success: true,
          translations: formattedTranslations
        });

      case 'POST':
        // Request translations for new text
        const { texts, sourceLanguage, targetLanguages } = req.body;

        if (!siteId || !texts || !sourceLanguage || !targetLanguages) {
          return res.status(400).json({ 
            error: 'Missing required fields: siteId, texts, sourceLanguage, targetLanguages' 
          });
        }

        // For now, return empty translations (the actual translation would be handled by the pipeline)
        // In a real implementation, this would queue the texts for translation
        const mockTranslations = {};
        texts.forEach(text => {
          mockTranslations[text] = {};
          targetLanguages.forEach(lang => {
            // Mock translation - in reality this would come from the translation pipeline
            mockTranslations[text][lang] = `[${lang.toUpperCase()}] ${text}`;
          });
        });

        return res.status(200).json({
          success: true,
          translations: mockTranslations
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Translation API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}