import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { loadTsneRows } from '../data/loaders';
import type { TsneRow } from '../types';
import { stockOptions } from './options';

type TSNEScatterProps = {
  selectedTicker: string;
};

const palette = [
  '#2f6f73',
  '#b7512f',
  '#6b5ca5',
  '#d2931d',
  '#28547a',
  '#7d8f42',
  '#9f4d74',
  '#4f6f9f',
];

function TSNEScatter({ selectedTicker }: TSNEScatterProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [rows, setRows] = useState<TsneRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sectors = Array.from(new Set(rows.map((row) => row.sector))).sort();
  const colorScale = makeSectorColorScale(sectors);
  const selectedStock = stockOptions.find((stock) => stock.ticker === selectedTicker);
  const chartWidth = 860;
  const chartHeight = 390;

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    loadTsneRows()
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
  }, []);

  useEffect(() => {
    if (!svgRef.current || rows.length === 0) {
      return;
    }

    const margin = { top: 28, right: 32, bottom: 64, left: 70 };
    const width = chartWidth;
    const height = chartHeight;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const x = d3
      .scaleLinear()
      .domain(d3.extent(rows, (row) => row.x) as [number, number])
      .nice()
      .range([0, innerWidth]);
    const y = d3
      .scaleLinear()
      .domain(d3.extent(rows, (row) => row.y) as [number, number])
      .nice()
      .range([innerHeight, 0]);
    const originalX = x.copy();
    const originalY = y.copy();
    const svg = d3.select(svgRef.current);
    const sectorsInChart = Array.from(new Set(rows.map((row) => row.sector))).sort();
    const chartColorScale = makeSectorColorScale(sectorsInChart);

    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('role', 'img');

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

    drawAxes(x, y);

    const plot = root.append('g');
    const circles = plot
      .selectAll('circle')
      .data(rows, (row) => (row as TsneRow).ticker)
      .join('circle')
      .attr('cx', (row) => x(row.x))
      .attr('cy', (row) => y(row.y))
      .attr('r', (row) => (row.ticker === selectedTicker ? 9 : 5.6))
      .attr('fill', (row) => chartColorScale(row.sector))
      .attr('stroke', (row) => (row.ticker === selectedTicker ? '#18212f' : '#fffdf7'))
      .attr('stroke-width', (row) => (row.ticker === selectedTicker ? 2.8 : 1.4))
      .attr('opacity', (row) => (row.ticker === selectedTicker ? 1 : 0.78));

    const selectedRows = rows.filter((row) => row.ticker === selectedTicker);
    const labels = plot
      .selectAll('text.selected-stock-label')
      .data(selectedRows)
      .join('text')
      .attr('class', 'selected-stock-label')
      .attr('x', (row) => x(row.x) + 12)
      .attr('y', (row) => y(row.y) - 12)
      .attr('fill', '#18212f')
      .attr('font-size', 13)
      .attr('font-weight', 800)
      .attr('font-family', 'Trebuchet MS, Verdana, sans-serif')
      .text((row) => `${row.ticker}${selectedStock ? ` - ${selectedStock.name}` : ''}`);

    root
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 50)
      .attr('text-anchor', 'middle')
      .attr('fill', '#647083')
      .text('t-SNE 1');

    root
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -52)
      .attr('text-anchor', 'middle')
      .attr('fill', '#647083')
      .text('t-SNE 2');

    const overlay = root
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'move');

    const zoom = d3
      .zoom<SVGRectElement, unknown>()
      .scaleExtent([1, 14])
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .translateExtent([
        [-120, -120],
        [innerWidth + 120, innerHeight + 120],
      ])
      .on('zoom', (event) => {
        const nextX = event.transform.rescaleX(originalX);
        const nextY = event.transform.rescaleY(originalY);
        drawAxes(nextX, nextY);
        circles.attr('cx', (row) => nextX(row.x)).attr('cy', (row) => nextY(row.y));
        labels.attr('x', (row) => nextX(row.x) + 12).attr('y', (row) => nextY(row.y) - 12);
      });

    overlay.call(zoom);

    function drawAxes(xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) {
      xAxisGroup
        .call(d3.axisBottom(xScale).ticks(7).tickSizeOuter(0))
        .call((group) => group.select('.domain').attr('stroke', '#8c7b68'));
      yAxisGroup
        .call(d3.axisLeft(yScale).ticks(6).tickSizeOuter(0))
        .call((group) => group.select('.domain').attr('stroke', '#8c7b68'));
    }
  }, [chartHeight, chartWidth, rows, selectedStock, selectedTicker]);

  return (
    <>
      <div className="panel-header">
        <div>
          <p className="panel-kicker">View 2</p>
          <h2 className="panel-title">t-SNE Stock Map</h2>
          <p className="panel-note">
            Points are colored by sector. The selected stock is enlarged and labeled.
          </p>
        </div>
        <div className="legend" aria-label="Sector legend">
          {sectors.map((sector) => (
            <span className="legend-item" key={sector}>
              <span className="legend-swatch" style={{ backgroundColor: colorScale(sector) }} />
              {sector}
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state">Loading t-SNE coordinates...</div>
      ) : rows.length === 0 ? (
        <div className="empty-state">No t-SNE rows found.</div>
      ) : (
        <div className="chart-scroll">
          <div className="chart-frame">
            <svg ref={svgRef} className="chart-svg" width={chartWidth} height={chartHeight} />
          </div>
        </div>
      )}
    </>
  );
}

function makeSectorColorScale(sectors: string[]) {
  return d3.scaleOrdinal<string, string>().domain(sectors).range(palette);
}

export default TSNEScatter;
