import { useEffect, useState } from "react";

const NO_BODY = "No full content available for this news item.";
const ARTICLE_LOAD_FAILED = "Article file could not be loaded correctly.";

const NEWS_MANIFEST_URL = "/data/stocknews/news_manifest.json";
const NEWS_MANIFEST_FALLBACK_URL = "/data/stocknews/manifest.json";

function normalizeNewsRaw(rawText) {
  return (rawText ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trimStart();
}

function hasLabeledSections(rawText) {
  const text = normalizeNewsRaw(rawText);
  // Block labels ("Title" then newline) OR inline labels ("Title:", "Content:", …)
  const block = (label) => new RegExp(`\\b${label}\\s*\\n`, "i").test(text);
  const colon = (label) => new RegExp(`\\b${label}\\s*:`, "i").test(text);
  const sec = (l) => block(l) || colon(l);

  return sec("Title") && sec("Date") && sec("URL") && sec("Content");
}

function looksLikeViteOrAppShell(rawText) {
  const text = (rawText ?? "").slice(0, 5000);

  return [
    "@react-refresh",
    "injectIntoGlobalHook",
    "/src/main.jsx",
    "/src/main.tsx",
    '<div id="root">',
    "<title>Homework3</title>",
    "/@vite/client",
  ].some((marker) => text.includes(marker));
}

/** TEMP: attach to loadError items for UI + console debugging. */
function buildNewsLoadDebug(fileName, fetchUrl, res, rawText, networkError) {
  const labeled = hasLabeledSections(rawText ?? "");
  const vite = looksLikeViteOrAppShell(rawText ?? "");
  return {
    fileName,
    fetchUrl,
    responseStatus: networkError ? "network_error" : res?.status ?? 0,
    responseOk: networkError ? false : Boolean(res?.ok),
    hasLabeledSections: labeled,
    looksLikeViteOrAppShell: vite,
    rawPreview: (rawText ?? "").slice(0, 300),
  };
}

/** Only allow flat .txt filenames from the manifest (no paths, no traversal). */
function isSafeNewsFilename(name) {
  return (
    typeof name === "string" &&
    name.endsWith(".txt") &&
    !name.includes("..") &&
    !name.includes("/") &&
    !name.includes("\\")
  );
}

// Prefer these body fields in order (matches common export formats).
const BODY_FIELD_ORDER = [
  "content",
  "body",
  "article",
  "full_text",
  "description",
  "summary",
  "snippet",
];

function decodeHtmlEntities(str) {
  if (typeof document === "undefined" || !str) return str;
  const el = document.createElement("textarea");
  el.innerHTML = str;
  return el.value;
}

/** Drop script/style and obvious non-article payloads before we treat a field as readable text. */
function isAcceptableRawField(raw) {
  const s = raw.trim();
  if (!s) return false;
  if (/<script[\s>/]/i.test(s) || /<\/script>/i.test(s)) return false;
  if (/<style[\s>/]/i.test(s) || /<\/style>/i.test(s)) return false;
  // Single URL line (often a redirect or asset), not an article.
  if (/^https?:\/\/\S+$/i.test(s)) return false;
  return true;
}

/** HTML → plain text, decode entities, keep paragraph breaks a bit. */
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

function normalizeWhitespace(s) {
  return s
    .replace(/\r/g, " ")
    .replace(/[ \t\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const TITLE_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "from",
  "with",
  "this",
  "that",
  "into",
  "over",
  "after",
  "before",
  "your",
  "are",
  "was",
  "has",
  "have",
  "will",
  "its",
  "out",
  "how",
  "why",
  "what",
  "when",
  "who",
  "new",
  "all",
  "any",
  "but",
  "not",
  "now",
  "may",
  "can",
  "just",
  "more",
  "some",
  "than",
  "then",
  "here",
  "also",
  "only",
  "very",
  "most",
  "much",
  "such",
  "other",
  "about",
  "into",
  "taps",
  "power",
  "growth",
  "today",
  "stock",
  "stocks",
  "market",
  "markets",
  "trading",
  "earnings",
  "investors",
  "wall",
  "street",
]);

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Yahoo/Simply Wall St promos that sit between headline noise and the real lede. */
function stripInlineMarketingBridges(s) {
  let t = s;
  t = t.replace(
    /\bNever miss an important update on your stock portfolio\b[\s\S]*?\bFREE\.\s*/gi,
    " "
  );
  t = t.replace(/\bOver \d+ million investors trust Simply Wall St\b[\s\S]*?\bFREE\.\s*/gi, " ");
  t = t.replace(/\bcut through the noise\b[\s\S]{0,120}?\bFREE\.\s*/gi, " ");
  return normalizeWhitespace(t);
}

function stripLeadingYahooNoise(s) {
  let t = s;
  let prev;
  do {
    prev = t;
    t = t.replace(/^Oops,?\s*something went wrong\s*/i, "");
    t = t.replace(
      /^Tip:\s*Try a valid symbol or a specific company name for relevant results\s*/i,
      ""
    );
    t = t.replace(/^Sign in to access your portfolio\s*/i, "");
    t = t.replace(/^Create an account\b[\s\S]{0,200}?\.\s*/i, "");
    t = normalizeWhitespace(t);
  } while (t !== prev);
  return t;
}

/** First substantial paragraph: company name + (NYSE|NASDAQ:… ) + following prose. */
function findLikelyArticleStart(s, title) {
  const tickerLead =
    /\b[A-Z][A-Za-z0-9&'.-]*(?:\s+[A-Z][A-Za-z0-9&'.-]*){0,5}\s*\((?:NYSE|NASDAQ|AMEX|OTC):[A-Z]{1,5}\)\s+\S/;
  const m = tickerLead.exec(s);
  if (m && m.index != null) return m.index;

  const words = (title || "")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !TITLE_STOPWORDS.has(w.toLowerCase()));

  for (const w of words) {
    const re = new RegExp(`\\b${escapeRegex(w)}\\b`, "i");
    const hit = re.exec(s);
    if (hit && hit.index != null && hit.index >= 120 && s.length - hit.index > 180) {
      const slice = s.slice(hit.index);
      if (/^[A-Za-z]/.test(slice)) return hit.index;
    }
  }

  return 0;
}

const FOOTER_MARKERS = [
  "Stay updated on the most important news stories",
  "Alternatively, explore our Community",
  "We've flagged",
  "There is only one way to know the right time",
  "For the full picture including more risks and rewards",
  "check out the complete",
  "check out the community page",
  "This article by Simply Wall St is general in nature",
  "Have feedback on this article?",
  "Concerned about the content?",
  "Get in touch with us directly",
  "Alternatively, email editorial-team@simplywallst.com",
  "Simply Wall St has no position in any stocks mentioned",
  "Companies discussed in this article include",
  "Sign in to access your portfolio",
];

function stripTrailingBoilerplate(s) {
  if (!s) return "";
  const lower = s.toLowerCase();
  let cut = s.length;
  for (const marker of FOOTER_MARKERS) {
    const idx = lower.indexOf(marker.toLowerCase());
    if (idx !== -1) cut = Math.min(cut, idx);
  }
  const tipAt = lower.lastIndexOf("tip: try a valid symbol");
  if (tipAt !== -1 && tipAt > s.length * 0.35) cut = Math.min(cut, tipAt);

  let out = s.slice(0, cut).trim();
  out = out.replace(/\s+\.\s*$/g, ".").replace(/[\s,;:]+$/g, "");
  return out.trim();
}

/**
 * Strip HTML/entities, trim Yahoo headline dumps to the real article, drop legal/footer blocks.
 */
function cleanArticleContent(text, title) {
  if (!text || typeof text !== "string") return "";
  let s = normalizeWhitespace(htmlToPlainText(text));
  if (!s) return "";
  s = stripInlineMarketingBridges(s);
  s = stripLeadingYahooNoise(s);
  const start = findLikelyArticleStart(s, title);
  if (start > 0) s = s.slice(start).trim();
  s = stripTrailingBoilerplate(s);
  s = normalizeWhitespace(s);
  return s;
}

/** True if this still looks like a Yahoo headline collage, not a single article. */
function isStillNoisyArticle(s) {
  if (!s || s.length < 40) return true;
  if (/Oops,?\s*something went wrong/i.test(s)) return true;
  if (/^Tip:\s*Try a valid symbol/i.test(s)) return true;
  if (/\bSign in to access your portfolio\b/i.test(s)) return true;
  // Typical run of unrelated Yahoo one-liners still present
  if (/\bTax refunds shoot up\b.*\bJPMorgan profits rise\b/is.test(s)) return true;
  if (/\bS&P 500 closes above\b.*\bBitcoin bounced above\b/is.test(s)) return true;
  return false;
}

/** Pick first usable raw string from field order (no cleaning). */
function pickRawBodyString(fields) {
  for (const key of BODY_FIELD_ORDER) {
    const raw = fields[key];
    if (!raw || typeof raw !== "string") continue;
    if (!isAcceptableRawField(raw)) continue;
    if (htmlToPlainText(raw).length >= 25) return raw;
  }
  return "";
}

function pickRawFallbackSnippet(fields) {
  for (const key of ["description", "summary", "snippet"]) {
    const raw = fields[key];
    if (!raw || typeof raw !== "string") continue;
    if (!isAcceptableRawField(raw)) continue;
    if (htmlToPlainText(raw).length >= 20) return raw;
  }
  return "";
}

/** Whole-line section label (case-insensitive, tolerant of spaces). */
function lineIsSectionLabel(line, labelLower) {
  return line.trim().toLowerCase() === labelLower;
}

function findSectionLine(lines, labelLower, fromIdx) {
  for (let i = fromIdx; i < lines.length; i++) {
    if (lineIsSectionLabel(lines[i], labelLower)) return i;
  }
  return -1;
}

function sliceSection(lines, startAfterLabel, endExclusive) {
  if (startAfterLabel >= endExclusive) return "";
  return lines.slice(startAfterLabel, endExclusive).join("\n").trim();
}

/** e.g. Title: … on same line, Content: then body on following lines */
function parseColonLabeledNews(normalized) {
  const lines = normalized.split("\n");
  const chunks = { title: [], date: [], url: [], content: [] };
  let key = null;

  for (const line of lines) {
    const m = line.match(/^\s*(Title|Date|URL|Content)\s*:\s*(.*)$/i);
    if (m) {
      key = m[1].toLowerCase();
      if (m[2].length) chunks[key].push(m[2]);
    } else if (key) {
      chunks[key].push(line);
    }
  }

  return {
    title: chunks.title.join("\n").trim(),
    date: chunks.date.join("\n").trim(),
    url: chunks.url.join("\n").trim(),
    content: chunks.content.join("\n").trim(),
  };
}

function parseBlockLabeledNews(lines) {
  const iTitle = findSectionLine(lines, "title", 0);
  const iDate = findSectionLine(lines, "date", iTitle >= 0 ? iTitle + 1 : 0);
  const iUrl = findSectionLine(lines, "url", iDate >= 0 ? iDate + 1 : 0);
  const iContent = findSectionLine(lines, "content", iUrl >= 0 ? iUrl + 1 : 0);

  const fields = {};
  if (iTitle >= 0 && iDate > iTitle) fields.title = sliceSection(lines, iTitle + 1, iDate);
  if (iDate >= 0 && iUrl > iDate) fields.date = sliceSection(lines, iDate + 1, iUrl);
  if (iUrl >= 0 && iContent > iUrl) fields.url = sliceSection(lines, iUrl + 1, iContent);
  if (iContent >= 0) fields.content = sliceSection(lines, iContent + 1, lines.length);
  return fields;
}

/**
 * Local .txt: either block labels (Title on its own line) or colon labels (Title: value).
 */
function parseNewsFile(raw, filename) {
  const normalized = (raw ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const firstNonEmpty = lines.find((l) => l.trim() !== "") ?? "";

  let fields = {};
  if (/^\s*Title\s*:/i.test(firstNonEmpty)) {
    fields = parseColonLabeledNews(normalized);
  } else {
    fields = parseBlockLabeledNews(lines);
  }

  const fb = parseFilenameMeta(filename);
  const title = htmlToPlainText(fields.title ?? "") || fb.title;
  const date = htmlToPlainText(fields.date ?? "") || fb.date;

  return {
    id: filename,
    title,
    date,
    fields,
    fallbackRaw: hasLabeledSections(raw) ? normalized.trim() : "",
    loadError: false,
  };
}

function parseFilenameMeta(filename) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})_(\d{2})_(.+)\.txt$/);
  if (!m) return { title: filename.replace(/\.txt$/i, ""), date: "" };
  return {
    date: `${m[1]} ${m[2]}:${m[3]}`,
    title: m[4].replace(/_/g, " "),
  };
}

function bodyForItem(item) {
  if (item.loadError) return "";

  const title = item.title ?? "";
  let raw = pickRawBodyString(item.fields);

  if (!raw && item.fallbackRaw && !item.fields.content && !item.fields.body) {
    raw = item.fallbackRaw;
  }
  if (!raw) return "";

  let cleaned = cleanArticleContent(raw, title);
  const minGood = 80;

  if (cleaned.length < minGood || isStillNoisyArticle(cleaned)) {
    const altRaw = pickRawFallbackSnippet(item.fields);
    if (altRaw) {
      const altClean = cleanArticleContent(altRaw, title);
      if (altClean.length >= 35 && !isStillNoisyArticle(altClean)) cleaned = altClean;
    }
  }

  return cleaned;
}

export default function NewsList({ selectedStock }) {
  const [manifest, setManifest] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadManifest() {
      const tryFetch = async (url) => {
        console.log("Fetching news manifest:", url);
        const r = await fetch(url);
        const text = await r.text();
        console.log("Manifest response ok:", r.ok, r.status, url);
        if (!r.ok) return null;
        if (looksLikeViteOrAppShell(text)) return null;
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      };

      let data = await tryFetch(NEWS_MANIFEST_URL);
      if (data == null) data = await tryFetch(NEWS_MANIFEST_FALLBACK_URL);
      if (!cancelled) setManifest(data ?? {});
    }

    loadManifest();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setExpandedIndex(null);
  }, [selectedStock]);

  useEffect(() => {
    if (manifest === null) return;

    const files = manifest[selectedStock];
    if (!Array.isArray(files) || files.length === 0) {
      setNews([]);
      console.log("Loaded news:", selectedStock, 0);
      return;
    }

    const safeFiles = files.filter(isSafeNewsFilename);
    if (safeFiles.length === 0) {
      setNews([]);
      console.log("Loaded news:", selectedStock, 0);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const metaFor = (filename) => parseFilenameMeta(filename);

        const items = await Promise.all(
          safeFiles.map(async (filename) => {
            const url = `/data/stocknews/${selectedStock}/${encodeURIComponent(filename)}`;

            let res;
            try {
              res = await fetch(url);
            } catch {
              const m = metaFor(filename);
              const loadDebug = buildNewsLoadDebug(filename, url, null, "", true);
              console.log("News article failed (network):", loadDebug);
              return {
                id: filename,
                title: m.title,
                date: m.date,
                fields: {},
                fallbackRaw: "",
                loadError: true,
                loadDebug,
              };
            }

            const rawText = await res.text();
            const labeled = hasLabeledSections(rawText);
            const vite = looksLikeViteOrAppShell(rawText);
            const badPayload = !res.ok || vite || !labeled;

            if (badPayload) {
              const m = metaFor(filename);
              const loadDebug = buildNewsLoadDebug(filename, url, res, rawText, false);
              console.log("News article failed:", loadDebug);
              return {
                id: filename,
                title: m.title,
                date: m.date,
                fields: {},
                fallbackRaw: "",
                loadError: true,
                loadDebug,
              };
            }

            return parseNewsFile(rawText, filename);
          })
        );

        if (!cancelled) {
          setNews(items);
          console.log("Loaded news:", selectedStock, items.length);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [manifest, selectedStock]);

  const handleRowClick = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
      <div className="mb-2 border-b border-slate-100 pb-2 text-[11px] text-slate-500">
        <span className="font-medium text-slate-700">{selectedStock}</span> headlines
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5">
        {loading && <p className="text-sm text-slate-500">Loading…</p>}

        {!loading && news.length === 0 && (
          <p className="text-sm text-slate-600">No news found for this stock.</p>
        )}

        <ul className="flex flex-col gap-3">
          {news.map((item, index) => {
            const open = expandedIndex === index;
            const body = open && !item.loadError ? bodyForItem(item) : "";
            const show = body.length > 0;
            const dbg = item.loadDebug;
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
                  {open && item.loadError && dbg && (
                    <div className="mt-3 border-t border-amber-200 pt-3 text-left">
                      <p className="text-sm font-medium text-amber-900">{ARTICLE_LOAD_FAILED}</p>
                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        Temporary load debug
                      </p>
                      <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded border border-amber-100 bg-amber-50/80 p-2 font-mono text-[10px] leading-snug text-slate-800">
                        {`fileName: ${dbg.fileName}\nfetchUrl: ${dbg.fetchUrl}\nresponseStatus: ${String(dbg.responseStatus)}\nresponseOk: ${String(dbg.responseOk)}\nhasLabeledSections: ${String(dbg.hasLabeledSections)}\nlooksLikeViteOrAppShell: ${String(dbg.looksLikeViteOrAppShell)}\n--- raw (first 300 chars) ---\n${dbg.rawPreview}`}
                      </pre>
                    </div>
                  )}
                  {open && item.loadError && !dbg && (
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <p className="text-sm text-amber-900">{ARTICLE_LOAD_FAILED}</p>
                    </div>
                  )}
                  {open && !item.loadError && (
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
