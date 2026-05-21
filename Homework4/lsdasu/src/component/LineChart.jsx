import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';

const API_BASE = 'http://localhost:8000';

const margin = { left: 65, right: 110, top: 30, bottom: 55 };

const LINES = [
  { key: 'Open',  color: '#2196F3' },
  { key: 'High',  color: '#4CAF50' },
  { key: 'Low',   color: '#F44336' },
  { key: 'Close', color: '#FF9800' },
];

export function LineChart({ selectedStock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!selectedStock) return;
    fetch(`${API_BASE}/stock/${selectedStock}`)
      .then((res) => res.json())
      .then((json) => {
        const parsed = json.stock_series.map((d) => ({
          date: new Date(d.date),
          Open:  +d.Open,
          High:  +d.High,
          Low:   +d.Low,
          Close: +d.Close,
        })).filter((d) => !isNaN(d.date.getTime()));
        setData(parsed);
      })
      .catch((err) => console.error('LineChart fetch error:', err));
  }, [selectedStock]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || data.length === 0) return;

    const obs = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect;
          if (width && height) draw(svgRef.current, data, width, height, selectedStock);
        }
      }, 100)
    );
    obs.observe(containerRef.current);

    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height) draw(svgRef.current, data, width, height, selectedStock);

    return () => obs.disconnect();
  }, [data, selectedStock]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function draw(svgEl, data, width, height, stockName) {
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  const W = width  - margin.left - margin.right;
  const H = height - margin.top  - margin.bottom;

  svg.append('defs').append('clipPath').attr('id', 'line-clip')
    .append('rect').attr('width', W).attr('height', H + 1);

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const xBase = d3.scaleTime().domain(d3.extent(data, (d) => d.date)).range([0, W]);
  const allVals = LINES.flatMap((l) => data.map((d) => d[l.key]));
  const yScale  = d3.scaleLinear().domain(d3.extent(allVals)).nice().range([H, 0]);

  const xAxisG = g.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${H})`).call(d3.axisBottom(xBase).ticks(6));
  g.append('g').attr('class', 'y-axis').call(d3.axisLeft(yScale));

  g.append('text').attr('x', W / 2).attr('y', H + 45).attr('text-anchor', 'middle').style('font-size', '12px').text('Date');
  g.append('text').attr('transform', 'rotate(-90)').attr('x', -H / 2).attr('y', -52).attr('text-anchor', 'middle').style('font-size', '12px').text('Price (USD)');
  g.append('text').attr('x', W / 2).attr('y', -10).attr('text-anchor', 'middle').style('font-size', '13px').style('font-weight', 'bold').text(`${stockName} Stock Prices`);

  const linesG = g.append('g').attr('clip-path', 'url(#line-clip)');

  function makeLine(xScale, key) {
    return d3.line().x((d) => xScale(d.date)).y((d) => yScale(d[key])).defined((d) => !isNaN(d[key]));
  }

  LINES.forEach(({ key, color }) => {
    linesG.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1.5)
      .attr('class', `line-${key}`)
      .attr('d', makeLine(xBase, key)(data));
  });

  const legend = g.append('g').attr('transform', `translate(${W + 10}, 10)`);
  LINES.forEach(({ key, color }, i) => {
    const row = legend.append('g').attr('transform', `translate(0,${i * 22})`);
    row.append('line').attr('x1', 0).attr('x2', 16).attr('y1', 7).attr('y2', 7).attr('stroke', color).attr('stroke-width', 2);
    row.append('text').attr('x', 20).attr('y', 11).style('font-size', '11px').text(key);
  });

  const zoom = d3.zoom()
    .scaleExtent([1, 30])
    .translateExtent([[0, 0], [W, H]])
    .extent([[0, 0], [W, H]])
    .on('zoom', (event) => {
      const newX = event.transform.rescaleX(xBase);
      xAxisG.call(d3.axisBottom(newX).ticks(6));
      LINES.forEach(({ key }) => {
        linesG.select(`.line-${key}`).attr('d', makeLine(newX, key)(data));
      });
    });

  g.append('rect')
    .attr('width', W).attr('height', H)
    .attr('fill', 'none').attr('pointer-events', 'all')
    .call(zoom);
}
