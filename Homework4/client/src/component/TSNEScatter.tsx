import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface TSNERow {
  ticker: string;
  x: number;
  y: number;
  sector: string;
}

interface ApiTSNERow {
  Stock: string;
  x: number;
  y: number;
  sector?: string;
}

const API_BASE = "http://127.0.0.1:8000";

const MARGIN = {
  top: 16,
  right: 16,
  bottom: 40,
  left: 50,
};

const SECTOR_COLORS: Record<string,string> = {
  Technology:"#60a5fa",
  Financials:"#34d399",
  Healthcare:"#f472b6",
  "Consumer Discretionary":"#fbbf24",
  Energy:"#fb923c",
  Industrials:"#a78bfa",
  "Consumer Staples":"#86efac",
  Communication:"#67e8f9",
  Transportation:"#94a3b8",
  Other:"#9ca3af",
};

const STOCK_SECTORS: Record<string,string> = {
  AAPL:"Technology",
  MSFT:"Technology",
  NVDA:"Technology",

  META:"Communication",
  GOOGL:"Communication",

  JPM:"Financials",
  GS:"Financials",
  BAC:"Financials",

  JNJ:"Healthcare",
  PFE:"Healthcare",
  UNH:"Healthcare",

  XOM:"Energy",
  CVX:"Energy",
  HAL:"Energy",

  CAT:"Industrials",
  MMM:"Industrials",

  KO:"Consumer Staples",

  MCD:"Consumer Discretionary",
  NKE:"Consumer Discretionary",

  DAL:"Transportation",
};

function sectorColor(sector:string){
  return SECTOR_COLORS[sector]
    ?? SECTOR_COLORS.Other;
}

export default function TSNEScatter({
  selectedStock,
  onSelectStock,
}:{
  selectedStock:string;
  onSelectStock:(s:string)=>void;
}){

  const containerRef =
    useRef<HTMLDivElement>(null);

  const svgRef =
    useRef<SVGSVGElement>(null);

  const [data,setData] =
    useState<TSNERow[]>([]);

  const [error,setError] =
    useState<string|null>(null);

  useEffect(()=>{

    setError(null);

    fetch(`${API_BASE}/tsne/`)
      .then((res)=>{

        if(!res.ok){

          throw new Error(
            "Could not load t-SNE"
          );

        }

        return res.json();

      })

      .then((result)=>{

        const rows:TSNERow[]=
          (result.data ?? result)
          .map((d:ApiTSNERow)=>({

            ticker:d.Stock,

            x:Number(d.x),

            y:Number(d.y),

            sector:
              d.sector
              ??
              STOCK_SECTORS[d.Stock]
              ??
              "Other",

          }));

        setData(rows);

      })

      .catch(()=>{

        setError(
          "Could not load t-SNE data"
        );

      });

  },[]);

  useEffect(()=>{

    if(
      !svgRef.current
      ||
      !containerRef.current
      ||
      data.length===0
    ){
      return;
    }

    const W =
      containerRef.current.clientWidth;

    const H =
      containerRef.current.clientHeight;

    const innerW=
      W-MARGIN.left-MARGIN.right;

    const innerH=
      H-MARGIN.top-MARGIN.bottom;

    const svg=
      d3.select(svgRef.current);

    svg.selectAll("*").remove();

    svg
      .attr("width",W)
      .attr("height",H);

    const g=
      svg
      .append("g")
      .attr(
        "transform",
        `translate(
          ${MARGIN.left},
          ${MARGIN.top}
        )`
      );

    const xExtent=
      d3.extent(
        data,
        d=>d.x
      ) as [number,number];

    const yExtent=
      d3.extent(
        data,
        d=>d.y
      ) as [number,number];

    const xScale=
      d3.scaleLinear()
      .domain(xExtent)
      .range([0,innerW]);

    const yScale=
      d3.scaleLinear()
      .domain(yExtent)
      .range([innerH,0]);

    g.append("g")
      .attr(
        "transform",
        `translate(0,${innerH})`
      )
      .call(
        d3.axisBottom(xScale)
      );

    g.append("g")
      .call(
        d3.axisLeft(yScale)
      );

    g.selectAll("circle")
      .data(data)
      .join("circle")

      .attr(
        "cx",
        d=>xScale(d.x)
      )

      .attr(
        "cy",
        d=>yScale(d.y)
      )

      .attr(
        "r",
        d=>

        d.ticker===
        selectedStock

        ?10
        :6

      )

      .attr(
        "fill",
        d=>
        sectorColor(
          d.sector
        )
      )

      .attr(
        "stroke",
        d=>

        d.ticker===
        selectedStock

        ?"black"
        :"none"

      )

      .attr(
        "stroke-width",
        2
      )

      .style(
        "cursor",
        "pointer"
      )

      .on(
        "click",
        (_,d)=>{

          onSelectStock(
            d.ticker
          );

        }
      );

    g.selectAll(
      ".stock-label"
    )

    .data(
      data.filter(

        d=>

        d.ticker===
        selectedStock

      )
    )

    .join("text")

    .attr(
      "class",
      "stock-label"
    )

    .attr(
      "x",
      d=>
      xScale(d.x)+12
    )

    .attr(
      "y",
      d=>
      yScale(d.y)+4
    )

    .text(
      d=>d.ticker
    )

    .style(
      "font-size",
      "11px"
    )

    .style(
      "font-weight",
      "700"
    );

  },[
    data,
    selectedStock,
    onSelectStock
  ]);

  const sectors=
    Array.from(
      new Set(
        data.map(
          d=>d.sector
        )
      )
    );

  return(

    <div
      ref={containerRef}
      className="
      relative
      w-full
      h-full
      bg-white"
    >

      {error && (

        <div
          className="
          absolute
          inset-0
          flex
          items-center
          justify-center
          text-red-600"
        >

          {error}

        </div>

      )}

      <svg
        ref={svgRef}
        className="
        w-full
        h-full"
      />

      <div
        className="
        absolute
        top-2
        right-2
        bg-white
        border
        rounded
        p-2
        shadow"
      >

        {sectors.map((s)=>(

          <div
            key={s}
            className="
            flex
            items-center
            gap-2"
          >

            <span
              style={{
                background:
                sectorColor(s)
              }}
              className="
              w-3
              h-3
              rounded-full"
            />

            <span
              className="
              text-xs"
            >

              {s}

            </span>

          </div>

        ))}

      </div>

    </div>

  );

}