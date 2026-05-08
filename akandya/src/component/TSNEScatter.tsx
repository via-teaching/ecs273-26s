import { useEffect, useRef } from "react";
import * as d3 from "d3";

type Props = {
  selectedStock: string;
  setSelectedStock: (stock: string) => void;
};

export default function TSNEScatter({
  selectedStock,
  setSelectedStock,
}: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 700;
    const height = 350;

    const margin = {
      top: 30,
      right: 140,
      bottom: 50,
      left: 60,
    };

    svg.attr("width", width).attr("height", height);

    d3.csv("./data/tsne.csv").then((data) => {
      const formatted = data.map((d: any) => ({
        ticker: d.ticker,
        x: +d.x,
        y: +d.y,
        sector: d.sector,
      }));

      const x = d3
        .scaleLinear()
        .domain(d3.extent(formatted, (d: any) => d.x) as [number, number])
        .nice()
        .range([margin.left, width - margin.right]);

      const y = d3
        .scaleLinear()
        .domain(d3.extent(formatted, (d: any) => d.y) as [number, number])
        .nice()
        .range([height - margin.bottom, margin.top]);

      const sectors = Array.from(
        new Set(formatted.map((d: any) => d.sector))
      );

      const color = d3
        .scaleOrdinal<string>()
        .domain(sectors)
        .range(d3.schemeCategory10);

      const xAxisGroup = svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`);

      xAxisGroup.call(d3.axisBottom(x));

      const yAxisGroup = svg
        .append("g")
        .attr("transform", `translate(${margin.left},0)`);

      yAxisGroup.call(d3.axisLeft(y));

      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .text("t-SNE Dimension 1");

      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .text("t-SNE Dimension 2");

      const chartGroup = svg.append("g");

      chartGroup
        .selectAll("circle")
        .data(formatted)
        .enter()
        .append("circle")
        .attr("cx", (d: any) => x(d.x))
        .attr("cy", (d: any) => y(d.y))
        .attr("r", (d: any) => (d.ticker === selectedStock ? 10 : 6))
        .attr("fill", (d: any) => color(d.sector))
        .attr("stroke", (d: any) =>
          d.ticker === selectedStock ? "black" : "#333"
        )
        .attr("stroke-width", (d: any) =>
          d.ticker === selectedStock ? 3 : 1
        )
        .style("cursor", "pointer")
        .on("click", (_, d: any) => {
          setSelectedStock(d.ticker);
        });

      chartGroup
        .selectAll("text.stock-label")
        .data(formatted)
        .enter()
        .append("text")
        .attr("class", "stock-label")
        .attr("x", (d: any) => x(d.x) + 8)
        .attr("y", (d: any) => y(d.y) + 4)
        .text((d: any) => d.ticker)
        .style("font-size", (d: any) =>
          d.ticker === selectedStock ? "13px" : "10px"
        )
        .style("font-weight", (d: any) =>
          d.ticker === selectedStock ? "bold" : "normal"
        )
        .style("fill", "black");

      const legend = svg
        .append("g")
        .attr("transform", `translate(${width - 125},35)`);

      sectors.forEach((sector, i) => {
        legend
          .append("circle")
          .attr("cx", 0)
          .attr("cy", i * 20)
          .attr("r", 5)
          .attr("fill", color(sector));

        legend
          .append("text")
          .attr("x", 10)
          .attr("y", i * 20 + 4)
          .text(sector)
          .style("font-size", "11px");
      });

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 10])
        .on("zoom", (event) => {
          const newX = event.transform.rescaleX(x);
          const newY = event.transform.rescaleY(y);

          xAxisGroup.call(d3.axisBottom(newX));
          yAxisGroup.call(d3.axisLeft(newY));

          chartGroup
            .selectAll("circle")
            .attr("cx", (d: any) => newX(d.x))
            .attr("cy", (d: any) => newY(d.y));

          chartGroup
            .selectAll("text.stock-label")
            .attr("x", (d: any) => newX(d.x) + 8)
            .attr("y", (d: any) => newY(d.y) + 4);
        });

      svg.call(zoom as any);
    });
  }, [selectedStock, setSelectedStock]);

  return <svg ref={ref}></svg>;
}