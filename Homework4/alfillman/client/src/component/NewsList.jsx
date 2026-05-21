import { useEffect, useState } from "react";

export function NewsList({ ticker }) {
  const [news, setNews] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!ticker) return;
    setExpanded(null);
    fetch(`http://localhost:8000/stocknews/${ticker}`)
      .then((res) => res.json())
      .then((json) => setNews(json.News || []))
      .catch((err) => console.error("News API failed:", err));
  }, [ticker]);

  if (news.length === 0) {
    return (
      <div style={{ padding: "1rem" }}>
        No news available for {ticker}.
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "0.5rem" }}>
      <h3 style={{ margin: "0.25rem 0 0.75rem" }}>
        {ticker} News ({news.length})
      </h3>
      {news.map((item, i) => (
        <div
          key={i}
          onClick={() => setExpanded(expanded === i ? null : i)}
          style={{
            padding: "0.5rem",
            marginBottom: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: 4,
            cursor: "pointer",
            background: expanded === i ? "#f5f5f5" : "white",
          }}
        >
          <div style={{ fontSize: ".75rem", color: "#666" }}>{item.Date}</div>
          <div style={{ fontWeight: "bold", marginTop: 2 }}>{item.Title}</div>
          {expanded === i && (
            <div style={{ marginTop: "0.5rem", fontSize: ".9rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}