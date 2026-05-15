import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { TSNEAPIPoint, Margin, ComponentSize } from '../types';

const margin: Margin = { left: 55, right: 160, top: 20, bottom: 50 };
const SECTOR_COLORS = d3.scaleOrdinal(d3.schemeTableau10);

export function TSNEScatter({ selectedStock }: { selectedStock: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dataRef = useRef<TSNEAPIPoint[]>([]);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/tsne/all')
      .then((r) => r.json())
      .then((data: TSNEAPIPoint[]) => {
        dataRef.current = data;
        setDataLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(
      debounce((entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect as ComponentSize;
          if (width && height) setSize({ width, height });
        }
      }, 100)
    );
    observer.observe(containerRef.current);
    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height) setSize({ width, height });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !dataLoaded || size.width === 0) return;
    drawScatter(svgRef.current, dataRef.current, selectedStock, size.width, size.height);
  }, [dataLoaded, size, selectedStock]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function drawScatter(
  svgEl: SVGSVGElement, data: TSNEAPIPoint[], selected: string,
  width: number, height: number
) {
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);

  const xScale = d3.scaleLinear()
    .domain([d3.min(xs)! - 5, d3.max(xs)! + 5]).range([0, innerW]);
  const yScale = d3.scaleLinear()
    .domain([d3.min(ys)! - 5, d3.max(ys)! + 5]).range([innerH, 0]);

  svg.append('defs').append('clipPath').attr('id', 'tsne-clip')
    .append('rect').attr('width', innerW).attr('height', innerH);

  const root = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const xAxisG = root.append('g').attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(xScale).ticks(5));
  const yAxisG = root.append('g').call(d3.axisLeft(yScale).ticks(5));

  root.append('text').attr('x', innerW / 2).attr('y', innerH + 42)
    .attr('text-anchor', 'middle').style('font-size', '0.75rem').text('t-SNE Dimension 1');
  root.append('text').attr('transform', 'rotate(-90)')
    .attr('x', -innerH / 2).attr('y', -45)
    .attr('text-anchor', 'middle').style('font-size', '0.75rem').text('t-SNE Dimension 2');

  const pointsG = root.append('g').attr('clip-path', 'url(#tsne-clip)');

  const sorted = [...data].sort((a) => (a.Stock === selected ? 1 : -1));

  pointsG.selectAll('circle').data(sorted).join('circle')
    .attr('cx', (d) => xScale(d.x)).attr('cy', (d) => yScale(d.y))
    .attr('r', (d) => (d.Stock === selected ? 10 : 5))
    .attr('fill', (d) => SECTOR_COLORS(d.sector))
    .attr('stroke', (d) => (d.Stock === selected ? '#000' : 'none'))
    .attr('stroke-width', 2).attr('opacity', 0.85);

  const sel = data.find((d) => d.Stock === selected);
  if (sel) {
    pointsG.append('text')
      .attr('x', xScale(sel.x)).attr('y', yScale(sel.y) - 14)
      .attr('text-anchor', 'middle').style('font-size', '0.75rem')
      .style('font-weight', 'bold').text(sel.Stock);
  }

  const sectors = [...new Set(data.map((d) => d.sector))].sort();
  const legendG = root.append('g').attr('transform', `translate(${innerW + 10}, 0)`);
  legendG.append('text').attr('x', 0).attr('y', -5)
    .style('font-size', '0.7rem').style('font-weight', 'bold').text('Sector');
  sectors.forEach((s, i) => {
    legendG.append('circle').attr('cx', 6).attr('cy', i * 20 + 10)
      .attr('r', 5).attr('fill', SECTOR_COLORS(s));
    legendG.append('text').attr('x', 16).attr('y', i * 20 + 14)
      .style('font-size', '0.68rem').text(s);
  });

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 20])
    .on('zoom', (event) => {
      const t = event.transform;
      pointsG.attr('transform', t.toString());
      xAxisG.call(d3.axisBottom(t.rescaleX(xScale)).ticks(5));
      yAxisG.call(d3.axisLeft(t.rescaleY(yScale)).ticks(5));
    });

  d3.select(svgEl).call(zoom);
  d3.select(svgEl).on('dblclick.zoom', () =>
    d3.select(svgEl).call(zoom.transform, d3.zoomIdentity));
}
