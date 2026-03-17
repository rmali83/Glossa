// Content Management API endpoints
import { supabaseServer } from '../../src/lib/supabase-server';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getContents(req, res);
      case 'POST':
        return await createContent(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
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

// GET /api/content - Get all contents
async function getContents(req, res) {
  try {
    const { data, error } = await supabaseServer.rpc('get_all_contents_with_translations');

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (error) {
    throw error;
  }
}

// POST /api/content - Create new content
async function createContent(req, res) {
  try {
    const { type, title, body, slug, language = 'en', categories = [] } = req.body;

    if (!type || !title || !body) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, title, body' 
      });
    }

    // Create content record using service role (bypasses RLS)
    const { data: content, error: contentError } = await supabaseServer
      .from('contents')
      .insert({
        type,
        status: 'draft'
      })
      .select()
      .single();

    if (contentError) throw contentError;

    // Create translation record
    const { error: translationError } = await supabaseServer
      .from('content_translations')
      .insert({
        content_id: content.id,
        language,
        title,
        body,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      });

    if (translationError) throw translationError;

    // Add categories if provided
    if (categories.length > 0) {
      const categoryRecords = categories.map(categoryId => ({
        content_id: content.id,
        category_id: categoryId
      }));

      const { error: categoryError } = await supabaseServer
        .from('content_categories')
        .insert(categoryRecords);

      if (categoryError) throw categoryError;
    }

    return res.status(201).json({
      success: true,
      data: { ...content, title, body, slug, language }
    });
  } catch (error) {
    throw error;
  }
}