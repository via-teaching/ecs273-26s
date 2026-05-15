import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { StockRow, Margin, ComponentSize } from '../types';

const METRICS = ['Open', 'High', 'Low', 'Close'] as const;
const COLORS: Record<string, string> = {
  Open: '#2196F3',
  High: '#4CAF50',
  Low: '#F44336',
  Close: '#FF9800',
};
const margin: Margin = { left: 60, right: 90, top: 30, bottom: 50 };

interface ParsedRow {
  date: Date;
  Open: number;
  High: number;
  Low: number;
  Close: number;
}

export function LineChart({ selectedStock }: { selectedStock: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<ParsedRow[]>([]);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });

  useEffect(() => {
    d3.csv(`/data/stockdata/${selectedStock}.csv`).then((rows) => {
      const parsed: ParsedRow[] = (rows as unknown as StockRow[]).map((d) => ({
        date: new Date(d.Date),
        Open: +d.Open,
        High: +d.High,
        Low: +d.Low,
        Close: +d.Close,
      }));
      setData(parsed);
    });
  }, [selectedStock]);

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
    if (!svgRef.current || data.length === 0 || size.width === 0) return;
    drawChart(svgRef.current, data, size.width, size.height);
  }, [data, size]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function drawChart(
  svgEl: SVGSVGElement,
  data: ParsedRow[],
  width: number,
  height: number
) {
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const xExtent = d3.extent(data, (d) => d.date) as [Date, Date];
  const allValues = data.flatMap((d) => [d.Open, d.High, d.Low, d.Close]);
  const yExtent = d3.extent(allValues) as [number, number];

  const xScale = d3.scaleTime().domain(xExtent).range([0, innerW]);
  const yScale = d3.scaleLinear()
    .domain([yExtent[0] * 0.98, yExtent[1] * 1.02])
    .range([innerH, 0]);

  // clip path so lines don't overflow on zoom
  svg.append('defs').append('clipPath').attr('id', 'lc-clip')
    .append('rect').attr('width', innerW).attr('height', innerH);

  const root = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // axes
  const xAxisG = root.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(xScale).ticks(6));
  const yAxisG = root.append('g').call(d3.axisLeft(yScale).ticks(6));

  // axis labels
  root.append('text')
    .attr('x', innerW / 2).attr('y', innerH + 42)
    .attr('text-anchor', 'middle').style('font-size', '0.75rem').text('Date');
  root.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerH / 2).attr('y', -48)
    .attr('text-anchor', 'middle').style('font-size', '0.75rem').text('Price (USD)');

  // lines group
  const linesG = root.append('g').attr('clip-path', 'url(#lc-clip)');

  const lineGen = (metric: keyof Omit<ParsedRow, 'date'>) =>
    d3.line<ParsedRow>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d[metric]));

  METRICS.forEach((m) => {
    linesG.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', COLORS[m])
      .attr('stroke-width', 1.5)
      .attr('class', `line-${m}`)
      .attr('d', lineGen(m));
  });

  // legend — placed to the right of the chart, outside the plot area
  const legendG = root.append('g').attr('transform', `translate(${innerW + 10}, ${innerH / 2 - 38})`);
  METRICS.forEach((m, i) => {
    legendG.append('rect')
      .attr('x', 0).attr('y', i * 20)
      .attr('width', 12).attr('height', 12)
      .attr('fill', COLORS[m]);
    legendG.append('text')
      .attr('x', 17).attr('y', i * 20 + 10)
      .style('font-size', '0.72rem').text(m);
  });

  // zoom (x-only)
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 20])
    .translateExtent([[0, 0], [innerW, innerH]])
    .extent([[0, 0], [innerW, innerH]])
    .on('zoom', (event) => {
      const xNew = event.transform.rescaleX(xScale);
      xAxisG.call(d3.axisBottom(xNew).ticks(6));
      METRICS.forEach((m) => {
        const newLine = d3.line<ParsedRow>()
          .x((d) => xNew(d.date))
          .y((d) => yScale(d[m]));
        linesG.select(`.line-${m}`).attr('d', newLine);
      });
    });

  // attach zoom to the svg but only allow x-direction panning
  d3.select(svgEl).call(
    zoom.filter((event) => !event.ctrlKey && !event.button)
  );

  // allow zoom only via scroll/pinch; for horizontal scroll use shift+wheel
  d3.select(svgEl).on('wheel.zoom', function(event: WheelEvent) {
    event.preventDefault();
    const currentTransform = d3.zoomTransform(svgEl);
    if (event.shiftKey) {
      // horizontal scroll
      const newT = currentTransform.translate(-event.deltaY, 0);
      d3.select(svgEl).call(zoom.transform, newT);
    } else {
      // zoom
      const delta = -event.deltaY * 0.002;
      const newK = Math.max(1, Math.min(20, currentTransform.k * Math.exp(delta)));
      const mouseX = event.offsetX - margin.left;
      const newT = d3.zoomIdentity
        .translate(currentTransform.x + (mouseX - currentTransform.x) * (1 - newK / currentTransform.k), 0)
        .scale(newK);
      d3.select(svgEl).call(zoom.transform, newT);
    }
  }, { passive: false } as AddEventListenerOptions);

  // reset on double click
  d3.select(svgEl).on('dblclick.zoom', () => {
    d3.select(svgEl).call(zoom.transform, d3.zoomIdentity);
  });

  // suppress default double-click zoom
  yAxisG; // reference to avoid lint warning
}
