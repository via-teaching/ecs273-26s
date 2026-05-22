import { useEffect, useState } from "react";

import { NewsItem } from "../types";

interface NewsListProps {
  ticker: string;
  items: NewsItem[];
}

export function NewsList({ ticker, items }: NewsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    setExpandedId(items[0]?.id ?? null);
  }, [items, ticker]);

  if (!items.length) {
    return <div className="flex h-full items-center justify-center text-slate-500">No news articles available.</div>;
  }

  return (
    <div className="panel-scroll h-full overflow-y-auto px-1 py-1">
      <div className="glass-subtle mb-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700">
        <span className="font-semibold text-slate-900">{ticker}</span> news ({items.length} articles)
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = item.id === expandedId;

          return (
            <article key={item.id} className="glass-card overflow-hidden rounded-2xl">
              <button
                type="button"
                className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-white/5"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <span className="text-base font-semibold text-slate-900">{item.title}</span>
                <span className="text-sm text-slate-600">{item.dateLabel}</span>
              </button>
              {isExpanded ? (
                <div className="border-t border-white/20 bg-white/10 px-4 py-3 text-sm text-slate-700">
                  <p className="mb-3 whitespace-pre-line leading-6">{item.content}</p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full bg-sky-500/12 px-3 py-1 text-sm font-medium text-sky-700 hover:bg-sky-500/18"
                  >
                    Open original article
                  </a>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
