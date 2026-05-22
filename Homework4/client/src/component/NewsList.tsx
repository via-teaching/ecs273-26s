import { useEffect, useState } from "react";

interface NewsItem {
  Stock: string;
  Title: string;
  Date: string;
  content: string;
}

const API_BASE = "http://127.0.0.1:8000";

function formatDate(d: string) {
  if (!d) return "";

  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

function cleanTitle(title: string) {
  return title
    .replace(/\.txt$/i, "")
    .replace(/^\d{4}-\d{2}-\d{2}_\d{2}_\d{2}_/, "")
    .replace(/_/g, " ")
    .trim();
}

function cleanArticleText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export default function NewsList({ stock }: { stock: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stock) return;

    setExpanded(null);
    setLoading(true);

    fetch(`${API_BASE}/stocknews/?stock_name=${stock}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Could not load news");
        }
        return res.json();
      })
      .then((data) => {
        setNews(data.News ?? []);
        setLoading(false);
      })
      .catch(() => {
        setNews([]);
        setLoading(false);
      });
  }, [stock]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-xs text-gray-600">
        Loading news for {stock}...
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-xs text-gray-600">
        No news found for {stock}.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-300">
      {news.map((item, index) => {
        const isOpen = expanded === index;

        return (
          <div
            key={index}
            className={`transition-colors ${
              isOpen ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : index)}
              className="w-full text-left px-4 py-3 flex items-start gap-3 focus:outline-none"
            >
              <span
                className="mt-0.5 flex-shrink-0 text-gray-500 text-xs"
                style={{
                  display: "inline-block",
                  transition: "transform 0.2s",
                  transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                ▶
              </span>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-snug ${
                    isOpen ? "text-black" : "text-gray-800 truncate"
                  }`}
                >
                  {cleanTitle(item.Title)}
                </p>

                <span className="text-xs text-emerald-600">
                  {formatDate(item.Date)}
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pl-10 text-xs text-gray-700 leading-relaxed">
                <p className="whitespace-pre-line">
                  {cleanArticleText(item.content)}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}