import { useEffect, useState } from "react";

export function NewsList({ ticker }) {
  const [newsItems, setNewsItems] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    if (!ticker) return;

    setExpandedIndex(null);

    fetch(`http://localhost:8000/stocknews/${ticker}`)
      .then((res) => res.json())
      .then((data) => {
        setNewsItems(data.News || []);
      })
      .catch((err) => {
        console.error("Error fetching news:", err);
        setNewsItems([]);
      });
  }, [ticker]); 

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white rounded-xl">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-bold text-gray-700">
          Latest News: {ticker}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {newsItems.length > 0 ? (
          newsItems.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden transition-all"
            >
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
                className="w-full text-left p-3 hover:bg-gray-50 focus:outline-none flex flex-col"
              >
                <span className="text-sm text-blue-600 font-semibold mb-1">
                  {item.Date}
                </span>
                <span className="font-medium text-gray-900 leading-tight">
                  {item.Title}
                </span>
              </button>

              {expandedIndex === index && (
                <div className="p-3 bg-gray-50 border-t border-gray-200 animate-in fade-in slide-in-from-top-1">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {item.content}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 mt-10">
            No news found for this ticker.
          </p>
        )}
      </div>
    </div>
  );
}