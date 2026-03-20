// Categories API endpoint
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Return hardcoded categories for now
      const categories = [
        { id: '1', name: 'General' },
        { id: '2', name: 'News' },
        { id: '3', name: 'Tutorial' },
        { id: '4', name: 'Documentation' },
        { id: '5', name: 'Blog' }
      ];

      return res.status(200).json({
        success: true,
        data: categories
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Categories API Error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message
    });
  }
}