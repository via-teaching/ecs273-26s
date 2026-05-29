import { useEffect, useState } from "react";

type NewsItem = {
  title: string;
  date: string;
  content: string;
};

type Props = {
  selectedStock: string;
};

export default function NewsList({ selectedStock }: Props) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    setExpanded(null);
    let cancelled = false;
    fetch(`http://127.0.0.1:8000/news/${selectedStock}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setNews(data.news);
      })
      .catch((err) => {
        console.error("Error fetching news:", err);
        if (!cancelled) setNews([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedStock]);

  return (
    <div className="news-scroll">
      {news.map((item, index) => (
        <div
          key={index}
          className={`news-item${expanded === index ? " expanded" : ""}`}
          onClick={() => setExpanded(expanded === index ? null : index)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
            <h3 style={{ margin: "0 0 3px 0", fontSize: 15, fontWeight: 600, lineHeight: 1.4, color: "#1e293b", flex: 1 }}>
              {item.title}
            </h3>
            <span style={{ fontSize: 9, color: "#94a3b8", flexShrink: 0, paddingTop: 2 }}>
              {expanded === index ? "▲" : "▼"}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
            {item.date}
          </p>
          {expanded === index && (
            <p style={{ margin: "8px 0 0 0", fontSize: 14, color: "#475569", lineHeight: 1.6, borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>
              {item.content}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
