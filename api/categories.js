// Categories API endpoint
import { createClient } from '@supabase/supabase-js';

// Create Supabase client directly in the API route
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getCategories(req, res);
      case 'POST':
        return await createCategory(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Categories API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    });
  }
}

// GET /api/categories - Get all categories
async function getCategories(req, res) {
  try {
    console.log('Fetching categories from Supabase');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Supabase categories error:', error);
      throw error;
    }

    console.log('Categories fetched:', data?.length || 0);

    return res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error in getCategories:', error);
    throw error;
  }
}

// POST /api/categories - Create new category
async function createCategory(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false,
        error: 'Category name is required' 
      });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({ name })
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