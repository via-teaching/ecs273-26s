import { useEffect, useState } from "react";
import { fetchStockNews } from "../api.js";

const NO_BODY =
  "This article summary is limited because the original source did not provide a clean full-text version in the local dataset after removing webpage noise, unrelated headlines, advertisements, and boilerplate text. The item is still included because its title, date, ticker association, and available metadata indicate that it is connected to the selected stock. In the context of this visualization, it can still be useful as a signal of market attention, company-related discussion, or sector-level activity during the selected time period. Users should treat this entry as a lightweight news reference rather than a complete article body, and can compare it with the stock price chart and t-SNE view to understand when the item appeared relative to broader stock behavior.";

function decodeHtmlEntities(str) {
  if (typeof document === "undefined" || !str) return str;
  const el = document.createElement("textarea");
  el.innerHTML = str;
  return el.value;
}

function htmlToPlainText(raw) {
  if (!raw || typeof raw !== "string") return "";
  let s = decodeHtmlEntities(raw.replace(/\r\n/g, "\n")).trim();
  if (!s) return "";
  if (typeof document !== "undefined" && s.includes("<")) {
    const tmp = document.createElement("div");
    tmp.innerHTML = s;
    s = tmp.textContent ?? "";
  } else {
    s = s.replace(/<[^>]+>/g, " ");
  }
  return s.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();
}

function plainBody(content, title) {
  const text = htmlToPlainText(content ?? "");
  if (!text) return "";
  if (title && text.toLowerCase().startsWith(title.toLowerCase())) {
    return text.slice(title.length).trim();
  }
  return text;
}

export default function NewsList({ selectedStock }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    setExpandedIndex(null);
  }, [selectedStock]);

  useEffect(() => {
    if (!selectedStock) {
      setNews([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    (async () => {
      try {
        const data = await fetchStockNews(selectedStock);
        if (cancelled) return;

        const articles = (data.articles ?? []).map((a, index) => ({
          id: `${selectedStock}-${index}-${a.title}`,
          title: a.title || "Untitled",
          date: a.date || "",
          content: a.content || "",
        }));

        console.log("Loaded news:", selectedStock, articles.length);
        setNews(articles);
      } catch {
        if (!cancelled) {
          setNews([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedStock]);

  const handleRowClick = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
      <div className="mb-2 border-b border-slate-100 pb-2 text-[11px] text-slate-500">
        <span className="font-medium text-slate-700">{selectedStock || "—"}</span> headlines
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5">
        {loading && <p className="text-sm text-slate-500">Loading news...</p>}

        {loadError && !loading && (
          <p className="text-sm text-amber-800">Could not load data from backend.</p>
        )}

        {!loading && !loadError && news.length === 0 && (
          <p className="text-sm text-slate-600">No news found for this stock.</p>
        )}

        <ul className="flex flex-col gap-3">
          {news.map((item, index) => {
            const open = expandedIndex === index;
            const body = open ? plainBody(item.content, item.title) : "";
            const show = body.length > 0;
            return (
              <li key={item.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => handleRowClick(index)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                    open
                      ? "border-slate-300 bg-slate-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-sm font-medium leading-snug text-slate-900">{item.title}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{item.date}</div>
                  {open && (
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <p className="max-h-[min(50vh,28rem)] overflow-y-auto whitespace-pre-wrap break-words text-left text-[13px] leading-relaxed text-slate-700">
                        {show ? body : NO_BODY}
                      </p>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
