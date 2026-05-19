import { useEffect, useMemo, useState } from "react";

const newsFileLoaders = import.meta.glob("../../data/stocknews/*/*.txt", {
  query: "?raw",
  import: "default",
});

function parseNewsFile(path, raw) {
  const lines = raw.split("\n");
  const titleLine = lines.find((line) => line.startsWith("Title:"));
  const dateLine = lines.find((line) => line.startsWith("Date:"));
  const contentIdx = lines.findIndex((line) => line.startsWith("Content:"));

  if (!titleLine || !dateLine || contentIdx < 0) return null;

  const tickerMatch = path.match(/stocknews\/([^/]+)\//);
  const ticker = tickerMatch ? tickerMatch[1] : "";

  const title = titleLine.replace("Title:", "").trim();
  const dateRaw = dateLine.replace("Date:", "").trim();
  const content = lines.slice(contentIdx + 1).join("\n").trim();

  const parsedDate = new Date(dateRaw);
  const dateLabel =
    !Number.isNaN(+parsedDate) && dateRaw
      ? parsedDate.toLocaleString()
      : dateRaw || "Unknown date";

  return {
    id: path,
    ticker,
    title,
    dateRaw,
    dateLabel,
    content,
  };
}

export function NewsList({ ticker }) {
  const [expandedId, setExpandedId] = useState(null);
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTickerNews() {
      setLoading(true);
      setExpandedId(null);

      const matchedEntries = Object.entries(newsFileLoaders).filter(([path]) =>
        path.includes(`/stocknews/${ticker}/`)
      );

      const loaded = await Promise.all(
        matchedEntries.map(async ([path, loader]) => {
          const raw = await loader();
          return parseNewsFile(path, raw);
        })
      );

      if (cancelled) return;
      setNewsItems(loaded.filter(Boolean));
      setLoading(false);
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
