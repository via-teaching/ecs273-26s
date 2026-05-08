import { useEffect, useRef } from "react";
import * as d3 from "d3";

type Props = {
  selectedStock: string;
};

type StockRow = {
  date: Date;
  Open: number;
  High: number;
  Low: number;
  Close: number;
};

export default function LineChart({ selectedStock }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 700;
    const height = 350;
    const margin = { top: 30, right: 100, bottom: 50, left: 60 };

    svg.attr("width", width).attr("height", height);

    d3.csv(`./data/stockdata/${selectedStock}.csv`).then((data) => {
      
      const formatted: StockRow[] = data
        .map((d: any) => ({
          date: new Date(d.Date),
          Open: +d.Open,
          High: +d.High,
          Low: +d.Low,
          Close: +d.Close,
        }))
        .filter((d: any) => d.date && !isNaN(d.Open));

      const keys: (keyof Omit<StockRow, "date">)[] = [
        "Open",
        "High",
        "Low",
        "Close",
      ];

      const x = d3
        .scaleTime()
        .domain(d3.extent(formatted, (d) => d.date) as [Date, Date])
        .range([margin.left, width - margin.right]);

      const y = d3
        .scaleLinear()
        .domain([
          d3.min(formatted, (d) => d.Low)! * 0.95,
          d3.max(formatted, (d) => d.High)! * 1.05,
        ])
        .range([height - margin.bottom, margin.top]);

      const color = d3
        .scaleOrdinal<string>()
        .domain(keys as string[])
        .range(["blue", "red", "green", "purple"]);

      const xAxisGroup = svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`);

      xAxisGroup.call(d3.axisBottom(x));

      svg
        .append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .text("Date");

      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .text("Price");

      const clipId = `clip-${selectedStock}`;

      svg
        .append("defs")
        .append("clipPath")
        .attr("id", clipId)
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom);

      const chartGroup = svg
        .append("g")
        .attr("clip-path", `url(#${clipId})`);

      keys.forEach((key) => {
        const line = d3
          .line<StockRow>()
          .x((d) => x(d.date))
          .y((d) => y(d[key]));

        chartGroup
          .append("path")
          .datum(formatted)
          .attr("class", `line-${key}`)
          .attr("fill", "none")
          .attr("stroke", color(key)!)
          .attr("stroke-width", 2)
          .attr("d", line);
      });

      const legend = svg
        .append("g")
        .attr("transform", `translate(${width - 80},40)`);

      keys.forEach((key, i) => {
        legend
          .append("circle")
          .attr("cx", 0)
          .attr("cy", i * 20)
          .attr("r", 5)
          .attr("fill", color(key)!);

        legend
          .append("text")
          .attr("x", 10)
          .attr("y", i * 20 + 4)
          .text(key);
      });

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 10])
        .translateExtent([
          [margin.left, 0],
          [width - margin.right, height],
        ])
        .extent([
          [margin.left, 0],
          [width - margin.right, height],
        ])
        .on("zoom", (event) => {
          const newX = event.transform.rescaleX(x);

          xAxisGroup.call(d3.axisBottom(newX));

          keys.forEach((key) => {
            const newLine = d3
              .line<StockRow>()
              .x((d) => newX(d.date))
              .y((d) => y(d[key]));

            chartGroup
              .select(`.line-${key}`)
              .attr("d", newLine(formatted));
          });
        });

      svg.call(zoom as any);;
    });
  }, [selectedStock]);

  return <svg ref={ref}></svg>;
}