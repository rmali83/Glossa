export default function handler(request, response) {
    if (request.method === 'POST') {
        const data = request.body;

        // In production (Vercel), we log to the console which is viewable in the dashboard.
        // For a real app, you would connect to a database here (MongoDB, Postgres, etc.)
        console.log('[Vercel Log] New Translator Applicant:', JSON.stringify(data, null, 2));

        return response.status(200).json({
            status: 'success',
            message: 'Application received successfully'
        });
    } else {
        return response.status(405).json({ error: 'Method not allowed' });
    }
}
