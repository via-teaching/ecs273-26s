import { useEffect, useState } from "react";

interface NewsItem {
  _id?: string;
  Stock: string;
  Title: string;
  Date: string;
  URL?: string;
  content: string;
}

interface NewsListProps {
  selectedStock: string;
}

const API_BASE = "http://localhost:8000";

export default function NewsList({ selectedStock }: NewsListProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNews() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/stocknews/${encodeURIComponent(selectedStock)}`
        );

        if (!response.ok) {
          throw new Error(`Failed to load news for ${selectedStock}.`);
        }

        const data: NewsItem[] = await response.json();
        if (cancelled) return;

        setNews(data);
        setExpandedId(null);
      } catch (err) {
        if (cancelled) return;
        setNews([]);
        setExpandedId(null);
        setError(err instanceof Error ? err.message : "Failed to load news.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNews();

    return () => {
      cancelled = true;
    };
  }, [selectedStock]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-500">Loading news...</div>;
  }

  if (error) {
    return <div className="flex h-full items-center justify-center text-gray-500">{error}</div>;
  }

  if (news.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        No news found for {selectedStock}.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="space-y-2">
        {news.map((item, index) => {
          const itemId = getNewsItemId(item, index);
          const isExpanded = itemId === expandedId;

          return (
            <button
              key={itemId}
              type="button"
              className="w-full rounded border border-gray-300 bg-white p-3 text-left shadow-sm transition hover:border-gray-500"
              onClick={() => setExpandedId(isExpanded ? null : itemId)}
            >
              <div className="text-xs font-semibold text-gray-500">{item.Date}</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{item.Title}</div>
              {isExpanded && (
                <div className="mt-3 space-y-2">
                  {item.URL && (
                    <a
                      href={item.URL}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-xs text-blue-600 underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Source Link
                    </a>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {item.content}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getNewsItemId(item: NewsItem, index: number) {
  return item._id ?? `${item.Stock}-${item.Date}-${item.Title}-${index}`;
}
