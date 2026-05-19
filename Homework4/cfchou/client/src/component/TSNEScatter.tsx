import * as d3 from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { loadTSNE, type TSNEPoint } from '../dataLoader';
import { palette, sectorColors } from '../theme';
import type { ComponentSize, Margin } from '../types';

interface Props {
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

const margin: Margin = { left: 40, right: 100, top: 16, bottom: 36 };
const TRANSITION_MS = 500;

export function TSNEScatter({ selectedSymbol, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [points, setPoints] = useState<TSNEPoint[]>([]);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState<ComponentSize | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTSNE().then((p) => {
      if (cancelled) return;
      setPoints(p);
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

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

  const sectors = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of points) {
      if (!seen.has(p.sector)) {
        seen.add(p.sector);
        out.push(p.sector);
      }
    }
    return out;
  }, [points]);

  useEffect(() => {
    if (!svgRef.current || !size || points.length === 0) return;
    const svg = d3.select(svgRef.current);
    const { width, height } = size;
    const left = margin.left, right = width - margin.right;
    const top = margin.top, bottom = height - margin.bottom;
    const innerW = right - left, innerH = bottom - top;
    if (innerW < 40 || innerH < 40) return;

    let root = svg.select<SVGGElement>('g.ts-root');
    if (root.empty()) {
      root = svg.append('g').attr('class', 'ts-root') as d3.Selection<SVGGElement, unknown, null, undefined>;
      root.append('defs').append('clipPath').attr('id', 'ts-clip').append('rect');
      root.append('g').attr('class', 'ts-grid');
      root.append('g').attr('class', 'ts-x-axis');
      root.append('g').attr('class', 'ts-y-axis');
      root.append('text').attr('class', 'ts-x-label')
        .attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', palette.textMuted);
      root.append('text').attr('class', 'ts-y-label')
        .attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', palette.textMuted);
      root.append('g').attr('class', 'ts-points').attr('clip-path', 'url(#ts-clip)');
      root.append('rect').attr('class', 'ts-zoom-catcher')
        .attr('fill', 'transparent').lower();
    }

    root.select('#ts-clip rect')
      .attr('x', left).attr('y', top).attr('width', innerW).attr('height', innerH);

    const xExt = d3.extent(points, (d) => d.x) as [number, number];
    const yExt = d3.extent(points, (d) => d.y) as [number, number];
    const xPad = (xExt[1] - xExt[0]) * 0.08 || 1;
    const yPad = (yExt[1] - yExt[0]) * 0.08 || 1;
    const xBase = d3.scaleLinear().domain([xExt[0] - xPad, xExt[1] + xPad]).range([left, right]);
    const yBase = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([bottom, top]);

    const zoomCatcher = root.select<SVGRectElement>('rect.ts-zoom-catcher')
      .attr('x', left).attr('y', top).attr('width', innerW).attr('height', innerH);

    const zoom = d3.zoom<SVGRectElement, unknown>()
      .scaleExtent([0.6, 12])
      .extent([[left, top], [right, bottom]])
      .on('zoom', (event) => render(event.transform));

    zoomCatcher.call(zoom as never);
    zoomCatcher.on('dblclick.reset', () => {
      zoomCatcher.transition().duration(300).call(zoom.transform as never, d3.zoomIdentity);
    });

    function render(transform: d3.ZoomTransform) {
      const x = transform.rescaleX(xBase);
      const y = transform.rescaleY(yBase);

      const xAxis = d3.axisBottom(x).ticks(Math.max(4, Math.floor(innerW / 80))).tickSizeOuter(0);
      root.select<SVGGElement>('g.ts-x-axis')
        .attr('transform', `translate(0,${bottom})`)
        .call(xAxis as never)
        .call((g) => g.selectAll('text').attr('fill', palette.textMuted))
        .call((g) => g.selectAll('line, path').attr('stroke', palette.axis));
      const yAxis = d3.axisLeft(y).ticks(Math.max(4, Math.floor(innerH / 40))).tickSizeOuter(0);
      root.select<SVGGElement>('g.ts-y-axis')
        .attr('transform', `translate(${left},0)`)
        .call(yAxis as never)
        .call((g) => g.selectAll('text').attr('fill', palette.textMuted))
        .call((g) => g.selectAll('line, path').attr('stroke', palette.axis));

      root.select('text.ts-x-label')
        .attr('transform', `translate(${(left + right) / 2}, ${bottom + 28})`)
        .text('t-SNE 1');
      root.select('text.ts-y-label')
        .attr('transform', `translate(${left - 28}, ${(top + bottom) / 2}) rotate(-90)`)
        .text('t-SNE 2');

      const gridX = x.ticks(Math.max(4, Math.floor(innerW / 80)));
      const gridSel = root.select('g.ts-grid')
        .selectAll<SVGLineElement, number>('line.gridline').data(gridX, (d) => `x${d}`);
      gridSel.exit().remove();
      gridSel.enter().append('line').attr('class', 'gridline')
        .attr('stroke', palette.grid).attr('stroke-dasharray', '2 3').attr('y1', top).attr('y2', bottom)
        .merge(gridSel)
        .attr('x1', (d) => x(d)).attr('x2', (d) => x(d));

      const ptSel = root.select('g.ts-points')
        .selectAll<SVGGElement, TSNEPoint>('g.ts-pt')
        .data(points, (d) => d.symbol);

      const ptEnter = ptSel.enter().append('g').attr('class', 'ts-pt')
        .style('cursor', 'pointer')
        .on('click', (_e, d) => onSelect(d.symbol));
      ptEnter.append('circle')
        .attr('stroke', palette.bgPanel)
        .attr('stroke-width', 1.2);
      ptEnter.append('text')
        .attr('font-size', 10)
        .attr('text-anchor', 'middle')
        .attr('dy', -8)
        .attr('paint-order', 'stroke')
        .attr('stroke', palette.bgPanel)
        .attr('stroke-width', 3);

      const merged = ptEnter.merge(ptSel);
      merged.attr('transform', (d) => `translate(${x(d.x)},${y(d.y)})`);
      merged.select('circle')
        .attr('fill', (d) => sectorColors[d.sector] ?? palette.textMuted)
        .attr('r', (d) => d.symbol === selectedSymbol ? 8 : 5)
        .attr('stroke-width', (d) => d.symbol === selectedSymbol ? 2 : 1.2)
        .attr('stroke', (d) => d.symbol === selectedSymbol ? palette.text : palette.bgPanel);
      merged.select('text')
        .attr('fill', palette.text)
        .attr('font-weight', (d) => d.symbol === selectedSymbol ? 700 : 500)
        .attr('opacity', (d) => d.symbol === selectedSymbol ? 1 : 0.7)
        .text((d) => d.symbol);
    }

    render(d3.zoomTransform(zoomCatcher.node()!));
  }, [points, size, selectedSymbol, onSelect]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll<SVGCircleElement, TSNEPoint>('g.ts-pt circle')
      .transition().duration(TRANSITION_MS)
      .attr('r', (d) => d.symbol === selectedSymbol ? 8 : 5)
      .attr('stroke-width', (d) => d.symbol === selectedSymbol ? 2 : 1.2)
      .attr('stroke', (d) => d.symbol === selectedSymbol ? palette.text : palette.bgPanel);
    svg.selectAll<SVGTextElement, TSNEPoint>('g.ts-pt text')
      .transition().duration(TRANSITION_MS)
      .attr('font-weight', (d) => d.symbol === selectedSymbol ? 700 : 500)
      .attr('opacity', (d) => d.symbol === selectedSymbol ? 1 : 0.7);
  }, [selectedSymbol]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />

      {!ready && <Centered text="Loading t-SNE points…" />}
      {ready && points.length === 0 && <Centered text="data/tsne.csv is empty or missing" />}

      <div
        style={{
          position: 'absolute', right: 6, top: 6,
          display: 'flex', flexDirection: 'column', gap: 3,
          background: `${palette.bgPanel}E6`,
          border: `1px solid ${palette.border}`,
          borderRadius: 6,
          padding: '5px 7px',
          fontSize: 10.5,
          color: palette.text,
          pointerEvents: 'none',
          zIndex: 3,
        }}
      >
        <div style={{ color: palette.textMuted, fontSize: 10, marginBottom: 1 }}>Sector</div>
        {sectors.map((sec) => (
          <div key={sec} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              display: 'inline-block', width: 9, height: 9,
              background: sectorColors[sec] ?? palette.textMuted,
              borderRadius: 999,
            }} />
            <span>{sec}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Centered({ text }: { text: string }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        position: 'absolute', inset: 0,
        color: palette.textMuted, fontSize: 12, padding: 12, textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      {text}
    </div>
  );
}
