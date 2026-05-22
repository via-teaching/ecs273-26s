// Run once with: node scripts/buildNews.js
// Reads all news .txt files and writes data/newsData.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const newsRoot = path.resolve(__dirname, '../data/stocknews');
const outFile  = path.resolve(__dirname, '../data/newsData.json');

const result = {};

for (const ticker of fs.readdirSync(newsRoot)) {
    const tickerDir = path.join(newsRoot, ticker);
    if (!fs.statSync(tickerDir).isDirectory()) continue;

    result[ticker] = [];

    for (const filename of fs.readdirSync(tickerDir)) {
        if (!filename.endsWith('.txt')) continue;

        const raw = fs.readFileSync(path.join(tickerDir, filename), 'utf-8');

        let title = '', date = '', content = '';
        let inContent = false;
        for (const line of raw.split('\n')) {
            if (line.startsWith('Title: '))       title = line.slice(7).trim();
            else if (line.startsWith('Date: '))   date  = line.slice(6).trim();
            else if (line.startsWith('Content:')) inContent = true;
            else if (inContent)                   content += line + '\n';
        }

        result[ticker].push({ title, date, content: content.trim() });
    }

    result[ticker].sort((a, b) => new Date(b.date) - new Date(a.date));
}

fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
console.log(`Written to ${outFile}`);
