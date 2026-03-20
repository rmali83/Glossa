// Content Management API endpoints
import { createClient } from '@supabase/supabase-js';

// Content Management API endpoints
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Simple test response first
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'API is working'
      });
    }

    if (req.method === 'POST') {
      const { type, title, body } = req.body;
      
      // Mock response for now
      return res.status(201).json({
        success: true,
        data: {
          id: Date.now().toString(),
          type: type || 'blog',
          title: title || 'Untitled',
          body: body || 'No content',
          status: 'draft',
          created_at: new Date().toISOString()
        },
        message: 'Content created successfully (mock)'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message,
      stack: error.stack
    });
  }
}