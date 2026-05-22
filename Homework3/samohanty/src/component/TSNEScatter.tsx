import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SECTOR_LABEL } from '../data/stocks';

type Row = { ticker: string; x: number; y: number; sector: string };

type Props = {
  selected: string;
  onSelect: (ticker: string) => void;
};

const SECTOR_ORDER = [
  'Energy',
  'Industrials',
  'Consumer_Discretionary',
  'Consumer_Staples',
  'Healthcare',
  'Financials',
  'Information_Technology',
];

const colorScale = d3.scaleOrdinal<string, string>()
  .domain(SECTOR_ORDER)
  .range(d3.schemeTableau10);

export default function TSNEScatter({ selected, onSelect }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<Row[] | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 480, h: 320 });

  useEffect(() => {
    d3.csv(`${import.meta.env.BASE_URL}data/tsne.csv`, (d) => ({
      ticker: d.ticker as string,
      x: +d.x!,
      y: +d.y!,
      sector: d.sector as string,
    })).then((rows) => setData(rows as Row[]));
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.max(320, rect.width), h: Math.max(240, rect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sectorsPresent = useMemo(() => {
    if (!data) return [] as string[];
    const set = new Set(data.map((d) => d.sector));
    return SECTOR_ORDER.filter((s) => set.has(s));
  }, [data]);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const margin = { top: 16, right: 16, bottom: 36, left: 48 };
    const width = size.w;
    const height = size.h;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const xExtent = d3.extent(data, (d) => d.x) as [number, number];
    const yExtent = d3.extent(data, (d) => d.y) as [number, number];
    const padX = (xExtent[1] - xExtent[0]) * 0.08 || 1;
    const padY = (yExtent[1] - yExtent[0]) * 0.08 || 1;

    const x = d3.scaleLinear().domain([xExtent[0] - padX, xExtent[1] + padX]).range([0, innerW]);
    const y = d3.scaleLinear().domain([yExtent[0] - padY, yExtent[1] + padY]).range([innerH, 0]);

    svg.append('defs').append('clipPath').attr('id', 'tsne-clip')
      .append('rect').attr('width', innerW).attr('height', innerH);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xAxisG = g.append('g').attr('transform', `translate(0,${innerH})`);
    const yAxisG = g.append('g');

    g.append('text')
      .attr('x', innerW / 2).attr('y', innerH + 30)
      .attr('text-anchor', 'middle').attr('fill', '#374151').style('font-size', '11px')
      .text('t-SNE Dimension 1');
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2).attr('y', -34)
      .attr('text-anchor', 'middle').attr('fill', '#374151').style('font-size', '11px')
      .text('t-SNE Dimension 2');

    const plot = g.append('g').attr('clip-path', 'url(#tsne-clip)');
    const pointsG = plot.append('g');

    const drawPoints = (xs: d3.ScaleLinear<number, number>, ys: d3.ScaleLinear<number, number>) => {
      const sel = pointsG.selectAll<SVGCircleElement, Row>('circle.point').data(data, (d) => d.ticker);

      sel.join(
        (enter) =>
          enter.append('circle')
            .attr('class', 'point')
            .attr('r', (d) => (d.ticker === selected ? 10 : 6))
            .attr('cx', (d) => xs(d.x))
            .attr('cy', (d) => ys(d.y))
            .attr('fill', (d) => colorScale(d.sector) as string)
            .attr('stroke', (d) => (d.ticker === selected ? '#0f172a' : 'white'))
            .attr('stroke-width', (d) => (d.ticker === selected ? 2 : 1))
            .style('cursor', 'pointer')
            .on('click', (_e, d) => onSelect(d.ticker)),
        (update) =>
          update
            .attr('cx', (d) => xs(d.x))
            .attr('cy', (d) => ys(d.y))
            .attr('r', (d) => (d.ticker === selected ? 10 : 6))
            .attr('stroke', (d) => (d.ticker === selected ? '#0f172a' : 'white'))
            .attr('stroke-width', (d) => (d.ticker === selected ? 2 : 1))
      );

      const onlySelected = data.filter((d) => d.ticker === selected);
      const labels = pointsG.selectAll<SVGTextElement, Row>('text.label').data(onlySelected, (d) => d.ticker);
      labels.join(
        (enter) =>
          enter.append('text')
            .attr('class', 'label')
            .attr('x', (d) => xs(d.x) + 12)
            .attr('y', (d) => ys(d.y) + 4)
            .attr('fill', '#0f172a')
            .style('font-size', '13px')
            .style('font-weight', 700)
            .style('paint-order', 'stroke')
            .style('stroke', 'white')
            .style('stroke-width', '3px')
            .style('pointer-events', 'none')
            .text((d) => d.ticker),
        (update) =>
          update
            .attr('x', (d) => xs(d.x) + 12)
            .attr('y', (d) => ys(d.y) + 4)
            .text((d) => d.ticker)
      );
    };

    const renderAxes = (xs: d3.ScaleLinear<number, number>, ys: d3.ScaleLinear<number, number>) => {
      const xa = xAxisG.call(d3.axisBottom(xs).ticks(6));
      xa.selectAll('text').attr('fill', '#374151').style('font-size', '11px');
      xa.selectAll('path,line').attr('stroke', '#9ca3af');
      const ya = yAxisG.call(d3.axisLeft(ys).ticks(6));
      ya.selectAll('text').attr('fill', '#374151').style('font-size', '11px');
      ya.selectAll('path,line').attr('stroke', '#9ca3af');
    };

    renderAxes(x, y);
    drawPoints(x, y);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 20])
      .on('zoom', (event) => {
        const t = event.transform;
        const xs = t.rescaleX(x);
        const ys = t.rescaleY(y);
        renderAxes(xs, ys);
        drawPoints(xs, ys);
      });

    g.append('rect')
      .attr('width', innerW).attr('height', innerH)
      .attr('fill', 'transparent')
      .style('pointer-events', 'all')
      .lower();

    svg.call(zoom);
  }, [data, size, selected, onSelect]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-sm font-semibold text-slate-700 mb-2">t-SNE Projection</div>

      <div ref={wrapperRef} className="flex-1 min-h-[220px] border border-slate-200 rounded bg-white">
        {!data ? (
          <div className="p-4 text-sm text-slate-500">Loading…</div>
        ) : (
          <svg ref={svgRef} className="block" />
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
        {sectorsPresent.map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: colorScale(s) as string }} />
            <span>{SECTOR_LABEL[s] ?? s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}