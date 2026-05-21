import { useEffect, useState } from "react";

export default function NewsList({ selectedStock }) {
  var [articles, setArticles] = useState([]);
  var [expanded, setExpanded] = useState(null);

  // reload articles when selected stock changes
  useEffect(function() {
    setExpanded(null);
    setArticles([]);

    fetch("http://localhost:8000/stocknews/?stock_name=" + selectedStock)
      .then(function(res) {
        // return empty array if no news
        if (res.status === 404) {
          return [];
        }
        if (!res.ok) {
          throw new Error("Failed to fetch news for " + selectedStock);
        }
        return res.json();
      })
      .then(function(data) {
        setArticles(data);
      })
      .catch(function() {
        setArticles([]);
      });
  }, [selectedStock]);


  // no news for MMM in previous homework so added this
  if (articles.length === 0) {
    return (
      <p className="text-gray-400 text-center mt-8 text-sm px-4">
        No news articles available for {selectedStock}.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {articles.map(function(article, idx) {
        return (
          <div key={idx} className="border border-gray-200 rounded bg-gray-50">

            <button
              className="w-full text-left px-3 py-2"
              onClick={function() {
                setExpanded(expanded === idx ? null : idx);
              }}
            >
              <div className="font-medium text-sm text-gray-800 leading-snug">
                {article.Title}
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-400">{article.Date}</span>
                <span className="text-xs text-blue-500">
                  {expanded === idx ? "▲ collapse" : "▼ expand"}
                </span>
              </div>
            </button>
            {expanded === idx && (
              <div className="px-3 py-2 bg-white text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border-t border-gray-100">
                {article.content}
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}
