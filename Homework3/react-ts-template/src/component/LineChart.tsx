import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { StockRow } from "../types";

type Props = {
  ticker: string;
};

const margin = { top: 30, right: 120, bottom: 50, left: 60 };
const width = 850;
const height = 340;
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

export default function LineChart({ ticker }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<StockRow[]>([]);

  useEffect(() => {
    d3.csv(`/data/stockdata/${ticker}.csv`, (d) => ({
      Date: d.Date as string,
      Open: Number(d.Open),
      High: Number(d.High),
      Low: Number(d.Low),
      Close: Number(d.Close),
      Volume: Number(d.Volume),
    })).then((rows) => {
      setData(rows.filter((d) => d.Date && !Number.isNaN(d.Close)));
    });
  }, [ticker]);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const parseDate = d3.timeParse("%Y-%m-%d");

    const parsed = data
      .map((d) => ({
        ...d,
        dateObj: parseDate(d.Date),
      }))
      .filter((d) => d.dateObj !== null);

    const keys: Array<"Open" | "High" | "Low" | "Close"> = [
      "Open",
      "High",
      "Low",
      "Close",
    ];

    const x = d3
      .scaleTime()
      .domain(d3.extent(parsed, (d) => d.dateObj as Date) as [Date, Date])
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([
        d3.min(parsed, (d) => d3.min(keys, (k) => d[k])) ?? 0,
        d3.max(parsed, (d) => d3.max(keys, (k) => d[k])) ?? 1,
      ])
      .nice()
      .range([innerHeight, 0]);

    const color = d3
      .scaleOrdinal<string>()
      .domain(keys)
      .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"]);

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
      .text(`${ticker} Stock Prices`);

    const g = root
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const clipId = `clip-${ticker}`;

    root
      .append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight);

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
      .text("Date");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -42)
      .attr("text-anchor", "middle")
      .text("Price");

    const lineGroup = g
      .append("g")
      .attr("clip-path", `url(#${clipId})`);

    const drawLines = (newX: d3.ScaleTime<number, number>) => {
      lineGroup.selectAll("*").remove();

      keys.forEach((key) => {
        const line = d3
          .line<(typeof parsed)[number]>()
          .x((d) => newX(d.dateObj as Date))
          .y((d) => y(d[key]));

        lineGroup
          .append("path")
          .datum(parsed)
          .attr("fill", "none")
          .attr("stroke", color(key))
          .attr("stroke-width", 2)
          .attr("d", line);
      });
    };

    drawLines(x);

    const legend = root
      .append("g")
      .attr("transform", `translate(${width - 105}, ${margin.top + 15})`);

    keys.forEach((key, i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${i * 22})`);

      row
        .append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", color(key));

      row
        .append("text")
        .attr("x", 20)
        .attr("y", 12)
        .attr("font-size", 12)
        .text(key);
    });

    const zoom = d3
      .zoom<SVGRectElement, unknown>()
      .scaleExtent([1, 20])
      .translateExtent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on("zoom", (event) => {
        const newX = event.transform.rescaleX(x);
        xAxisG.call(d3.axisBottom(newX));
        drawLines(newX);
      });

    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .style("cursor", "grab")
      .call(zoom);
  }, [data, ticker]);

  return <svg ref={svgRef}></svg>;
}