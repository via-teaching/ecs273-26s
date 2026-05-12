import { useEffect, useState, useCallback } from "react";

interface Props {
  stock: string;
}

interface NewsItem {
  title: string;
  date: string;
  content: string;
  source?: string;
}

export default function NewsList({ stock }: Props) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setExpanded(new Set());

    async function load() {
      try {
        // Try loading as a single JSON array file
        const res = await fetch(`/data/stocknews/${stock}/news.json`);
        if (!res.ok) throw new Error("not found");
        const json = await res.json();
        if (cancelled) return;

        // Handle different JSON shapes:
        // [{ title, date, content }, ...]  — array
        // { articles: [...] }              — wrapped
        const arr: NewsItem[] = Array.isArray(json)
          ? json
          : json.articles ?? json.news ?? json.results ?? [];

        setItems(arr.slice(0, 30)); // cap at 30 items
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(`No news data found.\nExpected: /data/stocknews/${stock}/news.json`);
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [stock]);

  const toggle = useCallback((idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }, []);

  const formatDate = (raw: string) => {
    try {
      return new Date(raw).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch { return raw; }
  };

  if (loading) return (
    <div style={{ padding: 24, color: "#6b7280", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>
      Loading news…
    </div>
  );

  if (error) return (
    <div style={{ padding: 24, color: "#ef4444", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, whiteSpace: "pre-line" }}>
      <div>⚠ {error}</div>
      <div style={{ marginTop: 12, color: "#6b7280", fontSize: 11 }}>
        Expected JSON format:<br />
        {"[ { \"title\": \"...\", \"date\": \"...\", \"content\": \"...\" } ]"}
      </div>
    </div>
  );

  if (items.length === 0) return (
    <div style={{ padding: 24, color: "#6b7280", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>
      No news items found for {stock}.
    </div>
  );

  return (
    <div style={{ padding: "4px 0" }}>
      {items.map((item, idx) => {
        const open = expanded.has(idx);
        return (
          <div key={idx} className={`news-item ${open ? "open" : ""}`} onClick={() => toggle(idx)}>
            <div className="news-item-header">
              <div className="news-meta">
                <span className="news-index">{String(idx + 1).padStart(2, "0")}</span>
                <span className="news-date">{formatDate(item.date)}</span>
                {item.source && <span className="news-source">{item.source}</span>}
              </div>
              <div className="news-title">{item.title}</div>
              <span className="news-toggle">{open ? "▲" : "▼"}</span>
            </div>
            {open && (
              <div className="news-content">
                {item.content || <span style={{ color: "#6b7280" }}>No content available.</span>}
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        .news-item {
          border-bottom: 1px solid #1c2028;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.15s;
          position: relative;
        }
        .news-item:hover, .news-item.open {
          background: #151920;
        }
        .news-item-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .news-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .news-index {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: #00d4ff;
          letter-spacing: 0.06em;
        }
        .news-date {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: #6b7280;
        }
        .news-source {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: #a78bfa;
          background: rgba(167,139,250,0.1);
          padding: 1px 5px;
          border-radius: 2px;
        }
        .news-title {
          font-size: 12px;
          font-weight: 600;
          color: #e8eaf0;
          line-height: 1.4;
          padding-right: 20px;
          font-family: 'Syne', 'Trebuchet MS', sans-serif;
        }
        .news-toggle {
          position: absolute;
          top: 14px;
          right: 14px;
          color: #6b7280;
          font-size: 9px;
        }
        .news-content {
          margin-top: 10px;
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.6;
          font-family: 'IBM Plex Mono', monospace;
          white-space: pre-wrap;
          word-break: break-word;
          border-top: 1px solid #1c2028;
          padding-top: 10px;
        }
      `}</style>
    </div>
  );
}
