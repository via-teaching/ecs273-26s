import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { debounce } from 'lodash';

const margin = { left: 50, right: 150, top: 20, bottom: 50 };

const SECTOR_COLORS = {
  'Energy': 'orange',
  'Industrials': 'steelblue',
  'Consumer': 'green',
  'Healthcare': 'red',
  'Financials': 'purple',
  'Info Tech': 'brown'
};

export function TSNEScatter({ selectedStock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect;
          if (width && height) {
            drawChart(svgRef.current, selectedStock, width, height);
          }
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);

    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height) {
      drawChart(svgRef.current, selectedStock, width, height);
    }

    return () => resizeObserver.disconnect();
  }, [selectedStock]);

  return (
    <div className="chart-container d-flex" ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}

function drawChart(svgElement, selectedStock, width, height) {
  const svg = d3.select(svgElement);
  svg.selectAll('*').remove();

  d3.csv('/data/tsne.csv').then(data => {
    data.forEach(d => {
      d.tsne_1 = +d.tsne_1;
      d.tsne_2 = +d.tsne_2;
    });

    const xScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.tsne_1) - 5, d3.max(data, d => d.tsne_1) + 5])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.tsne_2) - 5, d3.max(data, d => d.tsne_2) + 5])
      .range([height - margin.bottom, margin.top]);

    const chartGroup = svg.append('g');

    const xAxisG = chartGroup.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5));

    const yAxisG = chartGroup.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale).ticks(5));

    const plotGroup = chartGroup.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .on('zoom', (event) => {
        const newX = event.transform.rescaleX(xScale);
        const newY = event.transform.rescaleY(yScale);
        xAxisG.call(d3.axisBottom(newX).ticks(5));
        yAxisG.call(d3.axisLeft(newY).ticks(5));
        plotGroup.selectAll('circle')
          .attr('cx', d => newX(d.tsne_1))
          .attr('cy', d => newY(d.tsne_2));
        plotGroup.selectAll('text.stock-label')
          .attr('x', d => newX(d.tsne_1) + 12)
          .attr('y', d => newY(d.tsne_2) + 4);
      });

    svg.call(zoom);

    // Axis labels
    svg.append('text')
      .attr('transform', `translate(${width / 2}, ${height - 10})`)
      .style('text-anchor', 'middle')
      .style('font-size', '.8rem')
      .text('t-SNE 1');

    svg.append('text')
      .attr('transform', `translate(12, ${height / 2}) rotate(-90)`)
      .style('text-anchor', 'middle')
      .style('font-size', '.8rem')
      .text('t-SNE 2');

    // Draw points
    plotGroup.selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', d => xScale(d.tsne_1))
      .attr('cy', d => yScale(d.tsne_2))
      .attr('r', d => d.ticker === selectedStock ? 10 : 6)
      .attr('fill', d => SECTOR_COLORS[d.sector] || 'gray')
      .attr('stroke', d => d.ticker === selectedStock ? 'black' : 'none')
      .attr('stroke-width', 2)
      .attr('opacity', 0.8);

    // Label for selected stock
    plotGroup.selectAll('text.stock-label')
      .data(data.filter(d => d.ticker === selectedStock))
      .join('text')
      .attr('class', 'stock-label')
      .attr('x', d => xScale(d.tsne_1) + 12)
      .attr('y', d => yScale(d.tsne_2) + 4)
      .text(d => d.ticker)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .attr('fill', 'black');

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`);

    Object.entries(SECTOR_COLORS).forEach(([sector, color], i) => {
      const lg = legend.append('g').attr('transform', `translate(0, ${i * 22})`);
      lg.append('circle')
        .attr('cx', 8).attr('cy', 8)
        .attr('r', 6)
        .attr('fill', color);
      lg.append('text')
        .attr('x', 20).attr('y', 12)
        .text(sector)
        .style('font-size', '11px');
    });
  });
}
