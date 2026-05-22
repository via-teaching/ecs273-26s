import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

type Row = {
  Date: Date;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
};

type Props = {
  ticker: string;
};

const SERIES: { key: keyof Row; label: string; color: string }[] = [
  { key: 'Open', label: 'Open', color: '#2563eb' },   // blue
  { key: 'High', label: 'High', color: '#10b981' },   // emerald
  { key: 'Low', label: 'Low', color: '#ef4444' },     // red
  { key: 'Close', label: 'Close', color: '#f59e0b' }, // amber
];

const Y_AXIS_WIDTH = 56;   // dedicated sticky left gutter for the Y axis
const RIGHT_PAD = 16;
const TOP_PAD = 16;
const BOTTOM_PAD = 32;

export default function LineChart({ ticker }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chartSvgRef = useRef<SVGSVGElement | null>(null);
  const yAxisSvgRef = useRef<SVGSVGElement | null>(null);

  const [data, setData] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1.0 = fits exactly inside the visible chart area; >1 enables horizontal scroll.
  const [zoom, setZoom] = useState<number>(1);

  // Visible chart-area dimensions (the scrollable inner viewport, not counting y-axis gutter).
  const [viewportWidth, setViewportWidth] = useState<number>(600);
  const [viewportHeight, setViewportHeight] = useState<number>(300);

  // Load CSV when ticker changes.
  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    setZoom(1);  // reset zoom on new stock

    const url = `${import.meta.env.BASE_URL}data/stockdata/${ticker}.csv`;
    d3.csv(url, (raw) => {
      const dateStr = (raw.Date ?? '').toString().slice(0, 10);
      return {
        Date: new Date(dateStr),
        Open: +raw.Open!,
        High: +raw.High!,
        Low: +raw.Low!,
        Close: +raw.Close!,
        Volume: +raw.Volume!,
      } as Row;
    })
      .then((rows) => {
        if (cancelled) return;
        const sorted = rows
          .filter((r) => !Number.isNaN(r.Open))
          .sort((a, b) => +a.Date - +b.Date);
        setData(sorted);
      })
      .catch((err) => {
        if (!cancelled) setError(`Failed to load ${ticker}.csv: ${err.message}`);
      });

    return () => { cancelled = true; };
  }, [ticker]);

  // Track the visible scroll-area size.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setViewportWidth(Math.max(280, rect.width));
      setViewportHeight(Math.max(200, rect.height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const yExtent = useMemo<[number, number] | null>(() => {
    if (!data || data.length === 0) return null;
    let lo = Infinity, hi = -Infinity;
    for (const r of data) {
      lo = Math.min(lo, r.Open, r.High, r.Low, r.Close);
      hi = Math.max(hi, r.Open, r.High, r.Low, r.Close);
    }
    const pad = (hi - lo) * 0.05 || 1;
    return [lo - pad, hi + pad];
  }, [data]);

  const xExtent = useMemo<[Date, Date] | null>(() => {
    if (!data || data.length === 0) return null;
    return [data[0].Date, data[data.length - 1].Date];
  }, [data]);

  // Render the chart. We render the X axis + lines inside the wide scrolling SVG,
  // and the Y axis inside a separate fixed-position SVG that doesn't scroll.
  useEffect(() => {
    if (!data || !yExtent || !xExtent || !chartSvgRef.current || !yAxisSvgRef.current) return;

    const totalWidth = Math.max(viewportWidth, viewportWidth * zoom);
    const innerWidth = totalWidth - RIGHT_PAD;       // x-range goes from 0..innerWidth inside chart svg
    const innerHeight = viewportHeight - TOP_PAD - BOTTOM_PAD;

    // ---------- Chart SVG (lines + X axis + grid) ----------
    const chartSvg = d3.select(chartSvgRef.current);
    chartSvg.selectAll('*').remove();
    chartSvg
      .attr('width', totalWidth)
      .attr('height', viewportHeight);

    const g = chartSvg.append('g').attr('transform', `translate(0,${TOP_PAD})`);

    const x = d3.scaleTime().domain(xExtent).range([0, innerWidth]);
    const y = d3.scaleLinear().domain(yExtent).range([innerHeight, 0]).nice();

    // Light gridlines for Y on the chart area.
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(y)
          .tickSize(-innerWidth)
          .tickFormat(() => '') as any
      )
      .call((sel) => sel.selectAll('line').attr('stroke', '#e5e7eb'))
      .call((sel) => sel.selectAll('path').attr('stroke', 'transparent'));

    // X axis (time).
    const xAxis = d3.axisBottom(x)
      .ticks(Math.max(4, Math.floor(innerWidth / 90)))
      .tickFormat((d) => d3.timeFormat('%b %Y')(d as Date));
    const xAxisG = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);
    xAxisG.selectAll('text').attr('fill', '#374151').style('font-size', '11px');
    xAxisG.selectAll('path,line').attr('stroke', '#9ca3af');

    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 28)
      .attr('text-anchor', 'middle')
      .attr('fill', '#374151')
      .style('font-size', '11px')
      .text('Date');

    // Lines for each series.
    for (const s of SERIES) {
      const line = d3.line<Row>()
        .x((d) => x(d.Date))
        .y((d) => y(d[s.key] as number))
        .curve(d3.curveMonotoneX);
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', s.color)
        .attr('stroke-width', 1.5)
        .attr('d', line);
    }

    // Hover crosshair + tooltip.
    const focusLine = g.append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#9ca3af')
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0);

    const tooltip = d3.select(containerRef.current)
      .selectAll<HTMLDivElement, unknown>('.linechart-tooltip')
      .data([null])
      .join('div')
      .attr('class', 'linechart-tooltip')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', 'rgba(15,23,42,0.95)')
      .style('color', '#f8fafc')
      .style('font-size', '11px')
      .style('padding', '6px 8px')
      .style('border-radius', '4px')
      .style('opacity', 0)
      .style('z-index', '20');

    const bisect = d3.bisector<Row, Date>((d) => d.Date).left;

    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .on('mouseenter', () => {
        focusLine.style('opacity', 1);
        tooltip.style('opacity', 1);
      })
      .on('mouseleave', () => {
        focusLine.style('opacity', 0);
        tooltip.style('opacity', 0);
      })
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event, this);
        const date = x.invert(mx);
        const i = bisect(data, date, 1);
        const a = data[i - 1];
        const b = data[i] ?? a;
        const d = (date.getTime() - a.Date.getTime()) <
                  (b.Date.getTime() - date.getTime()) ? a : b;
        const cx = x(d.Date);
        focusLine.attr('x1', cx).attr('x2', cx);

        const scrollEl = scrollRef.current!;
        const tooltipX = Y_AXIS_WIDTH + cx - scrollEl.scrollLeft + 12;
        const tooltipY = 8;
        tooltip
          .style('left', `${tooltipX}px`)
          .style('top', `${tooltipY}px`)
          .html(
            `<div style="font-weight:600;margin-bottom:4px">${d3.timeFormat('%Y-%m-%d')(d.Date)}</div>` +
            SERIES.map((s) =>
              `<div><span style="display:inline-block;width:8px;height:8px;background:${s.color};margin-right:6px;border-radius:2px"></span>${s.label}: $${(d[s.key] as number).toFixed(2)}</div>`
            ).join('')
          );
      });

    // ---------- Y-axis SVG (sticky, never scrolls) ----------
    const yaxSvg = d3.select(yAxisSvgRef.current);
    yaxSvg.selectAll('*').remove();
    yaxSvg
      .attr('width', Y_AXIS_WIDTH)
      .attr('height', viewportHeight);

    const yg = yaxSvg.append('g').attr('transform', `translate(${Y_AXIS_WIDTH},${TOP_PAD})`);
    const yAxis = d3.axisLeft(y).ticks(6).tickFormat((d) => `$${d}`);
    const yAxisG = yg.call(yAxis);
    yAxisG.selectAll('text').attr('fill', '#374151').style('font-size', '11px');
    yAxisG.selectAll('path,line').attr('stroke', '#9ca3af');

    yaxSvg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(TOP_PAD + innerHeight / 2))
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#374151')
      .style('font-size', '11px')
      .text('Price (USD)');
  }, [data, yExtent, xExtent, viewportWidth, viewportHeight, zoom]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col">
      {/* Header / controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-700">
          <span className="font-semibold">{ticker}</span>
          <span className="ml-2 text-slate-500">
            {data ? `${data.length} trading days` : 'loading…'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Zoom</span>
          <input
            type="range"
            min={1}
            max={6}
            step={0.25}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-32 accent-emerald-600"
          />
          <span className="w-8 text-right">{zoom.toFixed(2)}x</span>
        </div>
      </div>

      {/* Chart area: y-axis stays fixed on the left; the time series scrolls horizontally. */}
      <div className="flex-1 min-h-[200px] border border-slate-200 rounded bg-white overflow-hidden flex">
        {error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : !data ? (
          <div className="p-4 text-sm text-slate-500">Loading {ticker} data…</div>
        ) : (
          <>
            <svg
              ref={yAxisSvgRef}
              className="block flex-shrink-0"
              style={{ width: Y_AXIS_WIDTH }}
            />
            <div
              ref={scrollRef}
              className="flex-1 overflow-x-auto overflow-y-hidden"
            >
              <svg ref={chartSvgRef} className="block" />
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5" style={{ background: s.color }} />
            <span>{s.label}</span>
          </div>
        ))}
        <div className="ml-auto text-slate-400 italic">
          Drag the zoom slider, then scroll horizontally to pan.
        </div>
      </div>
    </div>
  );
}
