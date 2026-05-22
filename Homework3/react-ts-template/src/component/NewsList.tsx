import { useEffect, useState } from "react";

interface NewsItem {
  path: string;
  filename: string;
  title: string;
  date: string;
}

function parseFilename(filename: string): { date: string; title: string } {
  const stem = filename.replace(/\.txt$/i, "");
  const m = stem.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})_(\d{2})_(.*)/);

  if (m) {
    return {
      date: `${m[1]}T${m[2]}:${m[3]}:00`,
      title: m[4].replace(/_/g, " ").trim(),
    };
  }

  return { date: "", title: stem.replace(/_/g, " ") };
}

function formatDate(d: string) {
  if (!d) return "";

  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

function cleanArticleText(text: string) {
  let cleaned = text;

  cleaned = cleaned
    .replace(/^Title\s+.*?\s+Date\s+.*?\s+URL\s+.*?\s+Content\s+/s, "")
    .replace(/Oops, something went wrong/g, "")
    .replace(/Tip: Try a valid symbol or a specific company name for relevant results/g, "")
    .replace(/Sign in to access your portfolio/g, "");

  // Yahoo garbage block usually ends right before the real article.
  const garbageEndMarkers = [
    "Goldman Sachs delivered a warning to laid-off tech workers that it will take more time to find a new job than expected",
    "Tech is doing everything right and getting left behind. Here's what could turn that around.",
    "US gas prices risk topping $5 per gallon if the Strait of Hormuz stays closed, JPMorgan says",
  ];

  for (const marker of garbageEndMarkers) {
    const index = cleaned.indexOf(marker);
    if (index !== -1) {
      cleaned = cleaned.slice(index + marker.length);
      break;
    }
  }

  cleaned = cleaned
    .replace(/WHILE YOU’RE HERE:.*/s, "")
    .replace(/Want the latest recommendations from Zacks Investment Research\?.*/s, "")
    .replace(/Click to get this free report.*/s, "")
    .replace(/This article originally published on.*/s, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "Article content could not be cleaned.";
}

const ALL_TXT_URLS = import.meta.glob(
  "/data/stocknews/**/*.txt",
  {
    eager: false,
    query: "?url",
    import: "default",
  }
) as Record<string, () => Promise<string>>;

function buildIndex(): Record<string, NewsItem[]> {
  const index: Record<string, NewsItem[]> = {};

  for (const path of Object.keys(ALL_TXT_URLS)) {
    const parts = path.split("/");
    const ticker = parts[parts.length - 2];
    const filename = parts[parts.length - 1];
    const { date, title } = parseFilename(filename);

    if (!index[ticker]) index[ticker] = [];

    index[ticker].push({
      path,
      filename,
      title,
      date,
    });
  }

  for (const ticker of Object.keys(index)) {
    index[ticker].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  return index;
}

const NEWS_INDEX = buildIndex();

export default function NewsList({ stock }: { stock: string }) {
  const items = NEWS_INDEX[stock] ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loadedContent, setLoadedContent] = useState<Record<string, string>>({});

  useEffect(() => {
    setExpanded(null);
  }, [stock]);

  const toggle = async (item: NewsItem) => {
    if (expanded === item.path) {
      setExpanded(null);
      return;
    }

    setExpanded(item.path);

    if (loadedContent[item.path] !== undefined) return;

    const loader = ALL_TXT_URLS[item.path];

    if (!loader) {
      setLoadedContent((p) => ({
        ...p,
        [item.path]: "(file not found)",
      }));
      return;
    }

    try {
      const url = await loader();
      const r = await fetch(url);

      if (!r.ok) throw new Error("Could not fetch file");

      const txt = await r.text();

      setLoadedContent((p) => ({
        ...p,
        [item.path]: txt.trim(),
      }));
    } catch {
      setLoadedContent((p) => ({
        ...p,
        [item.path]: "(could not load content)",
      }));
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-xs text-center px-6 gap-2 text-gray-600">
        <span>No articles found for {stock}.</span>
        <span className="text-gray-700">
          Make sure .txt files exist at{" "}
          <code className="text-gray-800">data/stocknews/{stock}/</code>
        </span>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-300">
      {items.map((item) => {
        const isOpen = expanded === item.path;
        const content = loadedContent[item.path];

        return (
          <div
            key={item.path}
            className={`transition-colors ${
              isOpen ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
          >
            <button
              onClick={() => toggle(item)}
              className="w-full text-left px-4 py-3 flex items-start gap-3 focus:outline-none"
            >
              <span
                className="mt-0.5 flex-shrink-0 text-gray-500 text-xs"
                style={{
                  display: "inline-block",
                  transition: "transform 0.2s",
                  transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                ▶
              </span>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-snug ${
                    isOpen ? "text-black" : "text-gray-800 truncate"
                  }`}
                >
                  {item.title}
                </p>

                <span className="text-xs text-emerald-600">
                  {formatDate(item.date)}
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pl-10 text-xs text-gray-700 leading-relaxed">
                {content === undefined ? (
                  <span className="text-gray-500 italic">Loading…</span>
                ) : (
                  <p className="whitespace-pre-line">
                    {cleanArticleText(content)}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}