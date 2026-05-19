import { useEffect, useState } from 'react';
import { STOCKS } from './stockMeta';
import { loadStock } from './dataLoader';
import { OHLCChart } from './component/OHLCChart';
import { TSNEScatter } from './component/TSNEScatter';
import { NewsList } from './component/NewsList';
import RenderOptions from './component/options';
import type { StockSeries } from './types';
import { palette } from './theme';

export default function App() {
  const [selected, setSelected] = useState<string>('NVDA');
  const [series, setSeries] = useState<StockSeries | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    loadStock(selected)
      .then((s) => { if (!cancelled) setSeries(s); })
      .catch((err) => { if (!cancelled) setLoadError(String(err.message ?? err)); });
    return () => { cancelled = true; };
  }, [selected]);

  return (
    <div className="flex flex-col h-full w-full" style={{ background: palette.bg }}>
      <header
        className="px-4 py-2 flex flex-row items-center gap-3 border-b"
        style={{
          background: palette.bgPanel,
          borderColor: palette.border,
          color: palette.text,
          boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 4px 12px rgba(95, 80, 60, 0.04)',
        }}
      >
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: palette.text }}>
          20 Stocks Info Dashboard
        </h2>
        <label htmlFor="stock-select" className="ml-2 text-sm flex items-center gap-2"
          style={{ color: palette.textMuted }}>
          Stock
          <div className="stock-select-wrap" style={{ position: 'relative', display: 'inline-block' }}>
            <select
              id="stock-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                background: palette.bg,
                color: palette.text,
                border: `1px solid ${palette.border}`,
                borderRadius: 8,
                padding: '6px 32px 6px 12px',
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.2,
                minWidth: 200,
                cursor: 'pointer',
                outline: 'none',
                transition: 'border-color 160ms, box-shadow 160ms, background-color 160ms',
                fontVariantNumeric: 'tabular-nums',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = palette.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${palette.primary}33`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = palette.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = palette.bgPanel; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = palette.bg; }}
            >
              <RenderOptions />
            </select>
            <svg
              width="10" height="6" viewBox="0 0 10 6" fill="none"
              style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                opacity: 0.55,
              }}
            >
              <path d="M1 1 L5 5 L9 1" stroke={palette.text} strokeWidth="1.4"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </label>
        <div className="flex-1" />
        <span className="text-xs" style={{ color: palette.textMuted }}>
          {STOCKS.length} tickers · 2024-04-18 → 2026-04-17
        </span>
      </header>

      <div className="flex flex-row flex-1 min-h-0 w-full">
        <div className="flex flex-col w-2/3 min-w-0">
          <div className="h-1/2 p-2 min-h-0">
            <ViewFrame title={`Stock overview — ${selected}`}
              subtitle="Open, High, Low, Close · scroll to zoom · drag to pan">
              {loadError ? (
                <ErrorPanel message={loadError} />
              ) : series ? (
                <OHLCChart data={series} />
              ) : (
                <Loading text={`Loading ${selected}…`} />
              )}
            </ViewFrame>
          </div>

          <div className="h-1/2 p-2 min-h-0">
            <ViewFrame title="t-SNE — stocks colored by sector"
              subtitle="Selected stock highlighted · scroll to zoom">
              <TSNEScatter selectedSymbol={selected} onSelect={setSelected} />
            </ViewFrame>
          </div>
        </div>

        <div className="w-1/3 h-full p-2 min-w-0">
          <ViewFrame title={`News — ${selected}`}
            subtitle="Click a headline to expand">
            <NewsList symbol={selected} />
          </ViewFrame>
        </div>
      </div>
    </div>
  );
}

function ViewFrame({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-baseline gap-2 mb-1 px-1">
        <h3 className="text-sm font-medium" style={{ color: palette.text }}>{title}</h3>
        {subtitle && (
          <span className="text-xs truncate" style={{ color: palette.textMuted }}>{subtitle}</span>
        )}
      </div>
      <div
        className="rounded-lg flex-1 min-h-0 overflow-hidden"
        style={{
          background: palette.bgPanel,
          border: `1px solid ${palette.border}`,
          boxShadow: '0 1px 2px rgba(95, 80, 60, 0.04), 0 4px 12px rgba(95, 80, 60, 0.04)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-full" style={{ color: palette.textMuted, fontSize: 12 }}>
      {text}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full px-4 text-center"
      style={{ color: palette.down, fontSize: 12 }}>
      {message}
    </div>
  );
}
