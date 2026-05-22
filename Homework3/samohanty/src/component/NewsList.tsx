import { useEffect, useState } from 'react';

type NewsItem = {
  filename: string;
  title: string;
  date: string;
  url: string;
  content: string;
};

type Props = {
  ticker: string;
  expandTrigger?: number;
};

export default function NewsList({ ticker, expandTrigger }: Props) {
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setNews(null);
    setOpenSet(new Set());

    fetch(`${import.meta.env.BASE_URL}data/stocknews/${ticker}.json`)
      .then((r) => r.json())
      .then((rows: NewsItem[]) => {
        if (!cancelled) setNews(rows);
      });

    return () => { cancelled = true; };
  }, [ticker]);

  useEffect(() => {
    if (expandTrigger === undefined) return;
    if (!news || news.length === 0) return;
    setOpenSet(new Set([news[0].filename]));
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
        {!news ? (
          <div className="p-4 text-sm text-slate-500">Loading…</div>
        ) : news.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No news available.</div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {news.map((item) => {
              const open = openSet.has(item.filename);
              return (
                <li key={item.filename} className="p-3 hover:bg-slate-50">
                  <button
                    type="button"
                    onClick={() => toggle(item.filename)}
                    className="w-full text-left"
                  >
                    <div className="text-sm font-medium text-slate-800">
                      {item.title || '(untitled)'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.date}</div>
                  </button>
                  {open && (
                    <div className="mt-2 text-sm text-slate-700 whitespace-pre-line">
                      {item.content || '(no content)'}
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