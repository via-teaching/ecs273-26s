import * as d3 from "d3";
import { useEffect, useRef } from "react";

// margin around chart area for axes and labels
var MARGIN = { left: 55, right: 20, top: 20, bottom: 50 };

// colors for the four price lines
var LINE_COLORS = {
  Open: "#4e79a7",
  High: "#59a14f",
  Low: "#e15759",
  Close: "#f28e2b",
};

export default function LineChart({ selectedStock }) {
  var svgRef = useRef(null);

  useEffect(function() {
    if (!selectedStock) return;

    // fetch stock data from FastAPI backend
    fetch("http://localhost:8000/stock/" + selectedStock)
      .then(function(res) {
        if (!res.ok) {
          throw new Error("No data for " + selectedStock);
        }
        return res.json();
      })
      .then(function(json) {
        // backend returns requested data
        var data = json.stock_series.map(function(d) {
          return {
            Date: new Date(d.date),
            Open: d.Open,
            High: d.High,
            Low: d.Low,
            Close: d.Close,
          };
        });
        drawChart(data);
      })
      .catch(function() {});
  }, [selectedStock]);

  function drawChart(data) {
    var svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    var width = svgRef.current.clientWidth;
    var height = svgRef.current.clientHeight;
    var innerW = width - MARGIN.left - MARGIN.right;
    var innerH = height - MARGIN.top - MARGIN.bottom;

    var fields = ["Open", "High", "Low", "Close"];

    var xScale = d3.scaleTime()
      .domain(d3.extent(data, function(d) { return d.Date; }))
      .range([0, innerW]);

    var allValues = [];
    for (var fi = 0; fi < fields.length; fi++) {
      for (var di = 0; di < data.length; di++) {
        allValues.push(data[di][fields[fi]]);
      }
    }
    var yScale = d3.scaleLinear()
      .domain([d3.min(allValues) * 0.98, d3.max(allValues) * 1.02])
      .range([innerH, 0]);

    // clip path so lines don't draw outside axes during zoom
    svg.append("defs").append("clipPath")
      .attr("id", "lc-clip")
      .append("rect")
      .attr("width", innerW)
      .attr("height", innerH + MARGIN.bottom);

    // y axis
    svg.append("g")
      .attr("transform", "translate(" + MARGIN.left + "," + MARGIN.top + ")")
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(function(d) { return "$" + d.toFixed(0); }));

    // y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(MARGIN.top + innerH / 2))
      .attr("y", 14)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "#555")
      .text("Price (USD)");

    // x axis label
    svg.append("text")
      .attr("x", MARGIN.left + innerW / 2)
      .attr("y", height - 4)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "#555")
      .text("Date");

    // scrollable group, holds lines and x axis
    var scrollG = svg.append("g")
      .attr("transform", "translate(" + MARGIN.left + "," + MARGIN.top + ")")
      .attr("clip-path", "url(#lc-clip)");

    var innerG = scrollG.append("g");

    // x axis in scroll group
    var xAxisG = scrollG.append("g")
      .attr("transform", "translate(0," + innerH + ")")
      .call(d3.axisBottom(xScale).ticks(d3.timeMonth.every(3)).tickFormat(d3.timeFormat("%b %Y")));
    xAxisG.selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end")
      .attr("font-size", 10);

    // draw one line per price field
    for (var f = 0; f < fields.length; f++) {
      var field = fields[f];
      (function(fieldName) {
        var lineGen = d3.line()
          .x(function(d) { return xScale(d.Date); })
          .y(function(d) { return yScale(d[fieldName]); })
          .defined(function(d) { return !isNaN(d[fieldName]); });

        innerG.append("path")
          .datum(data)
          .attr("class", "line-" + fieldName)
          .attr("fill", "none")
          .attr("stroke", LINE_COLORS[fieldName])
          .attr("stroke-width", 1.5)
          .attr("d", lineGen);
      })(field);
    }

    // legend
    var legendG = svg.append("g")
      .attr("transform", "translate(" + (MARGIN.left + 10) + "," + (MARGIN.top + 6) + ")");

    for (var li = 0; li < fields.length; li++) {
      var lg = legendG.append("g").attr("transform", "translate(" + li * 70 + ",0)");
      lg.append("line")
        .attr("x1", 0).attr("x2", 16).attr("y1", 6).attr("y2", 6)
        .attr("stroke", LINE_COLORS[fields[li]])
        .attr("stroke-width", 2);
      lg.append("text")
        .attr("x", 20).attr("y", 10)
        .attr("font-size", 11)
        .attr("fill", "#333")
        .text(fields[li]);
    }

    // tooltip div
    var tooltip = d3.select("body").select(".lc-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body").append("div")
        .attr("class", "lc-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.75)")
        .style("color", "#fff")
        .style("padding", "6px 10px")
        .style("border-radius", "6px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("display", "none");
    }

    var bisect = d3.bisector(function(d) { return d.Date; }).left;

    scrollG.append("rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mousemove", function(event) {
        var mouseX = d3.pointer(event, this)[0];
        var dateAtMouse = xScale.invert(mouseX);
        var idx = bisect(data, dateAtMouse, 1);
        var d = data[Math.max(0, Math.min(idx, data.length - 1))];
        tooltip.style("display", "block")
          .html(
            "<b>" + d3.timeFormat("%b %d, %Y")(d.Date) + "</b><br/>" +
            "Open: $" + d.Open.toFixed(2) + "<br/>" +
            "High: $" + d.High.toFixed(2) + "<br/>" +
            "Low: $" + d.Low.toFixed(2) + "<br/>" +
            "Close: $" + d.Close.toFixed(2)
          )
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseleave", function() {
        tooltip.style("display", "none");
      });

    // zoom behavior - horizontal only
    var zoom = d3.zoom()
      .scaleExtent([0.5, 20])
      .on("zoom", function(event) {
        var t = event.transform;
        var newX = t.rescaleX(xScale);

        xAxisG.call(
          d3.axisBottom(newX).ticks(d3.timeMonth.every(3)).tickFormat(d3.timeFormat("%b %Y"))
        );
        xAxisG.selectAll("text")
          .attr("transform", "rotate(-40)")
          .style("text-anchor", "end")
          .attr("font-size", 10);

        for (var zi = 0; zi < fields.length; zi++) {
          (function(fieldName) {
            var newLine = d3.line()
              .x(function(d) { return newX(d.Date); })
              .y(function(d) { return yScale(d[fieldName]); })
              .defined(function(d) { return !isNaN(d[fieldName]); });
            innerG.select(".line-" + fieldName).attr("d", newLine(data));
          })(fields[zi]);
        }
      });

    scrollG.call(zoom);
  }

  return (
    <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />
  );
}
