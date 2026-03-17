// Content Translation API endpoints
import { supabase } from '../../../../src/lib/supabase';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query } = req;
  const { id, lang } = query;

  if (!id || !lang) {
    return res.status(400).json({ error: 'Content ID and language required' });
  }

  try {
    switch (method) {
      case 'GET':
        return await getTranslation(req, res, id, lang);
      case 'POST':
        return await createTranslation(req, res, id, lang);
      case 'PUT':
        return await updateTranslation(req, res, id, lang);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
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

// GET /api/content/:id/translation/:lang - Get specific translation
async function getTranslation(req, res, id, lang) {
  try {
    const { data, error } = await supabase
      .from('content_translations')
      .select('*')
      .eq('content_id', id)
      .eq('language', lang)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    throw error;
  }
}

// POST /api/content/:id/translation/:lang - Create new translation
async function createTranslation(req, res, id, lang) {
  try {
    const { title, body, slug } = req.body;

    if (!title || !body) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, body' 
      });
    }

    const { data, error } = await supabase
      .from('content_translations')
      .insert({
        content_id: id,
        language: lang,
        title,
        body,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    throw error;
  }
}

// PUT /api/content/:id/translation/:lang - Update translation
async function updateTranslation(req, res, id, lang) {
  try {
    const { title, body, slug } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (body) updateData.body = body;
    if (slug) updateData.slug = slug;

    const { data, error } = await supabase
      .from('content_translations')
      .update(updateData)
      .eq('content_id', id)
      .eq('language', lang)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    throw error;
  }
}