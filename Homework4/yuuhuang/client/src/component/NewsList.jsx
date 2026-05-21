import { useEffect, useState } from "react";

function stripHtml(str) {
  if (!str) return "";
  return str.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function NewsList({ ticker }) {
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true); setError(null); setExpanded(null);
    fetch(`/stocknews/?stock_name=${ticker}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => { setArticles(json.News); setLoading(false); })
      .catch((e)   => { setError(e.message);    setLoading(false); });
  }, [ticker]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Panel header */}
      <div style={{
        padding: "8px 16px", flexShrink: 0,
        borderBottom: "1px solid #f1f5f9",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>News</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{ticker}</span>
        </div>
        {!loading && !error && (
          <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "999px" }}>
            {articles.length}
          </span>
        )}
      </div>

      {/* Article list */}
      <div style={{ flex: "1 1 0", overflowY: "auto", padding: "8px" }}>

        {loading && (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", marginTop: "40px" }}>Loading…</div>
        )}
        {error && (
          <div style={{ textAlign: "center", color: "#ef4444", fontSize: "13px", marginTop: "40px" }}>Error: {error}</div>
        )}
        {!loading && !error && articles.length === 0 && (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", marginTop: "40px" }}>No articles for {ticker}</div>
        )}

        {!loading && !error && articles.map((a, i) => {
          const open = expanded === i;
          const body = stripHtml(a.content ?? "");
          return (
            <div
              key={i}
              onClick={() => setExpanded(open ? null : i)}
              style={{
                marginBottom: "8px",
                padding: "10px 12px",
                background: open ? "#f8fafc" : "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#93c5fd"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
            >
              {/* Title + expand arrow */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <p style={{ flex: 1, margin: 0, fontSize: "13px", fontWeight: 600, color: "#1e293b", lineHeight: 1.4 }}>
                  {a.Title || "(No title)"}
                </p>
                <span style={{ color: "#cbd5e1", fontSize: "10px", marginTop: "2px", flexShrink: 0, transform: open ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>
                  ▶
                </span>
              </div>

              {/* Date */}
              {a.Date && (
                <span style={{
                  display: "inline-block", marginTop: "6px",
                  background: "#f1f5f9", color: "#64748b",
                  fontSize: "10px", fontWeight: 500,
                  padding: "2px 7px", borderRadius: "4px",
                }}>
                  {a.Date}
                </span>
              )}

              {/* Body */}
              {body && (
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#475569", lineHeight: 1.6 }}>
                  {open ? body : `${body.slice(0, 130)}${body.length > 130 ? "…" : ""}`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
