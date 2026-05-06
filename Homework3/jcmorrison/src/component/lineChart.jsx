import * as d3 from "d3";
import {useEffect, useRef} from "react";
import {debounce} from "lodash";

// set these margins for preferred layout
const MARGIN = {left: 55, right: 20, top: 20, bottom: 50};

// colors for each of the four price lines, trying to align with seaborn from previous HW
// the colors are a bit off from previous HW to make them more clearly different
const LINE_COLORS = {
  Open: "#14579e",
  High: "#238815",
  Low: "#aa2c2e",
  Close: "#ce8d4d",
};

export default function LineChart({selectedStock}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  // store loaded data and container size for resize and stock change trigger redraws
  const dataRef = useRef(null);
  const dimsRef = useRef({width: 0, height: 0});

  // load new CSV
  useEffect(() => {
    dataRef.current = null;
    d3.csv("/stockdata/" + selectedStock + ".csv", function(row) {
      return {
        Date: new Date(row.Date),
        Open: +row.Open,
        High: +row.High,
        Low: +row.Low,
        Close: +row.Close,
      };
    }).then(function(data) {
      dataRef.current = data;
      var dims = dimsRef.current;
      if (dims.width && dims.height) {
        drawChart(svgRef.current, data, dims.width, dims.height);
      }
    }).catch(function() {
      // show if CSV not found
      drawEmpty(svgRef.current, dimsRef.current.width, dimsRef.current.height, selectedStock);
    });
  }, [selectedStock]);

  // container resize and redraw
  useEffect(() => {
    if (!containerRef.current) return;

    var observer = new ResizeObserver(
      debounce(function(entries) {
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          var width = entry.contentRect.width;
          var height = entry.contentRect.height;
          dimsRef.current = {width: width, height: height};
          if (dataRef.current && width && height) {
            drawChart(svgRef.current, dataRef.current, width, height);
          }
        }
      }, 80)
    );

    observer.observe(containerRef.current);
    return function() {observer.disconnect();};
  }, []);

  return (
    <div ref={containerRef} style={{width: "100%", height: "100%", overflow: "hidden"}}>
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}

// show when the CSV file not been placed yet
function drawEmpty(svgEl, width, height, ticker) {
  if (!svgEl || !width || !height) return;
  var svg = d3.select(svgEl);
  svg.selectAll("*").remove();
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .attr("fill", "#757575")
    .attr("font-size", 13)
    .text("Place " + ticker + ".csv in data/stockdata/ to load this chart");
}

function drawChart(svgEl, data, width, height) {
  if (!svgEl || !width || !height || !data || data.length === 0) return;

  var svg = d3.select(svgEl);
  svg.selectAll("*").remove();

  var fields = ["Open", "High", "Low", "Close"];
  var innerH = height - MARGIN.top - MARGIN.bottom;

  // x scale based on date range in CSV
  var xScale = d3.scaleTime()
    .domain(d3.extent(data, function(d) { return d.Date; }))
    .range([0, width - MARGIN.left - MARGIN.right]);

  // y scale based on all four price fields
  var allValues = [];
  for (var i = 0; i < data.length; i++) {
    allValues.push(data[i].Open, data[i].High, data[i].Low, data[i].Close);
  }
  var yScale = d3.scaleLinear()
    .domain([d3.min(allValues) * 0.98, d3.max(allValues) * 1.02])
    .range([innerH, 0]);

  // clip path keeps inside chart area during zoom
  svg.append("defs").append("clipPath").attr("id", "lc-clip")
    .append("rect")
    .attr("width", width - MARGIN.left - MARGIN.right)
    .attr("height", innerH);

  // group for axes that stays fixed
  var axesG = svg.append("g")
    .attr("transform", "translate(" + MARGIN.left + "," + MARGIN.top + ")");

  axesG.append("g")
    .call(d3.axisLeft(yScale).ticks(6).tickFormat(function(d) { return "$" + d3.format(",.0f")(d); }));

  axesG.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -42)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("fill", "#797979")
    .text("Price (USD)");

  svg.append("text")
    .attr("x", MARGIN.left + (width - MARGIN.left - MARGIN.right) / 2)
    .attr("y", height - 4)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("fill", "#797979")
    .text("Date");

  // scrollable group holds lines and x axis
  var scrollG = svg.append("g")
    .attr("transform", "translate(" + MARGIN.left + "," + MARGIN.top + ")")
    .attr("clip-path", "url(#lc-clip)");

  var innerG = scrollG.append("g");

  // x axis inside scrollable group
  var xAxisG = innerG.append("g")
    .attr("transform", "translate(0," + innerH + ")")
    .call(d3.axisBottom(xScale).ticks(d3.timeMonth.every(3)).tickFormat(d3.timeFormat("%b %Y")));
  xAxisG.selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end")
    .attr("font-size", 10);

  // one line per price field
  for (var f = 0; f < fields.length; f++) {
    var field = fields[f];
    (function(fieldName) {
      var lineGen = d3.line()
        .x(function(d) {return xScale(d.Date);})
        .y(function(d) {return yScale(d[fieldName]);})
        .defined(function(d) {return !isNaN(d[fieldName]);});

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

  var bisect = d3.bisector(function(d) {return d.Date;}).left;

  // catch mouse events for tooltip
  scrollG.append("rect")
    .attr("width", width - MARGIN.left - MARGIN.right)
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
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseleave", function() {
      tooltip.style("display", "none");
    });

  // zoom behavior, allows horizontal only and applied to scroll group
  // trying to reference the d3.zoom tutorial from github.com/d3/d3-zoom
  var zoom = d3.zoom()
    .scaleExtent([0.5, 20])
    .on("zoom", function(event) {
      var t = event.transform;
      var newX = t.rescaleX(xScale);

      // update x axis tick positions
      xAxisG.call(
        d3.axisBottom(newX).ticks(d3.timeMonth.every(3)).tickFormat(d3.timeFormat("%b %Y"))
      );
      xAxisG.selectAll("text")
        .attr("transform", "rotate(-40)")
        .style("text-anchor", "end")
        .attr("font-size", 10);

      // update each line path to new x scale
      for (var zi = 0; zi < fields.length; zi++) {
        (function(fieldName) {
          var newLine = d3.line()
            .x(function(d) {return newX(d.Date);})
            .y(function(d) {return yScale(d[fieldName]);})
            .defined(function(d) {return !isNaN(d[fieldName]);});
          innerG.select(".line-" + fieldName).attr("d", newLine(data));
        })(fields[zi]);
      }
    });

  scrollG.call(zoom);
}
