import { useState, useEffect } from "react";

export default function NewsList({ ticker }) {
  const [news, setNews] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setExpanded(null);
    setNews([]);
    fetch(`/data/stocknews/${ticker}.json`)
      .then(res => res.json())
      .then(setNews)
      .catch(() => setNews([]));
  }, [ticker]);

  return (
    <div className="overflow-y-auto h-full p-2">
      {news.length === 0 && (
        <p className="text-center text-gray-500 mt-20">No news for {ticker}</p>
      )}
      {news.map((item, i) => (
        <div key={i} className="border-b border-gray-200 py-2 cursor-pointer"
          onClick={() => setExpanded(expanded === i ? null : i)}>
          <p className="font-semibold text-sm">{item.title}</p>
          <p className="text-xs text-gray-500">{item.date}</p>
          {expanded === i && (
            <p className="text-sm mt-2 text-gray-700">{item.content}</p>
          )}
        </div>
      ))}
    </div>
  );
}