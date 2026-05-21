import { useEffect, useState } from "react";

import { NewsItem } from "../types";

interface NewsListProps {
  selectedStock: string;
  onItems?: (items: NewsItem[]) => void;
}

interface RawNewsResponse {
  Stock?: string;
  News?: Array<{
    Stock: string;
    Title: string;
    Date: string;
    URL?: string | null;
    content?: string;
  }>;
}

export default function NewsList({ selectedStock, onItems }: NewsListProps) {
  const [expandedTitle, setExpandedTitle] = useState<string | null>(null);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setError(null);
    setExpandedTitle(null);

    const ticker = selectedStock.toUpperCase();
    fetch(`http://localhost:8000/stocknews/?stock_name=${encodeURIComponent(ticker)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
        return res.json() as Promise<RawNewsResponse>;
      })
      .then((payload) => {
        if (!isActive) return;
        const loadedItems: NewsItem[] = (payload?.News ?? [])
          .map((article) => ({
            ticker: article.Stock || ticker,
            title: article.Title || "Untitled",
            date: article.Date || "",
            url: article.URL || undefined,
            content: article.content || "",
          }))
          .sort((a, b) => b.date.localeCompare(a.date));
        setItems(loadedItems);
        setExpandedTitle(loadedItems[0]?.title ?? null);
        onItems?.(loadedItems);
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : String(err));
        setItems([]);
        onItems?.([]);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [selectedStock, onItems]);

  if (loading) {
    return (
      <div className="h-full w-full overflow-y-auto p-4 text-sm text-slate-500">
        Loading news for <span className="font-semibold">{selectedStock}</span> from API...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full overflow-y-auto p-4 text-sm text-red-700">
        Failed to load news for <span className="font-semibold">{selectedStock}</span>: {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-full w-full overflow-y-auto p-4 text-sm text-slate-500">
        No articles returned for <span className="font-semibold">{selectedStock}</span>.
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto p-2">
      {items.map((item) => {
        const expanded = expandedTitle === item.title;
        return (
          <article
            key={`${item.date}-${item.title}`}
            className="mb-2 rounded-lg border border-slate-300 bg-white p-3 shadow-sm"
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setExpandedTitle(expanded ? null : item.title)}
            >
              <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
              <p className="mt-1 text-xs text-slate-500">{item.date}</p>
            </button>
            {expanded && (
              <div className="mt-3 border-t border-slate-200 pt-2">
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-700 underline"
                  >
                    Open original article
                  </a>
                )}
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.content}</p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
