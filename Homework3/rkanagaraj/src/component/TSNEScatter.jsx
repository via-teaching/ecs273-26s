import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';

const SECTORS = ['Energy', 'Industrials', 'Consumer', 'Healthcare', 'Financials', 'Technology'];
const COLOR = d3.scaleOrdinal(d3.schemeTableau10).domain(SECTORS);
const MARGIN = { left: 55, right: 160, top: 30, bottom: 50 };

export default function TSNEScatter({ selectedStock, onSelectStock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [tsneData, setTsneData] = useState([]);
  // keep current zoom transform so stock-change re-renders preserve zoom
  const zoomRef = useRef(d3.zoomIdentity);

  useEffect(() => {
    d3.csv('/tsne.csv').then(raw => {
      setTsneData(raw.map(d => ({ ...d, x: +d.x, y: +d.y })));
    });
  }, []);

  // Full redraw when data loads (or resize)
  useEffect(() => {
    if (!containerRef.current || !svgRef.current || tsneData.length === 0) return;
    zoomRef.current = d3.zoomIdentity; // reset zoom on first load

    const obs = new ResizeObserver(
      debounce(entries => {
        for (const e of entries) {
          if (e.target !== containerRef.current) continue;
          const { width, height } = e.contentRect;
          if (width && height) {
            zoomRef.current = d3.zoomIdentity;
            draw(svgRef.current, tsneData, selectedStock, onSelectStock, zoomRef, width, height);
          }
        }
      }, 100)
    );
    obs.observe(containerRef.current);
    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height) draw(svgRef.current, tsneData, selectedStock, onSelectStock, zoomRef, width, height);
    return () => obs.disconnect();
  }, [tsneData]); // only on data load

  // Lightweight highlight update when stock changes — no full redraw
  useEffect(() => {
    if (!svgRef.current || tsneData.length === 0) return;
    const svg = d3.select(svgRef.current);

    svg.selectAll('.tsne-dot')
      .attr('r', d => d.ticker === selectedStock ? 10 : 6)
      .attr('stroke', d => d.ticker === selectedStock ? '#111' : 'white')
      .attr('stroke-width', d => d.ticker === selectedStock ? 2 : 0.8);

    // Update label — read current cx/cy from the selected circle directly
    svg.selectAll('.tsne-label').remove();
    const selCircle = svg.select(`.tsne-dot-${selectedStock}`);
    if (!selCircle.empty()) {
      const cx = +selCircle.attr('cx');
      const cy = +selCircle.attr('cy');
      // Place label inside same clipped group
      svg.select('.tsne-label-group')
        .append('text')
        .attr('class', 'tsne-label')
        .attr('x', cx)
        .attr('y', cy - 14)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('pointer-events', 'none')
        .text(selectedStock);
    }
  }, [selectedStock, tsneData]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function draw(svgEl, data, selectedStock, onSelectStock, zoomRef, width, height) {
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  const W = width - MARGIN.left - MARGIN.right;
  const H = height - MARGIN.top - MARGIN.bottom;
  if (W <= 0 || H <= 0) return;

  const xExt = d3.extent(data, d => d.x);
  const yExt = d3.extent(data, d => d.y);
  const xPad = (xExt[1] - xExt[0]) * 0.12;
  const yPad = (yExt[1] - yExt[0]) * 0.12;

  const xScale = d3.scaleLinear().domain([xExt[0] - xPad, xExt[1] + xPad]).range([0, W]);
  const yScale = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([H, 0]);

  svg.append('defs').append('clipPath').attr('id', 'tsne-clip')
    .append('rect').attr('width', W).attr('height', H);

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  const xAxisG = g.append('g').attr('transform', `translate(0,${H})`).call(d3.axisBottom(xScale).ticks(5));
  const yAxisG = g.append('g').call(d3.axisLeft(yScale).ticks(5));

  g.append('text').attr('x', W / 2).attr('y', H + 42)
    .style('text-anchor', 'middle').style('font-size', '11px').text('t-SNE 1');
  g.append('text').attr('transform', 'rotate(-90)').attr('x', -H / 2).attr('y', -45)
    .style('text-anchor', 'middle').style('font-size', '11px').text('t-SNE 2');

  svg.append('text').attr('x', MARGIN.left + W / 2).attr('y', 18)
    .style('text-anchor', 'middle').style('font-size', '13px').style('font-weight', 'bold')
    .text('t-SNE Projection of Stock Patterns');

  const clipG = g.append('g').attr('clip-path', 'url(#tsne-clip)');

  // Dots — use scaled pixel positions
  clipG.selectAll('.tsne-dot').data(data).join('circle')
    .attr('class', d => `tsne-dot tsne-dot-${d.ticker}`)
    .attr('cx', d => xScale(d.x))
    .attr('cy', d => yScale(d.y))
    .attr('r', d => d.ticker === selectedStock ? 10 : 6)
    .attr('fill', d => COLOR(d.sector))
    .attr('stroke', d => d.ticker === selectedStock ? '#111' : 'white')
    .attr('stroke-width', d => d.ticker === selectedStock ? 2 : 0.8)
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      event.stopPropagation();
      if (onSelectStock) onSelectStock(d.ticker);
    });

  // Label group for selected stock ticker
  const labelGroup = clipG.append('g').attr('class', 'tsne-label-group');
  const sel = data.find(d => d.ticker === selectedStock);
  if (sel) {
    labelGroup.append('text').attr('class', 'tsne-label')
      .attr('x', xScale(sel.x)).attr('y', yScale(sel.y) - 14)
      .style('text-anchor', 'middle').style('font-size', '12px').style('font-weight', 'bold')
      .style('pointer-events', 'none').text(sel.ticker);
  }

  // Sector legend
  const legG = g.append('g').attr('transform', `translate(${W + 12}, 0)`);
  legG.append('text').attr('x', 0).attr('y', -4).style('font-size', '11px').style('font-weight', 'bold').text('Sector');
  SECTORS.forEach((s, i) => {
    legG.append('circle').attr('cx', 7).attr('cy', i * 22 + 10).attr('r', 7).attr('fill', COLOR(s));
    legG.append('text').attr('x', 18).attr('y', i * 22 + 14).style('font-size', '11px').text(s);
  });

  // Zoom — rescales axes and repositions circles & label
  const zoom = d3.zoom().scaleExtent([0.3, 20]).on('zoom', event => {
    zoomRef.current = event.transform;
    const newX = event.transform.rescaleX(xScale);
    const newY = event.transform.rescaleY(yScale);

    xAxisG.call(d3.axisBottom(newX).ticks(5));
    yAxisG.call(d3.axisLeft(newY).ticks(5));

    clipG.selectAll('.tsne-dot')
      .attr('cx', d => newX(d.x))
      .attr('cy', d => newY(d.y));

    clipG.selectAll('.tsne-label')
      .each(function() {
        // re-read which stock this label belongs to from its text
        const ticker = d3.select(this).text();
        const pt = data.find(d => d.ticker === ticker);
        if (pt) {
          d3.select(this).attr('x', newX(pt.x)).attr('y', newY(pt.y) - 14);
        }
      });
  });

  svg.call(zoom);
}
