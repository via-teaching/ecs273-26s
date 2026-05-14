import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { isEmpty, debounce } from 'lodash';


const margin = { left: 40, right: 20, top: 20, bottom: 30 };

export function LineChart({ selectedStock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect;
          if (width && height && !isEmpty(selectedStock)) {
            drawChart(svgRef.current, selectedStock, width, height, zoomLevel);
          }
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);

    // Draw initially based on starting size
    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height) {
      drawChart(svgRef.current, selectedStock, width, height, zoomLevel);
    }

    return () => resizeObserver.disconnect();
  }, [selectedStock, zoomLevel]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoomLevel(prev => Math.max(1, Math.min(10, prev * delta)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="chart-container d-flex" ref={containerRef} style={{ width: '100%', height: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
      <svg id="bar-svg" ref={svgRef}></svg>
    </div>
  );
}

function drawChart(svgElement, selectedStock, width, height, zoomLevel = 1) {
  if (!selectedStock) return;

  const svg = d3.select(svgElement);
  svg.selectAll('*').remove();

  d3.csv(`/data/stockdata/${selectedStock}.csv`).then(data => {
    data.forEach(d => {
      d.Date = new Date(d.Date);
      d.Open = +d.Open;
      d.High = +d.High;
      d.Low = +d.Low;
      d.Close = +d.Close;
    });

    const dataPoints = data.length;
    const minWidth = width - margin.left - margin.right;
    const expandedWidth = Math.max(minWidth, dataPoints * 2 * zoomLevel);

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.Date))
      .range([margin.left, margin.left + expandedWidth]);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(data, d => Math.min(d.Open, d.High, d.Low, d.Close)),
        d3.max(data, d => Math.max(d.Open, d.High, d.Low, d.Close))
      ])
      .range([height - margin.bottom, margin.top]);

    const svgWidth = margin.left + expandedWidth + margin.right;

    svg.attr('width', svgWidth).attr('height', height);

    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [svgWidth, height]])
      .extent([[0, 0], [svgWidth, height]])
      .on('zoom', (event) => {
        const newX = event.transform.rescaleX(xScale);
        xAxis.call(d3.axisBottom(newX));
        linesGroup.selectAll('path').each(function (d, i) {
          const key = ['Open', 'High', 'Low', 'Close'][i];
          d3.select(this).attr('d', lines[key].x(d => newX(d.Date)));
        });
      });

    svg.call(zoom);

    const xAxis = svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.0f')));

    svg.append('text')
      .attr('transform', `translate(10, ${height / 2}) rotate(-90)`)
      .text('Price')
      .style('font-size', '.8rem');

    svg.append('text')
      .attr('transform', `translate(${margin.left + expandedWidth / 2}, ${height - 5})`)
      .text('Date')
      .style('font-size', '.8rem');

    const lines = {
      Open: d3.line().defined(d => !isNaN(d.Open)).x(d => xScale(d.Date)).y(d => yScale(d.Open)),
      High: d3.line().defined(d => !isNaN(d.High)).x(d => xScale(d.Date)).y(d => yScale(d.High)),
      Low: d3.line().defined(d => !isNaN(d.Low)).x(d => xScale(d.Date)).y(d => yScale(d.Low)),
      Close: d3.line().defined(d => !isNaN(d.Close)).x(d => xScale(d.Date)).y(d => yScale(d.Close))
    };

    const colors = { Open: 'steelblue', High: 'green', Low: 'red', Close: 'orange' };

    const linesGroup = svg.append('g');
    Object.keys(lines).forEach(key => {
      linesGroup.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', colors[key])
        .attr('stroke-width', 1.5)
        .attr('d', lines[key]);
    });

    const legend = svg.append('g')
      .attr('transform', `translate(${svgWidth - margin.right - 100}, ${margin.top})`);

    Object.keys(colors).forEach((key, i) => {
      const lg = legend.append('g').attr('transform', `translate(0, ${i * 20})`);
      lg.append('line')
        .attr('x1', 0).attr('x2', 20)
        .attr('stroke', colors[key])
        .attr('stroke-width', 2);
      lg.append('text')
        .attr('x', 25).attr('y', 5)
        .text(key)
        .style('font-size', '12px');
    });
  });
}
