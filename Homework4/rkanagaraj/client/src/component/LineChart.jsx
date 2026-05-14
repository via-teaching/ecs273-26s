import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';

const COLORS = { Open: '#2196F3', High: '#4CAF50', Low: '#F44336', Close: '#FF9800' };
const KEYS = ['Open', 'High', 'Low', 'Close'];
const MARGIN = { left: 65, right: 20, top: 30, bottom: 55 };

export default function LineChart({ selectedStock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!selectedStock) return;
    setData([]);
    fetch(`http://localhost:8000/stock/${selectedStock}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (!json) return;
        setData(json.stock_series.map(d => ({
          date: new Date(d.date),
          Open: d.Open,
          High: d.High,
          Low: d.Low,
          Close: d.Close,
        })).filter(d => !isNaN(d.date.getTime())));
      })
      .catch(() => setData([]));
  }, [selectedStock]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || data.length === 0) return;

    const obs = new ResizeObserver(
      debounce(entries => {
        for (const e of entries) {
          if (e.target !== containerRef.current) continue;
          const { width, height } = e.contentRect;
          if (width && height) drawChart(svgRef.current, data, selectedStock, width, height);
        }
      }, 100)
    );
    obs.observe(containerRef.current);
    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height) drawChart(svgRef.current, data, selectedStock, width, height);
    return () => obs.disconnect();
  }, [data, selectedStock]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function drawChart(svgEl, data, ticker, width, height) {
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  const W = width - MARGIN.left - MARGIN.right;
  const H = height - MARGIN.top - MARGIN.bottom;
  if (W <= 0 || H <= 0) return;

  const xExtent = d3.extent(data, d => d.date);
  const yMin = d3.min(data, d => Math.min(d.Open, d.High, d.Low, d.Close));
  const yMax = d3.max(data, d => Math.max(d.Open, d.High, d.Low, d.Close));
  const pad = (yMax - yMin) * 0.05;

  const xScale = d3.scaleTime().domain(xExtent).range([0, W]);
  const yScale = d3.scaleLinear().domain([yMin - pad, yMax + pad]).range([H, 0]);

  svg.append('defs').append('clipPath').attr('id', 'line-clip')
    .append('rect').attr('width', W).attr('height', H);

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  const xAxisG = g.append('g')
    .attr('transform', `translate(0,${H})`)
    .call(d3.axisBottom(xScale).ticks(7).tickFormat(d3.timeFormat('%b %Y')));

  g.append('g').call(d3.axisLeft(yScale).ticks(6).tickFormat(d => `$${d3.format('.0f')(d)}`));

  g.append('text').attr('x', W / 2).attr('y', H + 45)
    .style('text-anchor', 'middle').style('font-size', '11px').text('Date');

  g.append('text').attr('transform', 'rotate(-90)').attr('x', -H / 2).attr('y', -55)
    .style('text-anchor', 'middle').style('font-size', '11px').text('Price (USD)');

  svg.append('text').attr('x', MARGIN.left + W / 2).attr('y', 18)
    .style('text-anchor', 'middle').style('font-size', '13px').style('font-weight', 'bold')
    .text(`${ticker} — Open / High / Low / Close`);

  const linesG = g.append('g').attr('clip-path', 'url(#line-clip)');

  KEYS.forEach(key => {
    const line = d3.line().defined(d => !isNaN(d[key]))
      .x(d => xScale(d.date)).y(d => yScale(d[key]));
    linesG.append('path').datum(data)
      .attr('class', `line-${key}`)
      .attr('fill', 'none')
      .attr('stroke', COLORS[key])
      .attr('stroke-width', 1.5)
      .attr('d', line);
  });

  // Legend
  const legG = g.append('g').attr('transform', `translate(${W - 80}, 5)`);
  KEYS.forEach((key, i) => {
    legG.append('line').attr('x1', 0).attr('x2', 14).attr('y1', i * 18 + 7).attr('y2', i * 18 + 7)
      .attr('stroke', COLORS[key]).attr('stroke-width', 2);
    legG.append('text').attr('x', 18).attr('y', i * 18 + 11)
      .style('font-size', '11px').text(key);
  });

  // Zoom overlay — transparent rect captures wheel + drag
  const zoom = d3.zoom()
    .scaleExtent([0.5, 50])
    .translateExtent([[0, -Infinity], [W, Infinity]])
    .extent([[0, 0], [W, H]])
    .on('zoom', event => {
      const newX = event.transform.rescaleX(xScale);
      xAxisG.call(d3.axisBottom(newX).ticks(7).tickFormat(d3.timeFormat('%b %Y')));
      KEYS.forEach(key => {
        const newLine = d3.line().defined(d => !isNaN(d[key]))
          .x(d => newX(d.date)).y(d => yScale(d[key]));
        linesG.select(`.line-${key}`).attr('d', newLine(data));
      });
    });

  g.append('rect')
    .attr('width', W).attr('height', H)
    .attr('fill', 'none').attr('pointer-events', 'all')
    .call(zoom);
}
