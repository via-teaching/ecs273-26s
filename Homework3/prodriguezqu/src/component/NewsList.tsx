import { useEffect, useMemo, useState } from "react";
import newsData from "virtual:news-data";

interface NewsListProps {
  selectedTicker: string;
}

interface NewsItem {
  id: string;
  title: string;
  date: string;
  content: string;
}

type NewsByTicker = Record<string, NewsItem[]>;

export function NewsList({ selectedTicker }: NewsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Display a list of news for the selected stock.
  const newsItems = useMemo(() => {
    const allNews = newsData as NewsByTicker;
    const tickerNews = allNews[selectedTicker] ?? [];

    // some of the HW1/TA scraped pages are basically Yahoo error/search pages, so I filtered those out here
    // I know Piazza said not to worry too much about intermediate data, but I thought the view looked better if those were skipped
    return tickerNews
      .filter((item) => {
        const content = item.content;
        return !(
          content.startsWith("Oops, something went wrong") ||
          content.startsWith("Tip: Try a valid symbol") ||
          content.includes("Tip: Try a valid symbol or a specific company name for relevant results")
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedTicker]);

  useEffect(() => {
    setExpandedId(null);
  }, [selectedTicker]);

  if (newsItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No news found for this stock.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {newsItems.map((item) => {
        const isExpanded = expandedId === item.id;

        return (
          <button
            key={item.id}
            type="button"
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-left shadow-sm"
            onClick={() => setExpandedId(isExpanded ? null : item.id)}
          >
            {/* Show title and date */}
            <div className="font-semibold text-sm text-gray-900">{item.title}</div>
            <div className="mt-1 text-xs text-gray-500">{item.date}</div>

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
