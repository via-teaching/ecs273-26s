import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const newsDir = path.join(__dirname, "../data/stocknews");
const output = {};

for (const stock of fs.readdirSync(newsDir)) {
  const stockDir = path.join(newsDir, stock);
  if (!fs.statSync(stockDir).isDirectory()) continue;

  output[stock] = [];

  for (const file of fs.readdirSync(stockDir)) {
    if (!file.endsWith(".txt")) continue;
    const raw = fs.readFileSync(path.join(stockDir, file), "utf8");
    const lines = raw.split("\n");
    const title = lines.find(l => l.startsWith("Title:"))?.replace("Title:", "").trim() || "";
    const date  = lines.find(l => l.startsWith("Date:"))?.replace("Date:", "").trim() || "";
    const contentIdx = lines.findIndex(l => l.startsWith("Content:"));
    const rawBody = contentIdx >= 0 ? lines.slice(contentIdx + 1) : [];

    // Sidebar headlines are short one-liners (under 150 chars).
    // The real article starts at the first line that is long enough to be a paragraph.
    const firstRealIdx = rawBody.findIndex(l => l.trim().length >= 150);

    // If we found a real paragraph, keep from there; otherwise keep everything
    const articleLines = firstRealIdx >= 0 ? rawBody.slice(firstRealIdx) : rawBody;

    // Also strip trailing boilerplate lines
    const JUNK = ["Sign in to access your portfolio", "Tip: Try a valid symbol"];
    const body = articleLines
      .filter(l => !JUNK.some(j => l.includes(j)))
      .join("\n")
      .trim();
    output[stock].push({ title, date, body });
  }

  output[stock].sort((a, b) => new Date(b.date) - new Date(a.date));
}

fs.writeFileSync(
  path.join(__dirname, "../data/newsdata.json"),
  JSON.stringify(output)
);
console.log("Done! newsdata.json written.");
