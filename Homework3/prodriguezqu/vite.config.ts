import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function parseNewsFile(rawText: string) {
  const lines = rawText.split(/\r?\n/);
  const title = lines.find((line) => line.startsWith("Title:"))?.replace("Title:", "").trim() ?? "";
  const date = lines.find((line) => line.startsWith("Date:"))?.replace("Date:", "").trim() ?? "";
  const contentIndex = rawText.indexOf("Content:");
  const content = contentIndex >= 0 ? rawText.slice(contentIndex + "Content:".length).trim() : "";

  return { title, date, content };
}

function buildNewsData() {
  const stocknewsRoot = path.resolve(__dirname, "data/stocknews");
  const newsData: Record<string, Array<{ id: string; title: string; date: string; content: string }>> = {};

  // I ran into the txt filename issue here, so this just reads the HW1 files directly at build time.
  // That made more sense to me than renaming the dataset or changing all the stocknews files.
  for (const ticker of fs.readdirSync(stocknewsRoot)) {
    const tickerDir = path.join(stocknewsRoot, ticker);
    if (!fs.statSync(tickerDir).isDirectory()) {
      continue;
    }

    const items = fs
      .readdirSync(tickerDir)
      .filter((fileName) => fileName.endsWith(".txt"))
      .map((fileName) => {
        const fullPath = path.join(tickerDir, fileName);
        const rawText = fs.readFileSync(fullPath, "utf-8");
        const parsed = parseNewsFile(rawText);

        return {
          id: `${ticker}/${fileName}`,
          title: parsed.title,
          date: parsed.date,
          content: parsed.content,
        };
      });

    newsData[ticker] = items;
  }

  return newsData;
}

function newsDataPlugin() {
  const virtualModuleId = "virtual:news-data";
  const resolvedVirtualModuleId = "\0virtual:news-data";

  return {
    name: "news-data-plugin",
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
      return null;
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const newsData = buildNewsData();
        return `export default ${JSON.stringify(newsData)};`;
      }
      return null;
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    newsDataPlugin(),
  ],
})
