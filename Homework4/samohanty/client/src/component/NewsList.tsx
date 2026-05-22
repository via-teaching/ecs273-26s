import { useEffect, useState } from 'react';
import { api, type NewsArticle } from '../api';

type Props = {
  ticker: string;
  expandTrigger?: number;
};

export default function NewsList({ ticker, expandTrigger }: Props) {
  const [news, setNews] = useState<NewsArticle[] | null>(null);
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Fetch news for the selected ticker.
  useEffect(() => {
    const controller = new AbortController();
    setNews(null);
    setOpenSet(new Set());
    setError(null);

    api.news(ticker, controller.signal)
      .then((resp) => setNews(resp.articles))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      });

    return () => controller.abort();
  }, [ticker]);

  // Bonus linking: when the dropdown / t-SNE changes selection, auto-expand
  // the most recent article.
  useEffect(() => {
    if (expandTrigger === undefined) return;
    if (!news || news.length === 0) return;
    setOpenSet(new Set([news[0].Filename]));
  }, [expandTrigger, news]);

  const toggle = (id: string) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-sm font-semibold text-slate-700 mb-2">News for {ticker}</div>

      <div className="flex-1 min-h-0 overflow-y-auto border border-slate-200 rounded bg-white">
        {error ? (
          <div className="p-4 text-sm text-red-600">Error: {error}</div>
        ) : !news ? (
          <div className="p-4 text-sm text-slate-500">Loading…</div>
        ) : news.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No news available.</div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {news.map((item) => {
              const id = item.Filename || `${item.Title}-${item.Date}`;
              const open = openSet.has(id);
              return (
                <li key={id} className="p-3 hover:bg-slate-50">
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    className="w-full text-left"
                  >
                    <div className="text-sm font-medium text-slate-800">
                      {item.Title || '(untitled)'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.Date}</div>
                  </button>
                  {open && (
                    <div className="mt-2 text-sm text-slate-700 whitespace-pre-line">
                      {item.Content || '(no content)'}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
