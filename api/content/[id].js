// Individual Content API endpoints
import { supabase } from '../../src/lib/supabase';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query } = req;
  const { id } = query;

  if (!id) {
    return res.status(400).json({ error: 'Content ID required' });
  }

  try {
    switch (method) {
      case 'GET':
        return await getContent(req, res, id);
      case 'PUT':
        return await updateContent(req, res, id);
      case 'DELETE':
        return await deleteContent(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Content API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// GET /api/content/:id - Get specific content
async function getContent(req, res, id) {
  try {
    const { language = 'en' } = req.query;

    // Get content with translation
    const { data, error } = await supabase.rpc('get_content_with_translation', {
      p_content_id: id,
      p_language: language
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Get all available translations
    const { data: translations, error: translationsError } = await supabase
      .from('content_translations')
      .select('language, title, body, slug')
      .eq('content_id', id);

    if (translationsError) throw translationsError;

    // Get categories
    const { data: categories, error: categoriesError } = await supabase
      .from('content_categories')
      .select('category_id, categories(id, name)')
      .eq('content_id', id);

    if (categoriesError) throw categoriesError;

    const result = {
      ...data[0],
      translations: translations || [],
      categories: categories?.map(c => c.categories) || []
    };

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    throw error;
  }
}

// PUT /api/content/:id - Update content
async function updateContent(req, res, id) {
  try {
    const { type, status, title, body, slug, language = 'en', categories = [] } = req.body;

    // Update content record if type or status changed
    if (type || status) {
      const updateData = {};
      if (type) updateData.type = type;
      if (status) updateData.status = status;

      const { error: contentError } = await supabase
        .from('contents')
        .update(updateData)
        .eq('id', id);

      if (contentError) throw contentError;
    }

    // Update translation if provided
    if (title || body || slug) {
      const translationData = {};
      if (title) translationData.title = title;
      if (body) translationData.body = body;
      if (slug) translationData.slug = slug;

      const { error: translationError } = await supabase
        .from('content_translations')
        .upsert({
          content_id: id,
          language,
          ...translationData
        });

      if (translationError) throw translationError;
    }

    // Update categories if provided
    if (categories.length >= 0) {
      // Delete existing categories
      await supabase
        .from('content_categories')
        .delete()
        .eq('content_id', id);

      // Add new categories
      if (categories.length > 0) {
        const categoryRecords = categories.map(categoryId => ({
          content_id: id,
          category_id: categoryId
        }));

        const { error: categoryError } = await supabase
          .from('content_categories')
          .insert(categoryRecords);

        if (categoryError) throw categoryError;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Content updated successfully'
    });
  } catch (error) {
    throw error;
  }
}

// DELETE /api/content/:id - Delete content
async function deleteContent(req, res, id) {
  try {
    const { error } = await supabase
      .from('contents')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    throw error;
  }
}