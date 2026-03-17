// Content Status API endpoint
import { supabase } from '../../../src/lib/supabase';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req;
  const { id } = query;

  if (!id) {
    return res.status(400).json({ error: 'Content ID required' });
  }

  try {
    const { status } = req.body;

    if (!status || !['draft', 'review', 'approved', 'published'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be: draft, review, approved, or published' 
      });
    }

    const { data, error } = await supabase
      .from('contents')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Status API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}