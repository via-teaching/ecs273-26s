import { useEffect, useState } from "react";
import * as d3 from "d3"; 

export function NewsList() {
  const [allNews, setAllNews] = useState({});
  const [selectedTicker, setSelectedTicker] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    fetch("../../data/stocknews.json")
      .then((res) => res.json())
      .then((data) => setAllNews(data));

    const select = d3.select("#bar-select");
    const updateSelection = () => {
      setSelectedTicker(select.node()?.value || "");
      setExpandedIndex(null); 
    };

    select.on("change.news", updateSelection);
    updateSelection();

    return () => select.on("change.news", null);
  }, []);

  const newsItems = allNews[selectedTicker] || [];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white rounded-xl">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-bold text-gray-700">Latest News: {selectedTicker}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {newsItems.length > 0 ? (
          newsItems.map((item, index) => (
            <div 
              key={index} 
              className="border border-gray-200 rounded-lg overflow-hidden transition-all"
            >
              {/* Header: Always visible */}
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full text-left p-3 hover:bg-gray-50 focus:outline-none flex flex-col"
              >
                <span className="text-sm text-blue-600 font-semibold mb-1">
                  {item.date}
                </span>
                <span className="font-medium text-gray-900 leading-tight">
                  {item.title}
                </span>
              </button>

              {/* Expandable Content */}
              {expandedIndex === index && (
                <div className="p-3 bg-gray-50 border-t border-gray-200 animate-in fade-in slide-in-from-top-1">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {item.content}
                  </p>
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-xs text-blue-500 underline"
                  >
                    Read original source
                  </a>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 mt-10">No news found for this ticker.</p>
        )}
      </div>
    </div>
  );
}