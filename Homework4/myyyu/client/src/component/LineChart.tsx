import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { loadStockPrices } from '../data/loaders';
import type { StockPriceRow } from '../types';

type PriceField = 'open' | 'high' | 'low' | 'close';

type LineChartProps = {
  selectedTicker: string;
  selectedName: string;
};

const series: Array<{ key: PriceField; label: string; color: string }> = [
  { key: 'open', label: 'Open', color: '#2f6f73' },
  { key: 'high', label: 'High', color: '#b7512f' },
  { key: 'low', label: 'Low', color: '#6b5ca5' },
  { key: 'close', label: 'Close', color: '#d2931d' },
];

function LineChart({ selectedTicker, selectedName }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [rows, setRows] = useState<StockPriceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const chartWidth = Math.max(1000, rows.length * 7);
  const chartHeight = 390;

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    loadStockPrices(selectedTicker)
      .then((nextRows) => {
        if (active) {
          setRows(nextRows);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedTicker]);

  useEffect(() => {
    if (!svgRef.current || rows.length === 0) {
      return;
    }

    const margin = { top: 28, right: 34, bottom: 64, left: 70 };
    const width = chartWidth;
    const height = chartHeight;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const dateExtent = d3.extent(rows, (row) => row.date) as [Date, Date];
    const valueExtent = [
      d3.min(rows, (row) => row.low) ?? 0,
      d3.max(rows, (row) => row.high) ?? 1,
    ] as [number, number];
    const x = d3.scaleTime().domain(dateExtent).range([0, innerWidth]);
    const originalX = x.copy();
    const y = d3.scaleLinear().domain(valueExtent).nice().range([innerHeight, 0]);
    const svg = d3.select(svgRef.current);
    const clipId = `line-chart-clip-${selectedTicker}`;

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('role', 'img');

    svg
      .append('defs')
      .append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight);

    const root = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const xAxisGroup = root.append('g').attr('transform', `translate(0,${innerHeight})`);
    const yAxisGroup = root.append('g');

    root
      .append('g')
      .attr('class', 'grid-lines')
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat(() => ''))
      .call((group) => {
        group.selectAll('line').attr('stroke', '#d9ccb8').attr('stroke-dasharray', '4 5');
        group.select('.domain').remove();
      });

    yAxisGroup.call(d3.axisLeft(y).ticks(6)).call((group) => group.select('.domain').attr('stroke', '#8c7b68'));
    drawXAxis(x);

    const plot = root.append('g').attr('clip-path', `url(#${clipId})`);
    const pathGroup = plot.append('g');

    const paths = pathGroup
      .selectAll('path')
      .data(series)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', (item) => item.color)
      .attr('stroke-width', 2.6)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', (item) => lineFor(item.key, x, y)(rows));

    root
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 50)
      .attr('text-anchor', 'middle')
      .attr('fill', '#647083')
      .text('Date');

    root
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -52)
      .attr('text-anchor', 'middle')
      .attr('fill', '#647083')
      .text('Price (USD)');

    const overlay = root
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'grab');

    const zoom = d3
      .zoom<SVGRectElement, unknown>()
      .scaleExtent([1, 18])
      .translateExtent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on('zoom', (event) => {
        const nextX = event.transform.rescaleX(originalX);
        drawXAxis(nextX);
        paths.attr('d', (item) => lineFor(item.key, nextX, y)(rows));
      });

    overlay.call(zoom);

    function drawXAxis(scale: d3.ScaleTime<number, number>) {
      xAxisGroup
        .call(d3.axisBottom(scale).ticks(Math.min(8, rows.length)).tickSizeOuter(0))
        .call((group) => group.select('.domain').attr('stroke', '#8c7b68'));
    }
  }, [chartHeight, chartWidth, rows, selectedTicker]);

  return (
    <>
      <div className="panel-header">
        <div>
          <p className="panel-kicker">View 1</p>
          <h2 className="panel-title">
            {selectedTicker} Price Overview
          </h2>
          <p className="panel-note">
            {selectedName}: open, high, low, and close values. Drag or scroll inside the plot to zoom horizontally.
          </p>
        </div>
        <div className="legend" aria-label="Line legend">
          {series.map((item) => (
            <span className="legend-item" key={item.key}>
              <span className="legend-swatch" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state">Loading price data for {selectedTicker}...</div>
      ) : rows.length === 0 ? (
        <div className="empty-state">No price rows found for {selectedTicker}.</div>
      ) : (
        <div className="chart-scroll" aria-label="Horizontally scrollable stock line chart">
          <div className="chart-frame" style={{ width: `${chartWidth}px` }}>
            <svg ref={svgRef} className="chart-svg" width={chartWidth} height={chartHeight} />
          </div>
        </div>
      )}
    </>
  );
}

function lineFor(field: PriceField, x: d3.ScaleTime<number, number>, y: d3.ScaleLinear<number, number>) {
  return d3
    .line<StockPriceRow>()
    .x((row) => x(row.date))
    .y((row) => y(row[field]))
    .curve(d3.curveMonotoneX);
}

export default LineChart;
