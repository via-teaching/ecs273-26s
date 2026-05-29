import { useEffect, useRef } from "react";
import * as d3 from "d3";

type Props = {
  selectedStock: string;
  height?: number;
};

type StockRow = {
  date: Date;
  Open: number;
  High: number;
  Low: number;
  Close: number;
};

export default function LineChart({ selectedStock, height = 280 }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const svg = d3.select(ref.current);
    // clear previous content
    svg.selectAll("*").remove();

    const width = 700;
    const margin = { top: 20, right: 95, bottom: 40, left: 50 };

    svg
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "none");

    // fetch data and render (use AbortController to avoid race conditions)
    const controller = new AbortController();
    const signal = controller.signal;

    fetch(`http://127.0.0.1:8000/stock/${selectedStock}`, { signal })
      .then((res) => res.json())
      .then((result) => {
        if (signal.aborted) return;
        const data = result.prices;

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

        xAxisGroup.call(d3.axisBottom(x)).selectAll("text").style("font-size", "12px");

        svg
          .append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y))
          .selectAll("text")
          .style("font-size", "12px");

        svg
          .append("text")
          .attr("x", width / 2)
          .attr("y", height - 4)
          .attr("text-anchor", "middle")
          .style("font-size", "13px")
          .text("Date");

        svg
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -height / 2)
          .attr("y", 16)
          .attr("text-anchor", "middle")
          .style("font-size", "13px")
          .text("Price");

        const clipId = `clip-${selectedStock}-${Date.now()}`;

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
            .attr("d", line as any);
        });

        const legend = svg
          .append("g")
          .attr("transform", `translate(${width - margin.right + 8},30)`);

        keys.forEach((key, i) => {
          legend
            .append("circle")
            .attr("cx", 0)
            .attr("cy", i * 22)
            .attr("r", 6)
            .attr("fill", color(key)!);

          legend
            .append("text")
            .attr("x", 12)
            .attr("y", i * 22 + 5)
            .style("font-size", "13px")
            .text(key);
        });

        // cleanup any previous zoom handlers to avoid duplicates
        try {
          svg.on(".zoom", null);
        } catch (e) {
          /* ignore */
        }

        const zoom = d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 10])
          .translateExtent([[margin.left, 0], [width - margin.right, height]])
          .extent([[margin.left, 0], [width - margin.right, height]])
          .on("zoom", (event) => {
            const newX = event.transform.rescaleX(x);

            xAxisGroup.call(d3.axisBottom(newX));

            keys.forEach((key) => {
              const newLine = d3
                .line<StockRow>()
                .x((d) => newX(d.date))
                .y((d) => y(d[key]));

              chartGroup.select(`.line-${key}`).attr("d", newLine(formatted) as any);
            });
          });

        svg.call(zoom as any);

        initialized.current = true;
      })
      .catch((err) => {
        if ((err as any).name === "AbortError") return;
        console.error("Error rendering line chart:", err);
      });

    return () => {
      // abort in-flight fetch and remove zoom handlers when unmounting or before next effect
      controller.abort();
      try {
        svg.on(".zoom", null);
      } catch (e) {
        /* ignore */
      }
      // remove any leftover elements
      svg.selectAll("*").remove();
    };
  }, [selectedStock, height]);

  return <svg ref={ref}></svg>;
}