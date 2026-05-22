import React, { useEffect, useState } from "react";

interface Props {
  selectedStock: string;
}

interface NewsItem {
  id: string;
  title: string;
  date: string;
  content: string;
}

const newsModules = import.meta.glob(
  "../../data/stocknews/**/*.txt",
  {
    query: "?raw",
    import: "default",
    eager: true,
  }
);

function parseNews(stock: string): NewsItem[] {
  const results: NewsItem[] = [];

  for (const path in newsModules) {
    if (!path.includes(`/stocknews/${stock}/`)) {
      continue;
    }

    const rawText = newsModules[path] as string;
    const lines = rawText.split("\n");

    let title = "Untitled News";
    if (lines.length > 0 && lines[0].startsWith("Title:")) {
      title = lines[0].replace("Title:", "").trim();
    }

    const dateMatch = path.match(/\d{4}_\d{2}_\d{2}/);
    const date = dateMatch ? dateMatch[0].replace(/_/g, "-") : "Unknown Date";
    const content = lines.slice(3).join("\n").trim();

    results.push({
      id: path,
      title,
      date,
      content,
    });
  }

  results.sort((a, b) => b.date.localeCompare(a.date));

  return results;
}

export default function NewsList({
  selectedStock,
}: Props) {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStock) {
      setNewsData([]);
      return;
    }

    const parsedNews = parseNews(selectedStock);
    setNewsData(parsedNews);
    setExpandedId(null);
  }, [selectedStock]);

  return (
    <div className="flex flex-col gap-2">
      {newsData.length === 0 && (
        <p className="text-gray-500 text-sm">
          No news available.
        </p>
      )}

      {newsData.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded shadow border border-gray-200 overflow-hidden"
        >
          {/* Header*/}
          <button
            className="w-full text-left p-3 hover:bg-gray-50 transition-colors focus:outline-none"
            onClick={() =>
              setExpandedId(
                expandedId === item.id ? null : item.id
              )
            }
          >
            <h3 className="font-semibold text-sm">
              {item.title}
            </h3>

            <span className="text-xs text-gray-500">
              {item.date}
            </span>
          </button>

          {/* Content */}
          {expandedId === item.id && (
            <div className="p-3 border-t border-gray-100 text-sm text-gray-700 bg-gray-50 whitespace-pre-wrap">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}