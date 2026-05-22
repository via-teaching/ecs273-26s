import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { api } from '../api';

type Row = {
  Date: Date;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
};

type Props = { ticker: string };

const SERIES: { key: keyof Row; label: string; color: string }[] = [
  { key: 'Open', label: 'Open', color: '#2563eb' },
  { key: 'High', label: 'High', color: '#10b981' },
  { key: 'Low', label: 'Low', color: '#ef4444' },
  { key: 'Close', label: 'Close', color: '#f59e0b' },
];

const MARGIN = { top: 16, right: 16, bottom: 44, left: 64 };

export default function LineChart({ ticker }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [data, setData] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 600, h: 320 });

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);

    api.stock(ticker, controller.signal)
      .then((resp) => {
        const rows: Row[] = resp.rows.map((r) => ({
          Date: new Date(r.Date),
          Open: r.Open,
          High: r.High,
          Low: r.Low,
          Close: r.Close,
          Volume: r.Volume,
        }));
        rows.sort((a, b) => +a.Date - +b.Date);
        setData(rows);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      });

    return () => controller.abort();
  }, [ticker]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.max(320, rect.width), h: Math.max(240, rect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  const fullYExtent = useMemo<[number, number] | null>(() => {
    if (!data || !data.length) return null;
    let lo = Infinity, hi = -Infinity;
    for (const r of data) {
      lo = Math.min(lo, r.Open, r.High, r.Low, r.Close);
      hi = Math.max(hi, r.Open, r.High, r.Low, r.Close);
    }
    const pad = (hi - lo) * 0.05 || 1;
    return [lo - pad, hi + pad];
  }, [data]);

  const xExtent = useMemo<[Date, Date] | null>(() => {
    if (!data || !data.length) return null;
    return [data[0].Date, data[data.length - 1].Date];
  }, [data]);

  useEffect(() => {
    if (!data || !fullYExtent || !xExtent || !svgRef.current) return;

    const { w: width, h: height } = size;
    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const x0 = d3.scaleTime().domain(xExtent).range([0, innerW]);
    const y0 = d3.scaleLinear().domain(fullYExtent).range([innerH, 0]).nice();

    svg.append('defs')
      .append('clipPath').attr('id', 'linechart-clip')
      .append('rect').attr('width', innerW).attr('height', innerH);

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const xAxisG = g.append('g').attr('transform', `translate(0,${innerH})`);
    const yAxisG = g.append('g');

    g.append('text')
      .attr('x', innerW / 2).attr('y', innerH + 36)
      .attr('text-anchor', 'middle').attr('fill', '#1f2937')
      .style('font-size', '12px').style('font-weight', 500)
      .text('Date');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2).attr('y', -48)
      .attr('text-anchor', 'middle').attr('fill', '#1f2937')
      .style('font-size', '12px').style('font-weight', 500)
      .text('Price (USD)');

    const linesG = g.append('g').attr('clip-path', 'url(#linechart-clip)');

    const pathFor = (
      key: keyof Row,
      xs: d3.ScaleTime<number, number>,
      ys: d3.ScaleLinear<number, number>
    ) =>
      d3.line<Row>().x((d) => xs(d.Date)).y((d) => ys(d[key] as number)).curve(d3.curveMonotoneX)(data) ?? '';

    const paths = SERIES.map((s) =>
      linesG.append('path')
        .attr('fill', 'none')
        .attr('stroke', s.color)
        .attr('stroke-width', 1.5)
        .datum(data)
        .attr('d', pathFor(s.key, x0, y0))
    );

    const renderAxes = (
      xs: d3.ScaleTime<number, number>,
      ys: d3.ScaleLinear<number, number>
    ) => {
      const tickFmt = d3.timeFormat('%b %Y');
      const xa = xAxisG.call(
        d3.axisBottom(xs)
          .ticks(Math.max(4, Math.floor(innerW / 90)))
          .tickFormat((d) => tickFmt(d as Date))
      );
      xa.selectAll('text').attr('fill', '#374151').style('font-size', '11px');
      xa.selectAll('path,line').attr('stroke', '#9ca3af');

      const ya = yAxisG.call(d3.axisLeft(ys).ticks(6).tickFormat((d) => `$${d}`));
      ya.selectAll('text').attr('fill', '#374151').style('font-size', '11px');
      ya.selectAll('path,line').attr('stroke', '#9ca3af');
    };

    const redraw = (
      xs: d3.ScaleTime<number, number>,
      ys: d3.ScaleLinear<number, number>
    ) => {
      renderAxes(xs, ys);
      SERIES.forEach((s, i) => paths[i].attr('d', pathFor(s.key, xs, ys)));
    };

    redraw(x0, y0);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .translateExtent([[0, 0], [innerW, innerH]])
      .extent([[0, 0], [innerW, innerH]])
      .on('zoom', (event) => {
        const xs = event.transform.rescaleX(x0);
        redraw(xs, y0);
      });

    g.append('rect')
      .attr('width', innerW).attr('height', innerH)
      .attr('fill', 'transparent')
      .style('cursor', 'grab')
      .style('pointer-events', 'all')
      .lower();

    svg.call(zoom);

    svg.on('dblclick.zoom', () => {
      svg.transition().duration(250).call(zoom.transform, d3.zoomIdentity);
    });
  }, [data, fullYExtent, xExtent, size]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-slate-700">{ticker}</div>
        <div className="text-xs text-slate-500">Scroll to zoom · Drag to pan · Double-click to reset</div>
      </div>

      <div ref={wrapperRef} className="flex-1 min-h-[220px] border border-slate-200 rounded bg-white">
        {error ? (
          <div className="p-4 text-sm text-red-600">Error: {error}</div>
        ) : !data ? (
          <div className="p-4 text-sm text-slate-500">Loading…</div>
        ) : (
          <svg ref={svgRef} className="block" />
        )}
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5" style={{ background: s.color }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}