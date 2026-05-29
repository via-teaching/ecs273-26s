import { useEffect, useRef } from "react";
import * as d3 from "d3";

type Props = {
  selectedStock: string;
  setSelectedStock: (stock: string) => void;
  height?: number;
};

export default function TSNEScatter({
  selectedStock,
  setSelectedStock,
  height = 280,
}: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 700;

    const margin = {
      top: 20,
      right: 145,
      bottom: 40,
      left: 50,
    };

    svg
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "none");

    const controller = new AbortController();
    const signal = controller.signal;

    fetch("http://127.0.0.1:8000/tsne", { signal })
      .then((res) => res.json())
      .then((result) => {
        if (signal.aborted) return;
        const data = result.points;

        const formatted = data.map((d: any) => ({
          ticker: d.ticker,
          x: +d.x,
          y: +d.y,
          sector: d.sector,
        }));

        const x = d3
          .scaleLinear()
          .domain([d3.min(formatted, (d: any) => d.x)! - 1, 35])
          .range([margin.left, width - margin.right]);

        const y = d3
          .scaleLinear()
          .domain([d3.min(formatted, (d: any) => d.y)! - 1, 30])
          .range([height - margin.bottom, margin.top]);

        const sectors = Array.from(new Set(formatted.map((d: any) => d.sector)));

        const color = d3
          .scaleOrdinal<string>()
          .domain(sectors)
          .range(d3.schemeCategory10);

        const xAxisGroup = svg
          .append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`);

        xAxisGroup.call(d3.axisBottom(x)).selectAll("text").style("font-size", "12px");

        const yAxisGroup = svg
          .append("g")
          .attr("transform", `translate(${margin.left},0)`);

        yAxisGroup.call(d3.axisLeft(y)).selectAll("text").style("font-size", "12px");

        svg
          .append("text")
          .attr("x", width / 2)
          .attr("y", height - 4)
          .attr("text-anchor", "middle")
          .style("font-size", "13px")
          .text("t-SNE Dimension 1");

        svg
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -height / 2)
          .attr("y", 16)
          .attr("text-anchor", "middle")
          .style("font-size", "13px")
          .text("t-SNE Dimension 2");

        const clipId = `tsne-clip-${selectedStock}-${Date.now()}`;
        svg
          .append("defs")
          .append("clipPath")
          .attr("id", clipId)
          .append("rect")
          .attr("x", margin.left)
          .attr("y", margin.top)
          .attr("width", width - margin.left - margin.right)
          .attr("height", height - margin.top - margin.bottom);

        const chartGroup = svg.append("g").attr("clip-path", `url(#${clipId})`);

        chartGroup
          .selectAll("circle")
          .data(formatted)
          .enter()
          .append("circle")
          .attr("cx", (d: any) => x(d.x))
          .attr("cy", (d: any) => y(d.y))
          .attr("r", (d: any) => (d.ticker === selectedStock ? 10 : 6))
          .attr("fill", (d: any) => color(d.sector))
          .attr("stroke", (d: any) => (d.ticker === selectedStock ? "black" : "#333"))
          .attr("stroke-width", (d: any) => (d.ticker === selectedStock ? 3 : 1))
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
          .style("font-size", (d: any) => (d.ticker === selectedStock ? "16px" : "12px"))
          .style("font-weight", (d: any) => (d.ticker === selectedStock ? "bold" : "normal"))
          .style("fill", "black");

        const legend = svg.append("g").attr("transform", `translate(${width - margin.right + 8},30)`);

        sectors.forEach((sector, i) => {
          legend.append("circle").attr("cx", 0).attr("cy", i * 22).attr("r", 6).attr("fill", color(sector));
          legend.append("text").attr("x", 12).attr("y", i * 22 + 5).text(sector).style("font-size", "13px");
        });

        // remove existing zoom handlers to avoid double-attach
        try {
          svg.on(".zoom", null);
        } catch (e) {
          /* ignore */
        }

        const chartLeft = margin.left;
        const chartTop = margin.top;
        const chartRight = width - margin.right;
        const chartBottom = height - margin.bottom;

        const zoom = d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 10])
          .extent([[chartLeft, chartTop], [chartRight, chartBottom]])
          .translateExtent([[chartLeft, chartTop], [chartRight, chartBottom]])
          .on("zoom", (event) => {
            const newX = event.transform.rescaleX(x);
            const newY = event.transform.rescaleY(y);

            xAxisGroup.call(d3.axisBottom(newX)).selectAll("text").style("font-size", "12px");
            yAxisGroup.call(d3.axisLeft(newY)).selectAll("text").style("font-size", "12px");

            chartGroup.selectAll("circle").attr("cx", (d: any) => newX(d.x)).attr("cy", (d: any) => newY(d.y));
            chartGroup.selectAll("text.stock-label").attr("x", (d: any) => newX(d.x) + 8).attr("y", (d: any) => newY(d.y) + 4);
          });

        svg.call(zoom as any);
      })
      .catch((err) => {
        if ((err as any).name === "AbortError") return;
        console.error("Error rendering t-SNE scatter:", err);
      });

    return () => {
      controller.abort();
      try {
        svg.on(".zoom", null);
      } catch (e) {
        /* ignore */
      }
      svg.selectAll("*").remove();
    };
  }, [selectedStock, setSelectedStock, height]);

  return <svg ref={ref}></svg>;
}