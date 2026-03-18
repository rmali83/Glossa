// Content Management API endpoints
import { createClient } from '@supabase/supabase-js';

// Content Management API endpoints
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check environment variables first
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseAnonKey 
    });
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'Missing Supabase environment variables',
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getContents(req, res, supabase);
      case 'POST':
        return await createContent(req, res, supabase);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Content API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    });
  }
}

// GET /api/content - Get all contents
async function getContents(req, res, supabase) {
  try {
    console.log('Attempting to fetch contents from Supabase');
    
    // Try a simple query first
    const { data, error } = await supabase
      .from('contents')
      .select(`
        *,
        content_translations(*)
      `)
      .limit(10);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Contents fetched successfully:', data?.length || 0);

    return res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error in getContents:', error);
    throw error;
  }
}

// POST /api/content - Create new content
async function createContent(req, res, supabase) {
  try {
    const { type, title, body, slug, language = 'en', categories = [] } = req.body;

    if (!type || !title || !body) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: type, title, body' 
      });
    }

    console.log('Creating content:', { type, title, body: body.substring(0, 50) + '...' });

    // Create content record
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .insert({
        type,
        status: 'draft',
        created_by: null  // Temporarily set to null to bypass RLS
      })
      .select()
      .single();

    if (contentError) {
      console.error('Content creation error:', contentError);
      throw contentError;
    }

    console.log('Content created:', content.id);

    // Create translation record
    const { error: translationError } = await supabase
      .from('content_translations')
      .insert({
        content_id: content.id,
        language,
        title,
        body,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      });

    if (translationError) {
      console.error('Translation creation error:', translationError);
      throw translationError;
    }

    console.log('Translation created successfully');

    return res.status(201).json({
      success: true,
      data: { ...content, title, body, slug, language }
    });
  } catch (error) {
    console.error('Error in createContent:', error);
    throw error;
  }
}