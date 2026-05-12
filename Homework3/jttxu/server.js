import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const NEWS_DIR = path.join(__dirname, "data", "stocknews");

app.use(cors());

// 1. get the news list for one ticker
app.get("/api/news/:ticker", (req, res) => {
  const tickerDir = path.join(NEWS_DIR, req.params.ticker);
  if (!fs.existsSync(tickerDir)) return res.json([]);

  const files = fs.readdirSync(tickerDir).filter((f) => f.endsWith(".txt"));

  const newsList = files.map((filename) => {
    const filePath = path.join(tickerDir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const lines = raw.split(/\r?\n/);

    // get the date from file name
    const [datePart] = filename.split("_");

    // get the title from the content
    // find "Title"
    const titleLine = lines.find(l => l.trim().startsWith("Title:"));
    let title = "";
    if (titleLine) {
      title = titleLine.replace(/^Title:\s*/i, "").trim();
    } else {
      // if no title found, change to file name
      title = filename.replace(".txt", "").split("_").slice(1).join("_");
    }

    return {
      id: filename,
      date: datePart.replace(" ", "T").replace(/-(\d{2})$/, ":$1"),
      title,
      filename,
    };
  });

  // order by date
  newsList.sort((a, b) => b.date.localeCompare(a.date));
  res.json(newsList);
});

// 2. get the content for a news
app.get("/api/news/:ticker/:filename", (req, res) => {
  const filePath = path.join(NEWS_DIR, req.params.ticker, req.params.filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Not found" });

  const raw = fs.readFileSync(filePath, "utf-8");

  // cleaning
  let content = "";

  // find the start of content
  const separatorRegex = /^[-=*_]{3,}/m;
  const match = raw.match(separatorRegex);
  
  if (match) {
    content = raw.slice(match.index + match[0].length).trim();
  } 
  else {
    const lines = raw.split(/\r?\n/);
    let startIdx = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isMetadata = /^Title:|^Date:|^URL:|^http/i.test(line);
      
      if (line === "" || isMetadata) {
        continue;
      } else {
        startIdx = i;
        break;
      }
    }
    content = lines.slice(startIdx).join("\n").trim();
  }

  res.json({ content });
});

app.listen(3001, () => console.log("News API running on http://localhost:3001"));