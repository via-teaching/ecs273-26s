import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import tsneCsv from '../../data/tsne.csv?raw';

const margin = { left: 55, right: 160, top: 30, bottom: 50 };

const SECTOR_COLORS = d3.scaleOrdinal()
  .domain(['Technology','Financials','Industrials','Energy','Healthcare','Consumer Staples','Consumer Discretionary'])
  .range(['#4e79a7','#f28e2b','#76b7b2','#e15759','#59a14f','#edc948','#b07aa1']);

export function TSNEScatter({ selectedStock, onStockSelect }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const rows = d3.csvParse(tsneCsv);
    const data = rows.map(d => ({
      ticker: d[''],
      x: +d.x,
      y: +d.y,
      sector: d.sector,
    }));

    const obs = new ResizeObserver(debounce((entries) => {
      for (const entry of entries) {
        if (entry.target !== containerRef.current) continue;
        const { width, height } = entry.contentRect;
        if (width && height) draw(svgRef.current, data, width, height, selectedStock, onStockSelect);
      }
    }, 100));
    obs.observe(containerRef.current);

    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height) draw(svgRef.current, data, width, height, selectedStock, onStockSelect);

    return () => obs.disconnect();
  }, [selectedStock, onStockSelect]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function draw(svgEl, data, width, height, selectedStock, onStockSelect) {
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  const W = width  - margin.left - margin.right;
  const H = height - margin.top  - margin.bottom;

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const xBase = d3.scaleLinear().domain(d3.extent(data, d => d.x)).nice().range([0, W]);
  const yBase = d3.scaleLinear().domain(d3.extent(data, d => d.y)).nice().range([H, 0]);

  const xAxisG = g.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${H})`).call(d3.axisBottom(xBase).ticks(5));
  const yAxisG = g.append('g').attr('class', 'y-axis').call(d3.axisLeft(yBase).ticks(5));

  g.append('text').attr('x', W / 2).attr('y', H + 42).attr('text-anchor', 'middle').style('font-size', '12px').text('t-SNE Dimension 1');
  g.append('text').attr('transform', 'rotate(-90)').attr('x', -H / 2).attr('y', -45).attr('text-anchor', 'middle').style('font-size', '12px').text('t-SNE Dimension 2');
  g.append('text').attr('x', W / 2).attr('y', -10).attr('text-anchor', 'middle').style('font-size', '13px').style('font-weight', 'bold').text('t-SNE Stock Embedding');

  svg.append('defs').append('clipPath').attr('id', 'scatter-clip')
    .append('rect').attr('width', W).attr('height', H);

  const dotsG = g.append('g').attr('clip-path', 'url(#scatter-clip)');

  function renderDots(xScale, yScale) {
    dotsG.selectAll('.dot').remove();
    dotsG.selectAll('.dot-label').remove();

    dotsG.selectAll('.dot')
      .data(data)
      .join('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', d => d.ticker === selectedStock ? 9 : 6)
      .attr('fill', d => SECTOR_COLORS(d.sector))
      .attr('stroke', d => d.ticker === selectedStock ? '#000' : '#fff')
      .attr('stroke-width', d => d.ticker === selectedStock ? 2 : 0.8)
      .attr('opacity', 0.85)
      .style('cursor', 'pointer')
      .on('click', (event, d) => onStockSelect && onStockSelect(d.ticker));

    if (selectedStock) {
      const sel = data.find(d => d.ticker === selectedStock);
      if (sel) {
        dotsG.append('text')
          .attr('class', 'dot-label')
          .attr('x', xScale(sel.x) + 11)
          .attr('y', yScale(sel.y) + 4)
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(sel.ticker);
      }
    }
  }

  renderDots(xBase, yBase);

  const sectors = [...new Set(data.map(d => d.sector))].sort();
  const legend = svg.append('g').attr('transform', `translate(${margin.left + W + 15}, ${margin.top})`);
  legend.append('text').attr('y', -5).style('font-size', '12px').style('font-weight', 'bold').text('Sector');
  sectors.forEach((s, i) => {
    const row = legend.append('g').attr('transform', `translate(0,${i * 20 + 8})`);
    row.append('circle').attr('r', 5).attr('cx', 5).attr('cy', 5).attr('fill', SECTOR_COLORS(s));
    row.append('text').attr('x', 14).attr('y', 9).style('font-size', '11px').text(s);
  });

  const zoom = d3.zoom()
    .scaleExtent([0.5, 20])
    .on('zoom', (event) => {
      const newX = event.transform.rescaleX(xBase);
      const newY = event.transform.rescaleY(yBase);
      xAxisG.call(d3.axisBottom(newX).ticks(5));
      yAxisG.call(d3.axisLeft(newY).ticks(5));
      renderDots(newX, newY);
    });

  g.append('rect')
    .attr('width', W).attr('height', H)
    .attr('fill', 'none').attr('pointer-events', 'all')
    .call(zoom);
}
