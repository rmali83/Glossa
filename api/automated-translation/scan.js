// API endpoint to trigger content scanning for automated translation
import { supabase } from '../../src/lib/supabase';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { siteId } = req.body;

    if (!siteId) {
      return res.status(400).json({ error: 'Site ID required' });
    }

    // Get site configuration
    const { data: site, error: siteError } = await supabase
      .from('automated_sites')
      .select('*')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Update last scan timestamp
    const { error: updateError } = await supabase
      .from('automated_sites')
      .update({ last_scan: new Date().toISOString() })
      .eq('id', siteId);

    if (updateError) {
      console.error('Error updating scan timestamp:', updateError);
    }

    // In a real implementation, this would trigger the ContentDetectionEngine
    // For now, we'll just return a success response
    console.log(`Scan triggered for site ${siteId} (${site.domain})`);

    return res.status(200).json({
      success: true,
      message: 'Content scan initiated',
      siteId: siteId,
      domain: site.domain
    });

  } catch (error) {
    console.error('Scan API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}