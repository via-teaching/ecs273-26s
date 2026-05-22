import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Props {
  selectedStock: string;
}

export default function LineChart({ selectedStock }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const internalHeight = 300;

    const root = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv(`/data/stockdata/${selectedStock}.csv`).then((rawData: any) => {
      const data = rawData.filter(
        (d: any) => d.Date && !isNaN(new Date(d.Date).getTime())
      );

      data.forEach((d: any) => {
        d.Date = new Date(d.Date);
        d.Open = +d.Open;
        d.High = +d.High;
        d.Low = +d.Low;
        d.Close = +d.Close;
      });

      const minPixelsPerPoint = 8;
      const width = Math.max(800, data.length * minPixelsPerPoint);
      const height = internalHeight - margin.top - margin.bottom;

      svg.attr("width", width + margin.left + margin.right)
        .attr("height", internalHeight);

      // scales
      const x = d3
        .scaleTime()
        .domain(d3.extent(data, (d: any) => d.Date) as [any, any])
        .range([0, width]);

      const y = d3
        .scaleLinear()
        .domain([
          d3.min(data, (d: any) =>
            Math.min(d.Low, d.Open, d.Close)
          ) as number,
          d3.max(data, (d: any) =>
            Math.max(d.High, d.Open, d.Close)
          ) as number,
        ])
        .range([height, 0]);

      // axes groups
      const xAxisGroup = root
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

      const yAxisGroup = root.append("g").call(d3.axisLeft(y));

      // clip
      root
        .append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

      const lineGroup = root
        .append("g")
        .attr("clip-path", "url(#clip)");

      const metrics = ["Open", "High", "Low", "Close"];
      const colors = d3
        .scaleOrdinal(d3.schemeSet1)
        .domain(metrics);

      metrics.forEach((metric) => {
        const lineGen = d3
          .line<any>()
          .x((d) => x(d.Date))
          .y((d) => y(d[metric]));

        lineGroup
          .append("path")
          .datum(data)
          .attr("class", "stock-line")
          .attr("data-metric", metric)
          .attr("fill", "none")
          .attr("stroke", colors(metric) as string)
          .attr("stroke-width", 1.5)
          .attr("d", lineGen);
      });

      // legends
      const legend = root
        .append("g")
        .attr("transform", `translate(10,10)`);

      metrics.forEach((metric, i) => {
        legend
          .append("rect")
          .attr("y", i * 20)
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", colors(metric) as string);

        legend
          .append("text")
          .attr("x", 15)
          .attr("y", i * 20 + 9)
          .text(metric)
          .style("font-size", "12px")
          .attr("alignment-baseline", "middle");
      });

      // zoom
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 10])
        .translateExtent([
          [0, 0],
          [width, height],
        ])
        .on("zoom", (event) => {
          const newX = event.transform.rescaleX(x);

          xAxisGroup.call(d3.axisBottom(newX));

          lineGroup
            .selectAll<SVGPathElement, any>(".stock-line")
            .attr("d", function () {
              const metric = d3.select(this).attr("data-metric");

              return d3
                .line<any>()
                .x((d) => newX(d.Date))
                .y((d) => y(d[metric]))(data);
            });
        });

      svg.call(zoom as any);
    });

    return () => {
      svgRef.current && d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [selectedStock]);

  return (
    <div className="w-full h-full overflow-x-auto overflow-y-hidden">
      <svg ref={svgRef} style={{ display: "block" }} />
    </div>
  );
}