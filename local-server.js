import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}
const dataFile = path.join(dataDir, 'translators.json');

// Mock CMS data storage
let cmsContent = [];
let cmsCategories = [
    { id: '1', name: 'General' },
    { id: '2', name: 'News' },
    { id: '3', name: 'Tutorial' },
    { id: '4', name: 'Documentation' },
    { id: '5', name: 'Blog' }
];

// CMS API Routes
app.get('/api/content', (req, res) => {
    try {
        console.log('GET /api/content - Fetching all content');
        res.json({
            success: true,
            data: cmsContent
        });
    } catch (error) {
        console.error('Error in GET /api/content:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/content', (req, res) => {
    try {
        console.log('POST /api/content - Creating content:', req.body);
        const { type, title, body, slug, language = 'en', categories = [] } = req.body;

        if (!type || !title || !body) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required fields: type, title, body' 
            });
        }

        const newContent = {
            id: Date.now().toString(),
            type,
            status: 'draft',
            title,
            body,
            slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            language,
            categories,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            available_languages: [language]
        };

        cmsContent.push(newContent);
        console.log('Content created successfully:', newContent.id);

        res.status(201).json({
            success: true,
            data: newContent
        });
    } catch (error) {
        console.error('Error in POST /api/content:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/categories', (req, res) => {
    try {
        console.log('GET /api/categories - Fetching categories');
        res.json({
            success: true,
            data: cmsCategories
        });
    } catch (error) {
        console.error('Error in GET /api/categories:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/onboarding', (req, res) => {
    const newData = req.body;

    let currentData = [];
    if (fs.existsSync(dataFile)) {
        try {
            const fileContent = fs.readFileSync(dataFile, 'utf8');
            currentData = JSON.parse(fileContent);
        } catch (e) {
            console.error("Error reading file", e);
        }
    }

    currentData.push({ ...newData, timestamp: new Date().toISOString() });

    fs.writeFileSync(dataFile, JSON.stringify(currentData, null, 2));
    console.log('Saved data to local file:', newData);

    res.json({ status: 'success', message: 'Data saved locally' });
});

app.listen(3001, () => {
    console.log('Local API server running on http://localhost:3001');
});
