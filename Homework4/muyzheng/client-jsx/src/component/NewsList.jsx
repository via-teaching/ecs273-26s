import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8002";

function NewsItem({ article }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border border-zinc-200 rounded-lg p-3 cursor-pointer hover:bg-zinc-50 transition-colors"
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="font-semibold text-sm text-zinc-800 leading-snug">{article.Title}</div>
      <div className="text-xs text-zinc-400 mt-1">{article.Date}</div>
      {expanded && (
        <div className="mt-2 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100 pt-2 whitespace-pre-wrap">
          {article.content}
        </div>
      )}
    </div>
  );
}

export function NewsList({ stock }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stock) return;
    setArticles([]);
    setLoading(true);
    fetch(`${API_BASE}/stocknews/${stock}`)
      .then((r) => {
        if (!r.ok) throw new Error(`News fetch failed for ${stock}`);
        return r.json();
      })
      .then((data) => {
        setArticles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("NewsList fetch error:", err);
        setArticles([]);
        setLoading(false);
      });
  }, [stock]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-zinc-200 shrink-0">
        <h2 className="text-sm font-semibold text-zinc-700">News: {stock}</h2>
        <p className="text-xs text-zinc-400 mt-0.5">Click an article to expand</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {loading && (
          <p className="text-sm text-zinc-400 text-center mt-8">Loading...</p>
        )}
        {!loading && !articles.length && (
          <p className="text-sm text-zinc-400 text-center mt-8">No news available for {stock}.</p>
        )}
        {articles.map((a, i) => (
          <NewsItem key={i} article={a} />
        ))}
      </div>
    </div>
  );
}
