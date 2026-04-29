import { useState, useEffect } from "react";
import NewsData from "../../data/newsdata.json";



export function NewsPanel({ stock }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
  setExpandedIndex(null);  // collapse open article when switching stocks
}, [stock]);

  
  const articles = NewsData[stock] || [];

  return (
    <div style={{ width: "100%", height: "100%", overflowY: "auto", padding: "12px" }}>
      {articles.length === 0
        ? <p className="text-gray-400 text-center mt-10">No news found.</p>
        : articles.map((article, i) => (
            <div
              key={i}
              onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
              style={{ borderBottom: "1px solid #e5e7eb", padding: "10px 4px", cursor: "pointer" }}
            >
              <div className="font-semibold text-sm leading-snug">{article.title}</div>
              <div className="text-xs text-gray-400 mt-1">{article.date}</div>
              {expandedIndex === i && (
                <div className="text-xs text-gray-600 mt-2 leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>
                  {article.body}
                </div>
              )}
            </div>
          ))
      }
    </div>
  );
}


