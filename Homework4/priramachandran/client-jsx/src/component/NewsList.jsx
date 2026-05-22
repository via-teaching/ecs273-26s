import { useEffect, useMemo, useState } from "react";
import { fetchStockNews } from "../api";

function formatDateLabel(dateRaw) {
  const parsedDate = new Date(dateRaw);
  return !Number.isNaN(+parsedDate) && dateRaw
    ? parsedDate.toLocaleString()
    : dateRaw || "Unknown date";
}

function mapNewsArticle(article) {
  const dateRaw = article.Date ?? "";
  return {
    id: article._id ?? `${article.Stock}-${article.Title}-${dateRaw}`,
    ticker: article.Stock,
    title: article.Title,
    dateRaw,
    dateLabel: formatDateLabel(dateRaw),
    content: article.content ?? "",
  };
}

export function NewsList({ ticker }) {
  const [expandedId, setExpandedId] = useState(null);
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTickerNews() {
      setLoading(true);
      setExpandedId(null);
      setError(null);

      try {
        const payload = await fetchStockNews(ticker);
        if (cancelled) return;
        const items = (payload.News ?? []).map(mapNewsArticle);
        setNewsItems(items);
      } catch (err) {
        if (cancelled) return;
        setNewsItems([]);
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTickerNews();
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  const sortedNews = useMemo(() => {
    return [...newsItems].sort((a, b) => b.dateRaw.localeCompare(a.dateRaw));
  }, [newsItems]);

  return (
    <div className="h-full w-full overflow-y-auto p-2">
      {loading ? (
        <p className="text-sm text-slate-500">Loading news for {ticker}...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : sortedNews.length === 0 ? (
        <p className="text-sm text-slate-500">No news found for {ticker}.</p>
      ) : (
        <ul className="space-y-2">
          {sortedNews.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <li key={item.id} className="rounded border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full text-left p-3 hover:bg-slate-50"
                >
                  <p className="text-xs text-slate-500">{item.dateLabel}</p>
                  <p className="font-medium text-slate-800">{item.title}</p>
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-200 p-3 text-sm leading-6 whitespace-pre-wrap text-slate-700">
                    {item.content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
