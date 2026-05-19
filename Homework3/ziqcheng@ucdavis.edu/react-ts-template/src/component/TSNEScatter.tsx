import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { TSNERow } from "../types";

type Props = {
  selectedTicker: string;
};

const margin = { top: 30, right: 130, bottom: 50, left: 60 };
const width = 850;
const height = 340;
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

export default function TSNEScatter({ selectedTicker }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<TSNERow[]>([]);

  useEffect(() => {
    d3.csv("/data/tsne.csv", (d) => ({
      ticker: String(d.ticker),
      x: Number(d.x),
      y: Number(d.y),
      sector: String(d.sector),
    })).then((rows) => {
      setData(
        rows.filter(
          (d) =>
            d.ticker &&
            d.sector &&
            !Number.isNaN(d.x) &&
            !Number.isNaN(d.y)
        )
      );
    });
  }, []);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.x) as [number, number])
      .nice()
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.y) as [number, number])
      .nice()
      .range([innerHeight, 0]);

    const sectors = Array.from(new Set(data.map((d) => d.sector)));

    const color = d3.scaleOrdinal<string, string>(d3.schemeTableau10).domain(sectors);

    const root = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "100%");

    root
      .append("text")
      .attr("x", width / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text("t-SNE Stock Representation");

    const g = root
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xAxisG = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`);

    const yAxisG = g.append("g");

    xAxisG.call(d3.axisBottom(x));
    yAxisG.call(d3.axisLeft(y));

    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 42)
      .attr("text-anchor", "middle")
      .text("t-SNE Dimension 1");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -42)
      .attr("text-anchor", "middle")
      .text("t-SNE Dimension 2");

    const pointGroup = g.append("g");

    const drawPoints = (
      newX: d3.ScaleLinear<number, number>,
      newY: d3.ScaleLinear<number, number>
    ) => {
      const points = pointGroup
        .selectAll<SVGCircleElement, TSNERow>("circle")
        .data(data, (d) => d.ticker);

      points
        .join("circle")
        .attr("cx", (d) => newX(d.x))
        .attr("cy", (d) => newY(d.y))
        .attr("r", (d) => (d.ticker === selectedTicker ? 9 : 6))
        .attr("fill", (d) => color(d.sector))
        .attr("stroke", (d) => (d.ticker === selectedTicker ? "black" : "white"))
        .attr("stroke-width", (d) => (d.ticker === selectedTicker ? 2.5 : 1))
        .attr("opacity", 0.85);

      const labels = pointGroup
        .selectAll<SVGTextElement, TSNERow>("text.stock-label")
        .data(data.filter((d) => d.ticker === selectedTicker), (d) => d.ticker);

      labels
        .join("text")
        .attr("class", "stock-label")
        .attr("x", (d) => newX(d.x) + 10)
        .attr("y", (d) => newY(d.y) - 10)
        .attr("font-size", 13)
        .attr("font-weight", "bold")
        .text((d) => d.ticker);
    };

    drawPoints(x, y);

    const legend = root
      .append("g")
      .attr("transform", `translate(${width - 120}, ${margin.top + 15})`);

    sectors.forEach((sector, i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${i * 22})`);

      row
        .append("circle")
        .attr("r", 6)
        .attr("cx", 7)
        .attr("cy", 7)
        .attr("fill", color(sector));

      row
        .append("text")
        .attr("x", 20)
        .attr("y", 12)
        .attr("font-size", 12)
        .text(sector);
    });

    const zoom = d3
      .zoom<SVGRectElement, unknown>()
      .scaleExtent([0.5, 20])
      .on("zoom", (event) => {
        const newX = event.transform.rescaleX(x);
        const newY = event.transform.rescaleY(y);

        xAxisG.call(d3.axisBottom(newX));
        yAxisG.call(d3.axisLeft(newY));

        drawPoints(newX, newY);
      });

    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .style("cursor", "grab")
      .call(zoom);
  }, [data, selectedTicker]);

  return <svg ref={svgRef}></svg>;
}