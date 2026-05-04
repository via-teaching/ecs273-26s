import { useEffect, useState } from 'react';
import { loadNews, type NewsItem } from '../dataLoader';
import { palette } from '../theme';

interface Props {
  symbol: string;
}

export function NewsList({ symbol }: Props) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setExpanded(null);
    loadNews(symbol).then((arr) => {
      if (cancelled) return;
      setItems(arr);
      setReady(true);
      setExpanded(arr.length > 0 ? 0 : null);
    });
    return () => { cancelled = true; };
  }, [symbol]);

  if (!ready) {
    return <Centered text={`Loading news for ${symbol}…`} />;
  }
  if (items.length === 0) {
    return <Centered text={`No news for ${symbol}`} />;
  }
  return (
    <div className="flex flex-col gap-2 p-2 overflow-y-auto h-full">
      <div className="text-xs px-1" style={{ color: palette.textMuted }}>
        {items.length} article{items.length === 1 ? '' : 's'} · sorted newest first
      </div>
      {items.map((item, i) => {
        const isOpen = expanded === i;
        return (
          <article
            key={`${symbol}-${i}-${item.date}`}
            onClick={() => setExpanded(isOpen ? null : i)}
            className="cursor-pointer transition-colors"
            style={{
              padding: '8px 10px',
              borderRadius: 6,
              border: `1px solid ${isOpen ? palette.primary : palette.border}`,
              background: isOpen ? `${palette.primary}10` : palette.bgPanel,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <h4
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: palette.text,
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: isOpen ? 'unset' : 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.title}
              </h4>
              <svg
                width="12" height="12" viewBox="0 0 12 12"
                style={{
                  flexShrink: 0, marginTop: 3, marginLeft: 4,
                  transition: 'transform 200ms ease',
                  transform: isOpen ? 'rotate(180deg)' : 'none',
                  color: palette.textMuted,
                }}
              >
                <path
                  d="M2.5 4.5 L6 8 L9.5 4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ fontSize: 10.5, color: palette.textMuted, marginTop: 3 }}>
              {formatDate(item.date)}
            </div>
            {isOpen && (
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    fontSize: 11.5,
                    color: palette.text,
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    maxHeight: 320,
                    overflowY: 'auto',
                    paddingRight: 4,
                  }}
                >
                  {item.content || <span style={{ color: palette.textMuted, fontStyle: 'italic' }}>(no body text)</span>}
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-block', marginTop: 8,
                      fontSize: 10.5, color: palette.primary,
                      textDecoration: 'underline',
                    }}
                  >
                    Open original →
                  </a>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function Centered({ text }: { text: string }) {
  return (
    <div
      className="flex items-center justify-center w-full h-full"
      style={{ color: palette.textMuted, fontSize: 12, padding: 12, textAlign: 'center' }}
    >
      {text}
    </div>
  );
}

function formatDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return iso;
  const [, y, mo, d, hh, mm] = m;
  const date = new Date(+y, +mo - 1, +d);
  const datePart = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  return hh && mm ? `${datePart} · ${hh}:${mm}` : datePart;
}
