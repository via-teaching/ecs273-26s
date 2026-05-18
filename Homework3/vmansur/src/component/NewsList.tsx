import { useEffect, useState } from "react";

import { NewsItem } from "../types";
import { getNewsDataByTicker } from "./dataLoader";

interface NewsListProps {
  selectedStock: string;
}

export default function NewsList({ selectedStock }: NewsListProps) {
  const [expandedTitle, setExpandedTitle] = useState<string | null>(null);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setExpandedTitle(null);

    getNewsDataByTicker(selectedStock)
      .then((loadedItems) => {
        if (!isActive) {
          return;
        }
        setItems(loadedItems);
        setExpandedTitle(loadedItems[0]?.title ?? null);
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedStock]);

  if (loading) {
    return (
      <div className="h-full w-full overflow-y-auto p-4 text-sm text-slate-500">
        Loading news for <span className="font-semibold">{selectedStock}</span>...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-full w-full overflow-y-auto p-4 text-sm text-slate-500">
        No news files found for <span className="font-semibold">{selectedStock}</span> in
        <span className="ml-1 font-mono">data/stocknews/{selectedStock}/</span>.
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
