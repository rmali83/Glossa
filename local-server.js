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
