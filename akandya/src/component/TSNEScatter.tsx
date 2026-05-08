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
      right: 120,
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
        .range([margin.left, width - margin.right]);

      const y = d3
        .scaleLinear()
        .domain(d3.extent(formatted, (d: any) => d.y) as [number, number])
        .range([height - margin.bottom, margin.top]);

      const sectors = Array.from(
        new Set(formatted.map((d: any) => d.sector))
      );

      const color = d3.scaleOrdinal(d3.schemeCategory10).domain(sectors);

      svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

      svg
        .append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

      svg
        .append("g")
        .selectAll("circle")
        .data(formatted)
        .enter()
        .append("circle")
        .attr("cx", (d: any) => x(d.x))
        .attr("cy", (d: any) => y(d.y))
        .attr("r", (d: any) =>
          d.ticker === selectedStock ? 10 : 6
        )
        .attr("fill", (d: any) => color(d.sector) as string)
        .attr("stroke", "black")
        .style("cursor", "pointer")
        .on("click", (_, d: any) => {
          setSelectedStock(d.ticker);
        });

      svg
        .append("g")
        .selectAll("text")
        .data(formatted.filter((d: any) => d.ticker === selectedStock))
        .enter()
        .append("text")
        .attr("x", (d: any) => x(d.x) + 10)
        .attr("y", (d: any) => y(d.y))
        .text((d: any) => d.ticker)
        .style("font-weight", "bold");
    });
  }, [selectedStock, setSelectedStock]);

  return <svg ref={ref}></svg>;
}
