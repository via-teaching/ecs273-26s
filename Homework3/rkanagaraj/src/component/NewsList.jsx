import { useEffect, useState } from 'react';

export default function NewsList({ selectedStock }) {
  const [news, setNews] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!selectedStock) return;
    setExpanded(null);
    setNews([]);
    fetch(`/stocknews/${selectedStock}/news.json`)
      .then(r => r.ok ? r.json() : [])
      .then(setNews)
      .catch(() => setNews([]));
  }, [selectedStock]);

  if (news.length === 0) {
    return <p className="text-center text-gray-400 mt-10 text-sm">Loading news…</p>;
  }

  return (
    <div className="divide-y divide-gray-100 overflow-y-auto h-full">
      {news.map((item, i) => (
        <div
          key={i}
          className="px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpanded(expanded === i ? null : i)}
        >
          <div className="text-sm font-medium leading-snug text-gray-800">{item.title}</div>
          <div className="text-xs text-gray-400 mt-0.5">{item.date}</div>
          {expanded === i && item.content && (
            <div className="mt-2 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap border-t pt-2">
              {item.content.slice(0, 2000)}{item.content.length > 2000 ? '…' : ''}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
