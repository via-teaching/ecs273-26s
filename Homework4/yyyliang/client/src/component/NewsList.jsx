import { useState, useEffect } from "react";

export default function NewsList({ ticker }) {
  const [news, setNews] = useState([]);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setExpandedIdx(null);
    setNews([]);
    setLoading(true);

    let cancelled = false;
    fetch(`http://127.0.0.1:8000/stocknews/${ticker}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        // API returns: [{Stock, Title, Date, content}, ...] sorted by Date asc
        // Adapt to the lowercase keys this component already uses.
        const parsed = json.map((item) => ({
          title: item.Title,
          date: item.Date,
          content: item.content,
        }));
        // Sort newest-first (API sorts ascending, we want descending)
        parsed.sort((a, b) => (a.date < b.date ? 1 : -1));
        setNews(parsed);
      })
      .catch((err) => {
        console.error("Failed to fetch news:", err);
        if (!cancelled) setNews([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [ticker]);

  if (loading) {
    return (
      <p className="text-center text-gray-500 mt-20">
        Loading news for {ticker}...
      </p>
    );
  }

  if (news.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-20">
        No news found for {ticker}.
      </p>
    );
  }

  return (
    <div className="overflow-y-auto h-full p-2">
      {news.map((item, idx) => (
        <div
          key={idx}
          className="border-b border-gray-200 py-2 cursor-pointer hover:bg-gray-50"
          onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
        >
          <div className="font-semibold text-sm">{item.title}</div>
          <div className="text-xs text-gray-500 mt-1">{item.date}</div>
          {expandedIdx === idx && (
            <div className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}