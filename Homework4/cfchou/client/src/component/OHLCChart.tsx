import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import type { ComponentSize, Margin, PricePoint, StockSeries } from '../types';
import { palette } from '../theme';

interface Props {
  data: StockSeries;
}

const seriesColors = {
  open: '#7E9DB5',
  high: '#7B9E89',
  low: '#B58A7E',
  close: '#8B7B9A',
} as const;

const seriesOrder = ['open', 'high', 'low', 'close'] as const;
type SeriesKey = typeof seriesOrder[number];

const SERIES_LABEL: Record<SeriesKey, string> = {
  open: 'Open',
  high: 'High',
  low: 'Low',
  close: 'Close',
};

const margin: Margin = { left: 56, right: 16, top: 36, bottom: 32 };

interface Hover {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  px: number;
}

export function OHLCChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<ComponentSize | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    open: true, high: true, low: true, close: true,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(
      debounce((entries: ResizeObserverEntry[]) => {
        const e = entries[0];
        if (!e) return;
        const { width, height } = e.contentRect as ComponentSize;
        if (width > 0 && height > 60) setSize({ width, height });
      }, 80),
    );
    ro.observe(containerRef.current);
    const r = containerRef.current.getBoundingClientRect();
    if (r.width && r.height) setSize({ width: r.width, height: r.height });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !size) return;
    const svg = d3.select(svgRef.current);
    const { width, height } = size;
    const left = margin.left;
    const right = width - margin.right;
    const top = margin.top;
    const bottom = height - margin.bottom;
    const innerW = right - left;
    const innerH = bottom - top;
    if (innerW < 40 || innerH < 40) return;

    let root = svg.select<SVGGElement>('g.ohlc-root');
    if (root.empty()) {
      root = svg.append('g').attr('class', 'ohlc-root') as d3.Selection<SVGGElement, unknown, null, undefined>;
      root.append('defs').append('clipPath').attr('id', 'ohlc-clip').append('rect');
      root.append('g').attr('class', 'ohlc-grid');
      root.append('g').attr('class', 'ohlc-x-axis');
      root.append('g').attr('class', 'ohlc-y-axis');
      root.append('text').attr('class', 'ohlc-y-label')
        .attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', palette.textMuted);
      root.append('text').attr('class', 'ohlc-x-label')
        .attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', palette.textMuted);
      root.append('g').attr('class', 'ohlc-lines').attr('clip-path', 'url(#ohlc-clip)');
      root.append('g').attr('class', 'ohlc-hover');
      root.append('rect').attr('class', 'ohlc-zoom-catcher')
        .attr('fill', 'transparent').style('cursor', 'crosshair');
    }

    root.select('#ohlc-clip rect')
      .attr('x', left).attr('y', top).attr('width', innerW).attr('height', innerH);

    const xExt = d3.extent(data.data, (d) => d.date) as [Date, Date];
    const xBase = d3.scaleTime().domain(xExt).range([left, right]);

    const yValues: number[] = [];
    for (const key of seriesOrder) {
      if (!visible[key]) continue;
      for (const d of data.data) yValues.push(d[key]);
    }
    if (yValues.length === 0) {
      yValues.push(0, 1);
    }
    const yExt = d3.extent(yValues) as [number, number];
    const yPad = (yExt[1] - yExt[0]) * 0.05 || 1;
    const y = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([bottom, top]);

    const zoomCatcher = root.select<SVGRectElement>('rect.ohlc-zoom-catcher')
      .attr('x', left).attr('y', top).attr('width', innerW).attr('height', innerH);

    const zoom = d3.zoom<SVGRectElement, unknown>()
      .scaleExtent([1, 80])
      .translateExtent([[left, top], [right, bottom]])
      .extent([[left, top], [right, bottom]])
      .filter((event) => event.type !== 'dblclick')
      .on('zoom', (event) => {
        const t = event.transform;
        const x = t.rescaleX(xBase);
        renderForX(x);
      });
    zoomCatcher.call(zoom as never);
    zoomCatcher.on('dblclick.reset', () => {
      zoomCatcher.transition().duration(300).call(zoom.transform as never, d3.zoomIdentity);
    });

    function renderForX(x: d3.ScaleTime<number, number>) {
      const xAxis = d3.axisBottom<Date>(x)
        .ticks(Math.max(4, Math.floor(innerW / 90))).tickSizeOuter(0);
      root.select<SVGGElement>('g.ohlc-x-axis')
        .attr('transform', `translate(0,${bottom})`)
        .call(xAxis as never)
        .call((g) => g.selectAll('text').attr('fill', palette.textMuted))
        .call((g) => g.selectAll('line, path').attr('stroke', palette.axis));

      const yAxis = d3.axisLeft(y)
        .ticks(Math.max(4, Math.floor(innerH / 40)))
        .tickFormat((d) => {
          const v = +d;
          if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
          return v.toFixed(v < 10 ? 2 : 0);
        })
        .tickSizeOuter(0);
      root.select<SVGGElement>('g.ohlc-y-axis')
        .attr('transform', `translate(${left},0)`)
        .call(yAxis as never)
        .call((g) => g.selectAll('text').attr('fill', palette.textMuted))
        .call((g) => g.selectAll('line, path').attr('stroke', palette.axis));

      root.select('text.ohlc-y-label')
        .attr('transform', `translate(${left - 40}, ${(top + bottom) / 2}) rotate(-90)`)
        .text('Price ($)');
      root.select('text.ohlc-x-label')
        .attr('transform', `translate(${(left + right) / 2}, ${bottom + 26})`)
        .text('Date');

      const gridTicks = y.ticks(Math.max(4, Math.floor(innerH / 40)));
      const gridSel = root.select('g.ohlc-grid')
        .selectAll<SVGLineElement, number>('line.gridline').data(gridTicks, (d) => `${d}`);
      gridSel.exit().remove();
      gridSel.enter().append('line').attr('class', 'gridline')
        .attr('stroke', palette.grid).attr('stroke-dasharray', '2 3')
        .merge(gridSel)
        .attr('x1', left).attr('x2', right)
        .attr('y1', (d) => y(d)).attr('y2', (d) => y(d));

      const lineGen = d3.line<PricePoint>()
        .x((d) => x(d.date))
        .curve(d3.curveMonotoneX);

      const linesSel = root.select('g.ohlc-lines')
        .selectAll<SVGPathElement, SeriesKey>('path.ohlc-line')
        .data(seriesOrder.filter((k) => visible[k]), (k) => k);
      linesSel.exit().remove();
      const linesEnter = linesSel.enter().append('path')
        .attr('class', 'ohlc-line')
        .attr('fill', 'none')
        .attr('stroke-width', 1.6);
      linesEnter.merge(linesSel)
        .attr('stroke', (k) => seriesColors[k])
        .attr('d', (k) => lineGen.y((d) => y(d[k]))(data.data) ?? '');
    }

    renderForX(xBase);

    const hoverG = root.select('g.ohlc-hover');
    hoverG.selectAll('*').remove();
    const xLine = hoverG.append('line').attr('y1', top).attr('y2', bottom)
      .attr('stroke', palette.textMuted).attr('stroke-dasharray', '2 3').attr('opacity', 0);
    const dotsG = hoverG.append('g');

    const bisect = d3.bisector<PricePoint, Date>((d) => d.date).left;

    zoomCatcher
      .on('mousemove.hover', (event: MouseEvent) => {
        const t = d3.zoomTransform(zoomCatcher.node()!);
        const x = t.rescaleX(xBase);
        const [mx] = d3.pointer(event, svgRef.current!);
        const date = x.invert(mx);
        if (data.data.length === 0) return;
        const i = bisect(data.data, date);
        const candidates = [data.data[Math.max(0, i - 1)], data.data[Math.min(data.data.length - 1, i)]];
        const picked = candidates.reduce((best, p) =>
          Math.abs(+p.date - +date) < Math.abs(+best.date - +date) ? p : best);

        const px = x(picked.date);
        xLine.attr('x1', px).attr('x2', px).attr('opacity', 1);
        const dotData = seriesOrder.filter((k) => visible[k]).map((k) => ({
          k, value: picked[k], color: seriesColors[k],
        }));
        const dots = dotsG.selectAll<SVGCircleElement, typeof dotData[number]>('circle').data(dotData, (d) => d.k);
        dots.exit().remove();
        dots.enter().append('circle').attr('r', 3.5).attr('stroke', palette.bgPanel).attr('stroke-width', 1.5)
          .merge(dots)
          .attr('cx', px)
          .attr('cy', (d) => y(d.value))
          .attr('fill', (d) => d.color);
        setHover({ date: picked.date, open: picked.open, high: picked.high, low: picked.low, close: picked.close, px });
      })
      .on('mouseleave.hover', () => {
        xLine.attr('opacity', 0);
        dotsG.selectAll('*').remove();
        setHover(null);
      });
  }, [data, size, visible]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />

      <div
        style={{
          position: 'absolute', left: margin.left + 4, top: 6,
          display: 'inline-flex', flexDirection: 'row', flexWrap: 'wrap',
          alignItems: 'center', gap: '3px 6px',
          background: `${palette.bgPanel}E6`,
          border: `1px solid ${palette.border}`, borderRadius: 6,
          padding: '3px 6px', fontSize: 10.5, color: palette.text,
          pointerEvents: 'none', zIndex: 3,
        }}
      >
        {seriesOrder.map((k) => {
          const on = visible[k];
          return (
            <button
              key={k}
              onClick={() => setVisible((cur) => ({ ...cur, [k]: !cur[k] }))}
              title={on ? `Hide ${SERIES_LABEL[k]}` : `Show ${SERIES_LABEL[k]}`}
              style={{
                pointerEvents: 'auto',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '1px 4px', margin: 0,
                background: 'transparent', border: 'none', borderRadius: 3,
                cursor: 'pointer',
                color: palette.text, fontSize: 10.5,
                opacity: on ? 1 : 0.4, fontWeight: 500,
              }}
            >
              <span style={{
                display: 'inline-block', width: 9, height: 9,
                background: seriesColors[k], borderRadius: 2, flexShrink: 0,
              }} />
              <span>{SERIES_LABEL[k]}</span>
              {hover && on && (
                <span style={{ fontVariantNumeric: 'tabular-nums', marginLeft: 2, fontWeight: 600 }}>
                  {hover[k].toFixed(2)}
                </span>
              )}
            </button>
          );
        })}
        {hover && (
          <span style={{ color: palette.textMuted, marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>
            {hover.date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
