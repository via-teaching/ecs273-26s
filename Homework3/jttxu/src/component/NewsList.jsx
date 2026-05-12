import { useState, useEffect } from "react";

const API_BASE = "http://localhost:3001/api";

export default function NewsList({ selectedStock }) {
  // 1. create 5 states 
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);  // which news has been expanded
  const [expandedContent, setExpandedContent] = useState({});  // cache
  const [loadingContent, setLoadingContent] = useState(null);

  // 2. fetch the news list
  useEffect(() => {
    // no stock selected
    if (!selectedStock) {
      setNewsList([]);
      setExpandedId(null);
      return;
    }

    setLoading(true);
    setExpandedId(null);  // reset when changing the stock

    // get the news list for the selected stock from the backend
    fetch(`${API_BASE}/news/${selectedStock}`)
      .then((r) => r.json())
      .then((data) => {
        setNewsList(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedStock]);

  // news expand or un-expand
  const handleToggle = async (item) => {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(item.id);

    // lazy load
    if (!expandedContent[item.id]) {
      setLoadingContent(item.id);
      try {
        const res = await fetch(
          `${API_BASE}/news/${selectedStock}/${encodeURIComponent(item.filename)}`
        );
        const data = await res.json();
        // update cache
        setExpandedContent((prev) => ({ ...prev, [item.id]: data.content }));
      } catch {
        setExpandedContent((prev) => ({
          ...prev,
          [item.id]: "Failed to load content.",
        }));
      } finally {
        setLoadingContent(null);
      }
    }
  };

  // date formate
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // empty/loading states
  if (!selectedStock) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm px-4 text-center">
        Select a stock to view related news.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading news...
      </div>
    );
  }

  if (newsList.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm px-4 text-center">
        No news found for <strong className="ml-1">{selectedStock}</strong>.
      </div>
    );
  }

  // 3. UI render
  return (
    <div className="h-full overflow-y-auto divide-y divide-gray-200">
      {newsList.map((item) => {
        const isExpanded = expandedId === item.id;
        const isLoadingThis = loadingContent === item.id;

        return (
          <div
            key={item.id}
            className="px-3 py-2 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            {/* title + date: click to expand/un-expand */}
            <div
              className="cursor-pointer"
              onClick={() => handleToggle(item)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-800 leading-snug flex-1">
                  {item.title}
                </p>
                <span className="text-gray-400 text-xs mt-0.5 flex-shrink-0">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.date)}</p>
            </div>

            {/* whole context */}
            {isExpanded && (
              <div
                className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed"
                onClick={(e) => e.stopPropagation()}
              >
                {isLoadingThis ? (
                  <span className="text-gray-400 italic">Loading...</span>
                ) : (
                  expandedContent[item.id] || ""
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}