import React, { useEffect, useState } from "react";

interface Props {
  selectedStock: string;
}

interface NewsItem {
  _id: string;
  Stock: string;
  Title: string;
  Date: string;
  content: string;
}

export default function NewsList({selectedStock}: Props) {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStock) {
      setNewsData([]);
      return;
    }

    fetch(`http://localhost:8000/stocknews/?stock_name=${selectedStock}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch news for stock ${selectedStock}`);
        return res.json();
      })
      .then((data: NewsItem[]) => {
        setNewsData(data.reverse());
        setExpandedId(null);
      })
      .catch((err) => {
        console.error("Error fetching news data:", err);
      });
  }, [selectedStock]);

  return (
    <div className="flex flex-col gap-2">
      {newsData.length === 0 && (
        <p className="text-gray-500 text-sm">
          No news available.
        </p>
      )}

      {newsData.map((item) => (
        <div
          key={item._id}
          className="bg-white rounded shadow border border-gray-200 overflow-hidden"
        >
          {/* Header*/}
          <button
            className="w-full text-left p-3 hover:bg-gray-50 transition-colors focus:outline-none"
            onClick={() =>
              setExpandedId(
                expandedId === item._id ? null : item._id
              )
            }
          >
            <h3 className="font-semibold text-sm">
              {item.Title}
            </h3>

            <span className="text-xs text-gray-500">
              {item.Date}
            </span>
          </button>

          {/* Content */}
          {expandedId === item._id && (
            <div className="p-3 border-t border-gray-100 text-sm text-gray-700 bg-gray-50 whitespace-pre-wrap">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}