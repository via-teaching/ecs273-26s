import { useMemo, useState } from "react";
import allArticles from "virtual:news-data";

export default function NewsList({ selectedStock }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const articles = useMemo(() => {
    setExpandedIndex(null);
    return allArticles[selectedStock] || [];
  }, [selectedStock]);

  const toggle = (i) => setExpandedIndex(expandedIndex === i ? null : i);

  return (
    <div className="h-full overflow-y-auto p-3">
      {articles.length === 0 && (
        <p className="text-gray-400 text-sm">No news available.</p>
      )}

      {articles.map((article, i) => (
        <div key={i} className="border-b border-gray-200 last:border-b-0">
          <button
            onClick={() => toggle(i)}
            className="w-full text-left py-3 px-2 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-start gap-2"
          >
            <div className="min-w-0">
              <p className="font-medium text-sm leading-snug">
                {article.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">{article.date}</p>
            </div>
            <span className="text-gray-400 text-lg flex-shrink-0 leading-none mt-0.5">
              {expandedIndex === i ? "−" : "+"}
            </span>
          </button>

          {expandedIndex === i && (
            <div className="px-2 pb-3 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {article.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
