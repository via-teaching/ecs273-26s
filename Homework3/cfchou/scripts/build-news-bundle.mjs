import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NEWS_DIR = path.join(__dirname, '..', 'data', 'stocknews');
const OUT_PATH = path.join(__dirname, '..', 'src', 'newsData.json');

const out = {};
let totalFiles = 0;

for (const symbol of fs.readdirSync(NEWS_DIR).sort()) {
  const dir = path.join(NEWS_DIR, symbol);
  if (!fs.statSync(dir).isDirectory()) continue;
  out[symbol] = [];
  for (const filename of fs.readdirSync(dir).sort()) {
    if (!filename.endsWith('.txt')) continue;
    const text = fs.readFileSync(path.join(dir, filename), 'utf-8');
    out[symbol].push({ filename, text });
    totalFiles += 1;
  }
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(out));
console.log(`Wrote ${OUT_PATH}`);
console.log(`  ${Object.keys(out).length} symbols · ${totalFiles} articles · ${(fs.statSync(OUT_PATH).size / 1024).toFixed(1)} KB`);
