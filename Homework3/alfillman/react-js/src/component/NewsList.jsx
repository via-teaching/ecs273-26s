import { useEffect, useState } from "react";

// Glob all news .txt files as raw text, bundled at build time
const newsFiles = import.meta.glob("../../data/stocknews/**/*.txt", {
  query: "?raw",
  import: "default",
  eager: true,
});

// Parse a single .txt file into { title, date, url, content }
function parseArticle(text) {
  const titleMatch = text.match(/Title:\s*([\s\S]*?)\s*Date:/);
  const dateMatch  = text.match(/Date:\s*([\s\S]*?)\s*URL:/);
  const urlMatch   = text.match(/URL:\s*(\S+)/);

  let content = "";
  if (urlMatch) {
    const idx = text.indexOf(urlMatch[0]) + urlMatch[0].length;
    content = text.substring(idx).trim();
  }

  return {
    title:   titleMatch?.[1]?.trim() || "Untitled",
    date:    dateMatch?.[1]?.trim()  || "",
    url:     urlMatch?.[1]?.trim()   || "",
    content,
  };
}

// Group all articles by ticker, sorted newest-first. Computed once at module load.
const articlesByTicker = (() => {
  const result = {};
  for (const [path, text] of Object.entries(newsFiles)) {
    const m = path.match(/stocknews\/([^/]+)\//);
    if (!m) continue;
    const ticker = m[1];
    if (!result[ticker]) result[ticker] = [];
    result[ticker].push(parseArticle(text));
  }
  for (const k in result) {
    result[k].sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  return result;
})();

export function NewsList({ ticker }) {
  const [expanded, setExpanded] = useState(null);

  // Collapse any open article when ticker switches
  useEffect(() => setExpanded(null), [ticker]);

  const items = articlesByTicker[ticker] || [];

  if (items.length === 0) {
    return (
      <div style={{ padding: "1rem" }}>
        No news available for {ticker}.
        <br />
        <small style={{ color: "#888" }}>
          Expected: data/stocknews/{ticker}/*.txt
        </small>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "0.5rem" }}>
      <h3 style={{ margin: "0.25rem 0 0.75rem" }}>
        {ticker} News ({items.length})
      </h3>
      {items.map((item, i) => (
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
          <div style={{ fontSize: ".75rem", color: "#666" }}>{item.date}</div>
          <div style={{ fontWeight: "bold", marginTop: 2 }}>{item.title}</div>
          {expanded === i && (
            <div style={{ marginTop: "0.5rem", fontSize: ".9rem", lineHeight: 1.5 }}>
              {item.url && (
                <div style={{ marginBottom: "0.5rem" }}>
                    <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: "#1f77b4" }}
                  >
                    Read original article ↗
                  </a>
                </div>
              )}
              <div style={{ whiteSpace: "pre-wrap" }}>{item.content}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}