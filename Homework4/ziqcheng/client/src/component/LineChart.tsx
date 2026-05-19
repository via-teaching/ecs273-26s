import { useEffect, useRef } from "react";
import * as d3 from "d3";

type StockRecord = {
  Date?: string;
  date?: string;
  Open?: number | string;
  High?: number | string;
  Low?: number | string;
  Close?: number | string;
  open?: number | string;
  high?: number | string;
  low?: number | string;
  close?: number | string;
};

type LineChartProps = {
  data: StockRecord[];
  selectedStock: string;
};

export default function LineChart({ data, selectedStock }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const width = 980;
    const height = 230;
    const margin = { top: 28, right: 120, bottom: 45, left: 60 };

    const parsedData = data
      .map((d) => ({
        date: new Date(d.Date ?? d.date ?? ""),
        Open: Number(d.Open ?? d.open),
        High: Number(d.High ?? d.high),
        Low: Number(d.Low ?? d.low),
        Close: Number(d.Close ?? d.close),
      }))
      .filter(
        (d) =>
          !isNaN(d.date.getTime()) &&
          !isNaN(d.Open) &&
          !isNaN(d.High) &&
          !isNaN(d.Low) &&
          !isNaN(d.Close)
      );

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (parsedData.length === 0) return;

    const keys = ["Open", "High", "Low", "Close"] as const;

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(parsedData, (d) => d.date) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const yMin =
      d3.min(parsedData, (d) => d3.min(keys, (key) => d[key])) ?? 0;
    const yMax =
      d3.max(parsedData, (d) => d3.max(keys, (key) => d[key])) ?? 1;

    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3
      .scaleOrdinal<string>()
      .domain(keys)
      .range(["#1f77b4", "#2ca02c", "#d62728", "#9467bd"]);

    const xAxisGroup = svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`);

    const yAxisGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`);

    const chartGroup = svg.append("g");

    const line = d3
      .line<any>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value));

    function draw(currentXScale: d3.ScaleTime<number, number>) {
      const xAxis = d3
        .axisBottom(currentXScale)
        .ticks(6)
        .tickFormat(d3.timeFormat("%b %d, %Y") as any);

        xAxisGroup.call(xAxis);
        xAxisGroup
            .selectAll("text")
            .attr("transform", "rotate(-25)")
            .style("text-anchor", "end");

      yAxisGroup.call(d3.axisLeft(yScale));

      const seriesData = keys.map((key) => ({
        key,
        values: parsedData.map((d) => ({
          date: d.date,
          value: d[key],
        })),
      }));

      const lines = chartGroup.selectAll<SVGPathElement, any>(".stock-line").data(seriesData);

      lines
        .join("path")
        .attr("class", "stock-line")
        .attr("fill", "none")
        .attr("stroke", (d) => color(d.key) as string)
        .attr("stroke-width", 2)
        .attr("d", (d) =>
          d3
            .line<any>()
            .x((p) => currentXScale(p.date))
            .y((p) => yScale(p.value))(d.values)
        );
    }

    draw(xScale);

    // Clip chart area
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "line-chart-clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    chartGroup.attr("clip-path", "url(#line-chart-clip)");

    // Axis labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .text("Date");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .text("Price");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 16)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .text(`${selectedStock} Stock Price`);

    // Legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - margin.right + 15}, ${margin.top})`);

    keys.forEach((key, i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);

      row
        .append("line")
        .attr("x1", 0)
        .attr("x2", 18)
        .attr("y1", 5)
        .attr("y2", 5)
        .attr("stroke", color(key) as string)
        .attr("stroke-width", 3);

      row
        .append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("font-size", 12)
        .text(key);
    });

    // Horizontal zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .translateExtent([
        [margin.left, 0],
        [width - margin.right, height],
      ])
      .extent([
        [margin.left, 0],
        [width - margin.right, height],
      ])
      .on("zoom", (event) => {
        const newXScale = event.transform.rescaleX(xScale);
        draw(newXScale);
      });

    svg.call(zoom);
  }, [data, selectedStock]);

return (
  <div className="w-full h-full flex justify-center items-center overflow-hidden">
    <svg
      ref={svgRef}
      width="100%"
      height={230}
      viewBox={`0 0 ${980} ${230}`}
      preserveAspectRatio="xMidYMid meet"
    ></svg>
  </div>
);
}