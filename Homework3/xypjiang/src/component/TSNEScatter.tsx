import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Props {
  selectedStock: string;
}

export default function TSNEScatter({ selectedStock }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const margin = { top: 20, right: 100, bottom: 40, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv('/data/tsne.csv').then((data: any) => {
      data.forEach((d: any) => {
        d.Dim_1 = +d.Dim_1;
        d.Dim_2 = +d.Dim_2;
      });

      const x = d3.scaleLinear().domain(d3.extent(data, (d: any) => d.Dim_1) as unknown as [number, number]).range([0, width]).nice();
      const y = d3.scaleLinear().domain(d3.extent(data, (d: any) => d.Dim_2) as unknown as [number, number]).range([height, 0]).nice();
      
      const sectors = Array.from(new Set(data.map((d:any) => d.Sector as string)));
      const color = d3.scaleOrdinal(d3.schemeSet3).domain(sectors as string[]);

      // Axes
      const xAxis = root.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
      const yAxis = root.append("g").call(d3.axisLeft(y));

      const scatterGroup = root.append("g");

      // Draw Points
      const circles = scatterGroup.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", (d:any) => x(d.Dim_1))
        .attr("cy", (d:any) => y(d.Dim_2))
        .attr("r", (d:any) => d.Ticker === selectedStock ? 5 : 4) 
        .attr("fill", (d:any) => color(d.Sector))
        .attr("stroke", (d:any) => d.Ticker === selectedStock ? "#000" : "none")
        .attr("stroke-width", 1)
        .style("opacity", 0.9);

      // Label for selected stock
      scatterGroup.selectAll("text.label")
        .data(data.filter((d:any) => d.Ticker === selectedStock))
        .enter().append("text")
        .attr("x", (d:any) => x(d.Dim_1) + 12)
        .attr("y", (d:any) => y(d.Dim_2) + 4)
        .text((d:any) => d.Ticker)
        .style("font-weight", "normal")
        .style("font-size", "12px");

      // Legend
      const legend = svg.append("g").attr("transform", `translate(${width + margin.left + 10}, ${margin.top})`);
      sectors.forEach((sector: any, i) => {
        legend.append("rect").attr("y", i * 20).attr("width", 10).attr("height", 10).attr("fill", color(sector));
        legend.append("text").attr("x", 15).attr("y", i * 20 + 9).text(sector).style("font-size", "12px").attr("alignment-baseline", "middle");
      });

      // Zooming
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 10])
        .on("zoom", (event) => {
          scatterGroup.attr("transform", event.transform);
          xAxis.call(d3.axisBottom(event.transform.rescaleX(x)));
          yAxis.call(d3.axisLeft(event.transform.rescaleY(y)));
        });
      svg.call(zoom);
    });
  }, [selectedStock]);

  return <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet" />;
}