import { useEffect, useState } from 'react';
import { StockNewsAPIItem } from '../types';

export function NewsList({ selectedStock }: { selectedStock: string }) {
  const [articles, setArticles] = useState<StockNewsAPIItem[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setArticles([]);
    setExpanded(new Set([0]));

    fetch(`http://localhost:8000/stocknews/?stock_name=${selectedStock}`)
      .then((r) => {
        if (!r.ok) return [];
        return r.json();
      })
      .then((data: StockNewsAPIItem[]) => {
        setArticles(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedStock]);

  const toggle = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  if (loading) return <div className="p-3 text-gray-400 text-sm">Loading news…</div>;
  if (articles.length === 0)
    return <div className="p-3 text-gray-400 text-sm">No news available for {selectedStock}.</div>;

  return (
    <div style={{ overflowY: 'auto', height: '100%' }} className="p-2">
      {articles.map((article, i) => (
        <div key={i} className="mb-2 border border-gray-200 rounded-lg overflow-hidden"
          style={{ background: '#fff' }}>
          <button onClick={() => toggle(i)}
            className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
            style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}>
            <div className="flex justify-between items-start gap-2">
              <p className="text-sm font-medium text-gray-800 leading-snug">{article.Title}</p>
              <span className="text-gray-400 text-xs flex-shrink-0 mt-0.5">
                {expanded.has(i) ? '▲' : '▼'}
              </span>
            </div>
            {article.Date && (
              <p className="text-xs text-gray-400 mt-1">{article.Date}</p>
            )}
          </button>

          {expanded.has(i) && (
            <div className="px-3 pb-3 border-t border-gray-100">
              <p className="text-xs text-gray-700 mt-2 leading-relaxed"
                style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                {article.content || 'No content available.'}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
