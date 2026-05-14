import { useEffect, useMemo, useState } from "react";

interface NewsListProps {
  selectedTicker: string;
}

interface NewsItem {
  _id: string;
  Stock: string;
  Title: string;
  Date: string;
  content: string;
}

export function NewsList({ selectedTicker }: NewsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [allNewsItems, setAllNewsItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    // HW4 says the news list should update using the backend news endpoint.
    fetch("http://localhost:8000/stocknews/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not fetch stock news");
        }
        return response.json();
      })
      .then((data: NewsItem[]) => {
        setAllNewsItems(data);
      })
      .catch(() => {
        setAllNewsItems([]);
      });
  }, []);

  const filteredAllNewsItems = useMemo(() => {
    // some of the HW1/TA scraped pages are basically Yahoo error/search pages, so I filtered those out here
    // I know Piazza said not to worry too much about intermediate data, but I thought the view looked better if those were skipped
    return allNewsItems
      .filter((item) => {
        const content = item.content;
        return !(
          content.startsWith("Oops, something went wrong") ||
          content.startsWith("Tip: Try a valid symbol") ||
          content.includes("Tip: Try a valid symbol or a specific company name for relevant results")
        );
      })
      .sort((a, b) => b.Date.localeCompare(a.Date));
  }, [allNewsItems]);

  // I first thought it made sense to only show the selected stock here,
  // but this is closer to the HW3 bonus wording since the selected stock can auto-expand inside the bigger list.
  const newsItems = useMemo(() => {
    if (showOnlySelected) {
      return filteredAllNewsItems.filter((item) => item.Stock === selectedTicker);
    }

    return filteredAllNewsItems;
  }, [filteredAllNewsItems, selectedTicker, showOnlySelected]);

  useEffect(() => {
    const firstMatch = newsItems.find((item) => item.Stock === selectedTicker);
    setExpandedId(firstMatch?._id ?? null);
  }, [newsItems, selectedTicker]);

  if (newsItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No news found for this stock.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-300 bg-gray-50 p-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700"
            onClick={() => setShowOnlySelected((value) => !value)}
          >
            {showOnlySelected ? "Show all news" : "Show only selected stock"}
          </button>
          <span className="font-medium text-gray-700">Selected: {selectedTicker}</span>
        </div>
      </div>

      {newsItems.map((item) => {
        const isExpanded = expandedId === item._id;
        const isSelectedTicker = item.Stock === selectedTicker;

        return (
          <button
            key={item._id}
            type="button"
            className={`w-full rounded-lg border bg-white p-3 text-left shadow-sm ${
              isSelectedTicker ? "border-blue-400" : "border-gray-300"
            }`}
            onClick={() => setExpandedId(isExpanded ? null : item._id)}
          >
            {/* Show title and date */}
            <div className="mb-1 text-xs font-medium text-blue-700">{item.Stock}</div>
            <div className="font-semibold text-sm text-gray-900">{item.Title}</div>
            <div className="mt-1 text-xs text-gray-500">{item.Date}</div>

            {/* On click, it should expand to show full content */}
            {isExpanded && (
              <div className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                {item.content}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
