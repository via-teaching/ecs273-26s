import { useEffect, useState } from "react";



export function NewsList({ stock }) {
  const [articles, setArticles] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!stock) return;
    setExpanded(null);
    fetch(`http://localhost:8000/stocknews/?stock_name=${stock}`)
      .then((res) => res.json())
      .then((data) => setArticles(data));
  }, [stock]);

  const toggle = (key) => setExpanded((prev) => (prev === key ? null : key));

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "0.5rem 0.75rem" }}>
      {articles.length === 0 && (
        <p style={{ textAlign: "center", marginTop: "2rem", color: "#6c584c" }}>
          No news for {stock}
        </p>
      )}
      {articles.map((article) => (
        <div
          key={article.Title}
          onClick={() => toggle(article.Title)}
          style={{
            cursor: "pointer",
            borderBottom: "1px solid #c4a882",
            padding: "0.5rem 0.25rem",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: "0.82rem", lineHeight: "1.3" }}>
            {article.Title}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#6c584c", marginTop: "2px" }}>
            {article.Date}
          </div>
          {expanded === article.Title && (
            <div
              style={{
                marginTop: "0.5rem",
                fontSize: "0.78rem",
                lineHeight: "1.6",
                color: "#3d2b1f",
              }}
            >
              {article.content || "No content available."}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
