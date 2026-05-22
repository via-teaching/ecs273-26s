import { useEffect, useState } from "react";

export function NewsList({ ticker }) {
  const [articles, setArticles] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setArticles([]);
    setExpanded(null);
    setLoading(true);

    const loadArticles = async () => {
      try {
        const idxRes = await fetch(`/data/stocknews/${ticker}/index.json`);
        if (!idxRes.ok) { setLoading(false); return; }
        const filenames = await idxRes.json();

        const loaded = [];
        for (const filename of filenames) {
          try {
            const res = await fetch(`/data/stocknews/${ticker}/${encodeURIComponent(filename)}`);
            if (!res.ok) continue;
            const text = await res.text();

            if (text.includes("<!doctype html") || text.includes("<title>")) {
              console.warn("Skipping HTML page returned instead of news file:", filename);
              continue;
            }

            loaded.push(parseArticle(text, filename));
          } catch { continue; }
        }
        setArticles(loaded);
      } catch {
        // no news for this ticker
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, [ticker]);

  const toggle = (i) => setExpanded(expanded === i ? null : i);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "8px" }}>
      <h4 style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
        {ticker} News
        <span style={{ fontWeight: 400, color: "#6b7280", marginLeft: 8 }}>
          ({articles.length} articles)
        </span>
      </h4>

      {loading && (
        <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 40, fontSize: 13 }}>
          Loading news...
        </p>
      )}

      {!loading && articles.length === 0 && (
        <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 40, fontSize: 13 }}>
          No news available for {ticker}
        </p>
      )}

      {articles.map((article, i) => (
        <div
          key={i}
          onClick={() => toggle(i)}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            marginBottom: 8,
            padding: "10px 12px",
            cursor: "pointer",
            background: expanded === i ? "#f0f9ff" : "#fff",
            transition: "background 0.15s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <p style={{ fontWeight: 600, fontSize: 13, margin: 0, flex: 1 }}>
              {article.title}
            </p>
            <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>
              {article.date}
            </span>
          </div>

          <div style={{ textAlign: "right", fontSize: 11, color: "#6b7280", marginTop: 4 }}>
            {expanded === i ? "▲ collapse" : "▼ expand"}
          </div>

          {expanded === i && (
            <div style={{ marginTop: 8, borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 11, color: "#3b82f6", display: "block", marginBottom: 6, wordBreak: "break-all" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {article.url}
                </a>
              )}
              <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {article.content || "No content available."}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Strip HTML tags and decode common HTML entities
function stripHtml(str) {
  return str
    .replace(/<[^>]*>/g, " ")           // remove all HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")            // collapse multiple spaces
    .trim();
}

function parseArticle(text, filename) {
  const lines = text.split("\n");
  const result = { title: "", date: "", url: "", content: "" };
  let contentStart = 0;

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    if (line.startsWith("Title:"))      result.title = line.slice(6).trim();
    else if (line.startsWith("Date:"))  result.date  = line.slice(5).trim();
    else if (line.startsWith("URL:"))   result.url   = line.slice(4).trim();
    else if (line.trim() === "") { contentStart = i + 1; break; }
  }

  // Fallback: extract from filename e.g. "2026-04-14_15-18_Article Title.txt"
  if (!result.title) {
    result.title = filename.replace(".txt", "").split("_").slice(2).join(" ");
  }
  if (!result.date) result.date = filename.slice(0, 10);

  // Strip HTML from content in case Selenium grabbed raw page source
  const rawContent = lines.slice(contentStart).join("\n").trim();
  result.content = stripHtml(rawContent);

  return result;
}