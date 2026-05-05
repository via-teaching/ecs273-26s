import { useEffect, useMemo, useState } from "react";

import { getNewsItems } from "../data";

interface NewsListProps {
  ticker: string;
}

export function NewsList({ ticker }: NewsListProps) {
  const items = useMemo(() => getNewsItems(ticker), [ticker]);
  const [expandedId, setExpandedId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    setExpandedId(items[0]?.id ?? null);
  }, [items, ticker]);

  if (!items.length) {
    return <div className="flex h-full items-center justify-center text-gray-500">No news articles available.</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="mb-3 text-sm font-medium text-slate-600">{ticker} news ({items.length} articles)</div>
      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = item.id === expandedId;

          return (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                className="flex w-full flex-col gap-1 px-4 py-3 text-left"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <span className="text-base font-semibold text-slate-900">{item.title}</span>
                <span className="text-sm text-slate-500">{item.dateLabel}</span>
              </button>
              {isExpanded ? (
                <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <p className="mb-3 whitespace-pre-line leading-6">{item.content}</p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline"
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
