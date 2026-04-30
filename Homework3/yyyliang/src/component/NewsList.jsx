import { useState, useEffect } from "react";

// Scan all news txt files at build time
const newsFiles = import.meta.glob("../../data/stocknews/*/*.txt", {
  query: "?raw",
  import: "default",
  eager: true,
});

// Parse a file path into ticker and filename
function parsePath(path) {
  
  const parts = path.split("/");
  const ticker = parts[parts.length - 2];
  const filename = parts[parts.length - 1];
  return { ticker, filename };
}

// Parse the txt content and extract Title / Date / Content
function parseNewsContent(text) {
  const lines = text.split("\n");
  let title = "";
  let date = "";
  let content = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("Title:")) {
      title = line.replace("Title:", "").trim();
    } else if (line.startsWith("Date:")) {
      date = line.replace("Date:", "").trim();
    } else if (line.startsWith("Content:")) {
        
      content = lines.slice(i + 1).join("\n").trim();
      break;
    }
  }
  return { title, date, content };
}

export default function NewsList({ ticker }) {
  // List of news items for the current stock: [{title, date, content}, ...]
  const [news, setNews] = useState([]);
  // Index of the currently expanded news item (null = all collapsed)
  const [expandedIdx, setExpandedIdx] = useState(null);

  // Reload news whenever the selected ticker changes
  useEffect(() => {
    setExpandedIdx(null); // Collapse everything when switching stocks
    setNews([]);

    // Find all file paths belonging to this ticker
    const matchingPaths = Object.keys(newsFiles).filter((path) => {
      return parsePath(path).ticker === ticker;
    });

    // With eager: true, newsFiles[path] is the file content string itself
    const parsedNews = matchingPaths.map((path) => parseNewsContent(newsFiles[path]));
    parsedNews.sort((a, b) => (a.date < b.date ? 1 : -1));
    setNews(parsedNews);
  }, [ticker]);

  if (news.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-20">
        Loading news for {ticker}...
      </p>
    );
  }

  return (
    <div className="overflow-y-auto h-full p-2">
      {news.map((item, idx) => (
        <div
          key={idx}
          className="border-b border-gray-200 py-2 cursor-pointer hover:bg-gray-50"
          onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
        >
          <div className="font-semibold text-sm">{item.title}</div>
          <div className="text-xs text-gray-500 mt-1">{item.date}</div>
          {expandedIdx === idx && (
            <div className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}