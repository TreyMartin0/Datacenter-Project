# When Communities Push Back: Public Resistance to the Data Center Boom

Artificial intelligence has rapidly transformed from a niche technology into a major driver of economic investment, and behind every AI system is an enormous amount of computing infrastructure. As AI demand grows, so does the need for data centers. What was once concentrated in a handful of technology hubs is now spreading into urban areas, suburban communities, and rural regions alike [1].

<style>
:root {
  --dc-empty: #e8e8e8;
  --dc-state-line: #aaa;
  --dc-hover-line: #333;
  --dc-select-line: #000;
  --dc-map-state-bg: #f5f5f0;
  --dc-card: #f7f7f7;
  --dc-card-alt: #eeeeee;
  --dc-border: #dddddd;
  --dc-text-strong: #111111;
  --dc-text-muted: #666666;
  --dc-text-faint: #999999;
  --dc-op-chip-bg: #e8e8e8;
  --dc-op-chip-border: #cccccc;
  --dc-op-chip-text: #222222;
  --dc-pb-card: #fff5f5;
  --dc-pb-border: #c92a2a;
  --dc-pb-accent: #c92a2a;
  --dc-pb-inner: #fdf0f0;
  --dc-pb-inner-border: #e8b4b4;
  --dc-pb-badge-bg: #ffe0e0;
  --dc-pb-badge-border: #e8b4b4;
  --dc-pb-badge-text: #c92a2a;
  --dc-pb-link-petition: #c92a2a;
  --dc-pb-link-group: #1971c2;
  --dc-pb-link-news: #555555;
  --dc-separator: #dddddd;
  --dc-legend-text: #666666;
  --dc-vl-text: #222222;
  --dc-tooltip-bg: #ffffff;
  --dc-tooltip-border: #cccccc;
  --dc-tooltip-text: #222222;
  --dc-boundary-fill: #1a1a1a;
  --dc-boundary-stroke: #888888;
  --dc-size-line: #555555;
  --dc-btn-bg: #e8e8e8;
  --dc-btn-text: #111111;
  --dc-btn-border: #cccccc;
  --dc-btn-active-bg: #1976d2;
}

@media (prefers-color-scheme: dark) {
  :root {
    --dc-empty: #2d2d2d;
    --dc-state-line: #666666;
    --dc-hover-line: #bbbbbb;
    --dc-select-line: #ffffff;
    --dc-map-state-bg: #2a2a2a;
    --dc-card: #0d0d0d;
    --dc-card-alt: #111111;
    --dc-border: #2a2a2a;
    --dc-text-strong: #ffffff;
    --dc-text-muted: #aaaaaa;
    --dc-text-faint: #666666;
    --dc-op-chip-bg: #1a1a1a;
    --dc-op-chip-border: #333333;
    --dc-op-chip-text: #e8e8e8;
    --dc-pb-card: #1a0505;
    --dc-pb-border: #c92a2a;
    --dc-pb-accent: #ff6b6b;
    --dc-pb-inner: #120808;
    --dc-pb-inner-border: #3a1010;
    --dc-pb-badge-bg: #1e0c0c;
    --dc-pb-badge-border: #5c2020;
    --dc-pb-badge-text: #ffb3b3;
    --dc-pb-link-petition: #ff8787;
    --dc-pb-link-group: #74c0fc;
    --dc-pb-link-news: #adb5bd;
    --dc-separator: #333333;
    --dc-legend-text: #aaaaaa;
    --dc-vl-text: #ffffff;
    --dc-tooltip-bg: #1a1a1a;
    --dc-tooltip-border: #444444;
    --dc-tooltip-text: #e8e8e8;
    --dc-boundary-fill: #f8f8f8;
    --dc-boundary-stroke: #555555;
    --dc-size-line: #aaaaaa;
    --dc-btn-bg: #2a2a2a;
    --dc-btn-text: #e8e8e8;
    --dc-btn-border: #444444;
    --dc-btn-active-bg: #1976d2;
  }
}
</style>

```js

const vl = vegaLiteApi.register(vega, vegaLite);

import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import JSZip from "npm:jszip";
import * as topojson from "npm:topojson-client";



```

```js
// Reactive dark-mode signal — any cell that references darkMode will re-render on OS theme change
const darkMode = Generators.observe(notify => {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  notify(mq.matches);
  mq.addEventListener("change", (e) => notify(e.matches));
});
```

```js
const mapData = (await FileAttachment("data/facilities.json").json())
  .filter((d) => ["Operating", "Proposed"].includes(d.status));
const usTopo = await FileAttachment("data/counties-10m.json").json();
const mwMax = d3.max(mapData, (d) => d.mw);
```

```js
const showProposed = Mutable(false);
const toggleProposed = () => (showProposed.value = !showProposed.value);
```

```js
const facilitiesShown = showProposed
  ? mapData
  : mapData.filter((d) => d.status !== "Proposed");
```

```js
const _vlStateBg = darkMode ? "#f5f5f0" : "#2a2a2a";
const _vlText    = darkMode ? "#ffffff" : "#222222";

const chart = vl.layer(
  vl.markGeoshape({ fill: _vlStateBg, stroke: "#bbb", strokeWidth: 0.5 })
    .data(vl.topojson(usTopo).feature("states")),
  vl.markCircle({ opacity: 0.8, stroke: "white", strokeWidth: 0.6 })
    .data(facilitiesShown)
    .encode(
      vl.longitude().fieldQ("long"),
      vl.latitude().fieldQ("lat"),
      vl.size().fieldQ("mw")
        .scale({ domain: [0, mwMax], range: [60, 900], type: "sqrt" })
        .legend({ title: "Power (MW)" }),
      vl.color().fieldN("status")
        .scale({
          domain: ["Operating", "Proposed"],
          range: ["#2b7a3d", "#d97706"]
        })
        .legend({ title: "Status" }),
      vl.tooltip([
        { field: "name", title: "Facility" },
        { field: "operator", title: "Operator" },
        { field: "state", title: "State" },
        { field: "county", title: "County" },
        { field: "status", title: "Status" },
        { field: "mw", title: "Power (MW)", format: "," },
        { field: "sizeSqft", title: "Size (sqft)", format: "," }
      ])
    )
)
  .project({ type: "albersUsa" })
  .width(885).height(560)
  .background("transparent")
  .config({
    legend: { labelColor: _vlText, titleColor: _vlText }
  })
  .title({ text: "U.S. Data Centers", color: _vlText, fontSize: 24 });

display(await chart.render());
```

```js
display(html`<button
  onclick=${toggleProposed}
  style="
    display: block;
    margin: 16px auto;
    padding: 14px 32px;
    font-size: 1.05em;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: ${showProposed ? "#fff" : "var(--dc-btn-text)"};
    background: ${showProposed ? "#dd831b" : "var(--dc-btn-bg)"};
    border: 2px solid ${showProposed ? "#f08f20" : "var(--dc-btn-border)"};
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
  "
>${showProposed ? "Hide proposed facilities" : "Show proposed facilities"}</button>`);
```
The map above illustrates both existing and proposed data centers across the United States. While existing facilities are already widespread, the number of proposed projects demonstrates that expansion is far from over. The growth of AI has created unprecedented demand for computing power, leading technology companies and developers to pursue new facilities at an accelerating pace. [2]

However, the expansion of data centers has not been universally welcomed.

Many residents view data centers as a source of concern rather than opportunity. Critics point to the large amounts of electricity and water these facilities consume, their potential environmental impacts, and the strain they can place on local infrastructure. Others question whether communities should bear these costs in order to support technologies that primarily benefit large corporations. Concerns about artificial intelligence itself, including its societal impacts, labor implications, and energy consumption, have further fueled opposition. [3]

```js
const gallupData = [
  { label: "Strongly favor",  pct: 7,  color: d3.schemeCategory10[2] },
  { label: "Somewhat favor",  pct: 20, color: d3.schemeCategory10[0] },
  { label: "Somewhat oppose", pct: 23, color: d3.schemeCategory10[1] },
  { label: "Strongly oppose", pct: 48, color: d3.schemeCategory10[3] },
];

const gWidth = 700, gHeight = 140, barHeight = 44;
const margin = { left: 50, right: 20 };
const innerWidth = gWidth - margin.left - margin.right;

const gSvg = d3.create("svg")
  .attr("width", gWidth)
  .attr("height", gHeight);

// Legend
const legend = gSvg.append("g").attr("transform", "translate(0, 10)");
const legendSpacing = [0, 140, 290, 455];
gallupData.forEach((d, i) => {
  legend.append("rect")
    .attr("x", legendSpacing[i]).attr("y", 0)
    .attr("width", 14).attr("height", 14)
    .attr("rx", 2).attr("fill", d.color);
  legend.append("text")
    .attr("x", legendSpacing[i] + 18).attr("y", 11)
    .attr("font-size", 14)
    .attr("fill", "currentColor")
    .text(`% ${d.label}`);
});

// Year label
gSvg.append("text")
  .attr("x", 0).attr("y", 58 + barHeight / 2 + 5)
  .attr("font-size", 13).attr("font-weight", "bold")
  .attr("fill", "currentColor")
  .text("2026");

// Stacked bar
let xOffset = margin.left;
const barRects = [];

gallupData.forEach((d, i) => {
  const w = (d.pct / 100) * innerWidth;
  const rect = gSvg.append("rect")
    .attr("x", xOffset).attr("y", 58)
    .attr("width", w).attr("height", barHeight)
    .attr("fill", d.color)
    .style("cursor", "pointer");
  barRects.push(rect);
  gSvg.append("text")
    .attr("x", xOffset + 8).attr("y", 58 + barHeight / 2 + 5)
    .attr("font-size", 13).attr("font-weight", "bold")
    .attr("fill", "white")
    .text(d.pct);
  xOffset += w;
});

// Hover interactions
barRects.forEach((rect, i) => {
  rect
    .on("mouseover", () => {
      barRects.forEach((r, j) => {
        r.attr("opacity", j === i ? 1 : 0.3);
      });
    })
    .on("mouseout", () => {
      barRects.forEach(r => r.attr("opacity", 1));
    });
});

// Caption
gSvg.append("text")
  .attr("x", 0).attr("y", gHeight - 20)
  .attr("font-size", 15).attr("fill", "currentColor")
  .text("Source: Jones, J. M. (2026, May 13). Americans oppose AI data centers in their area. Gallup.");

gSvg.append("text")
  .attr("x", 0).attr("y", gHeight - 5)
  .attr("font-size", 15).attr("fill", "currentColor")
  .text("https://news.gallup.com/poll/709772/americans-oppose-data-centers-area.aspx");

display(gSvg.node());
```

As shown above, a substantial majority of Americans oppose having data centers built in their communities. [1] The question is whether that opposition actually matters. Developers often possess significant financial resources and political influence, yet public meetings, community organizing, and local government decisions can all affect the outcome of proposed developments. 

The final map highlights where proposed data centers have faced pushback alongside projects that were ultimately canceled. Areas with the most opposition (through available data) reside in the same counties where projects were later halted. [4] Not all hope is lost; communities that organize can realise change that meets the needs of people over the needs of corporations.

---

```js

import JSZip from "npm:jszip";
const countyPlacesZip = await FileAttachment("./data/county_places.zip").blob();

// Load county facility records and U.S. county/state geometry
const counties = await FileAttachment("data/data_prep.json").json();
const us = await FileAttachment("data/counties-10m.json").json();

// Index county records by FIPS code for fast lookups during map rendering
const countyByFips = new Map(counties.map((c) => [c.fips, c]));
// Convert TopoJSON topology into individual GeoJSON county polygons
const countyFeatures = topojson.feature(us, us.objects.counties).features;
// Build a mesh of state borders (shared edges only) for the border overlay
const stateMesh = topojson.mesh(us, us.objects.states, (a, b) => a !== b);

const selectedState = {
  fips: null,
  countyData: null,
  renderLocal: null,
  renderCountyDetails: null,
  updateSelectionOutline: null
};

const medSqft = d3.median(counties.flatMap(c => c.facilities), d => d.sqft);

let zipCache = null;

async function setSelected(fips) {
  selectedState.fips = fips;

  if (fips) {
    if (!zipCache) {
      zipCache = await JSZip.loadAsync(countyPlacesZip);
    }
    selectedState.countyData = JSON.parse(await zipCache.file(`${fips}.json`).async("string"));
  } else {
    selectedState.countyData = null;
  }

  selectedState.renderLocal?.();
  selectedState.updateSelectionOutline?.();
  selectedState.renderCountyDetails?.();

}

// Radio input that controls which data field colors the map
const measure = view(Inputs.radio(
  new Map([
    ["Total facilities",   "total"],
    ["Total megawatts",    "mwTotal"],
    ["Proposed",           "proposed"],
    ["Operating",          "operating"],
    ["Cancelled",          "cancelled"],
    ["Community pushback", "pushbackCount"],
  ]),
  { value: "total", label: "Color counties by:" }
));



const metrics = [
  { key: "income", label: "Median household income", census: "B19013_001E", format: d3.format("$,") },
  { key: "rent", label: "Median gross rent", census: "B25064_001E", format: d3.format("$,") },
  { key: "homeValue", label: "Median home value", census: "B25077_001E", format: d3.format("$,") },
  { key: "population", label: "Population", census: "B01003_001E", format: d3.format(",") }
]
```

```js
// Collect non-zero values for the active measure to set the color scale domain
const measureValues = counties.map((c) => c[measure]).filter((v) => v > 0);
// Cancelled uses a flat binary color instead of a gradient scale
const isBinary = measure === "cancelled";
const cancelledColor = "#c92a2a";

// Find the maximum value to anchor the high end of the color scale
const maxVal = d3.max(measureValues) ?? 1;
// Log scale so high-outlier counties don't wash out all other variation
const color = isBinary
  ? null
  : d3.scaleSequentialLog(d3.interpolateYlOrRd).domain([1, maxVal]).clamp(true);

// Legend
const legendNode = (() => {
  const svg = d3.create("svg").attr("height", 30);
  if (isBinary) {
    // Single colored square + label for the binary cancelled view
    svg.attr("width", 180);
    svg.append("rect").attr("x", 0).attr("y", 0).attr("width", 14).attr("height", 14).attr("rx", 3).attr("fill", cancelledColor);
    svg.append("text").attr("x", 20).attr("y", 11).attr("font-size", 11).attr("fill", "currentColor").text("Has cancelled facilities");
  } else {
    // Gradient bar from low (yellow) to high (dark red) with labeled endpoints
    const w = 240, h = 12;
    svg.attr("width", w + 60);
    const grad = svg.append("defs").append("linearGradient").attr("id", "leg-grad");
    d3.range(0, 1.01, 0.1).forEach((t) => {
      grad.append("stop").attr("offset", `${t * 100}%`).attr("stop-color", d3.interpolateYlOrRd(t));
    });
    svg.append("rect").attr("x", 0).attr("y", 0).attr("width", w).attr("height", h).attr("fill", "url(#leg-grad)");
    svg.append("text").attr("x", 0).attr("y", h + 14).attr("font-size", 11).attr("fill", "currentColor").text("low");
    svg.append("text").attr("x", w).attr("y", h + 14).attr("font-size", 11).attr("fill", "currentColor").attr("text-anchor", "end").text(`high (max ${maxVal.toLocaleString()})`);
  }
  return svg.node();
})();
display(legendNode);
```

```js
// Standard Albers USA canvas size matching the us-atlas projection
const _emptyFill  = darkMode ? "#e8e8e8" : "#2d2d2d";
const _stateLine  = darkMode ? "#aaaaaa" : "#666666";
const _hoverLine  = darkMode ? "#333333" : "#bbbbbb";
const _selectLine = darkMode ? "#000000" : "#ffffff";

const width = 975;
const height = 610;
// Albers USA projection
const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
// Path generator that converts GeoJSON coordinates to SVG path strings
const path = d3.geoPath(projection);

// Resolve the currently selected county object, or null if none selected
const selected = selectedState.fips ? countyByFips.get(selectedState.fips) : null;

// Create the root SVG element
const svg = d3.create("svg")
  .attr("viewBox", [0, 0, width, height])
  .attr("width", width)
  .attr("style", "max-width: 100%; height: auto;");

let hoverPath;

// Draw one path per county, colored by the active measure
svg.append("g")
  .selectAll("path")
  .data(countyFeatures)
  .join("path")
    .attr("d", path)
    .attr("fill", (d) => {
      const rec = countyByFips.get(String(d.id).padStart(5, "0"));
      const v = rec ? rec[measure] : 0;
      // Counties with no data get a neutral fill
      if (v <= 0) return _emptyFill;
      // Cancelled uses a flat red
      return isBinary ? cancelledColor : color(v);
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.2)
    .style("cursor", (d) => {
      const rec = countyByFips.get(String(d.id).padStart(5, "0"));
      return (rec && rec[measure] > 0) ? "pointer" : "default";
    })
    .on("mouseover", (event, d) => {
      const fips = String(d.id).padStart(5, "0");
      const rec = countyByFips.get(fips);
      if (!rec || rec[measure] <= 0) return;
      if (selectedState.fips === fips) return;
      hoverPath?.datum(d).attr("d", path);
    })
    .on("mouseout", () => hoverPath?.attr("d", null))
    .on("click", async (event, d) => {
      const fips = String(d.id).padStart(5, "0");
      const rec = countyByFips.get(fips);
      const v = rec ? rec[measure] : 0;

      if (v <= 0) return;

      hoverPath?.attr("d", null);
      await setSelected(
        selectedState.fips === fips ? null : fips
      );
    })
    .append("title")
      // Native browser tooltip shown on hover
      .text((d) => {
        const rec = countyByFips.get(String(d.id).padStart(5, "0"));
        const v = rec ? rec[measure] : 0;
        if (v <= 0) return "";
        return `${rec.name}\n${rec.total} facilities · ${rec.mwTotal.toLocaleString()} MW\n${rec.pushbackCount > 0 ? `${rec.pushbackCount} with community pushback` : "no recorded pushback"}`;
      });

  function updateSelectionOutline() {
  svg.selectAll(".selected-county").remove();
  if (selectedState.fips) {
    svg.append("path")
      .datum(countyFeatures.find(d => String(d.id).padStart(5, "0") === selectedState.fips))
      .attr("class", "selected-county")
      .attr("fill", "none")
      .attr("stroke", _selectLine)
      .attr("stroke-width", 2.5)
      .attr("d", path);
  }
}
selectedState.updateSelectionOutline = updateSelectionOutline;

  // Draw outline around the selected county on top of the fill layer
  if (selected) {
    svg.append("path")
        .datum(countyFeatures.find((d) => String(d.id).padStart(5, "0") === selected.fips))
        .attr("class", "selected-county")
        .attr("fill", "none")
        .attr("stroke", _selectLine)
        .attr("stroke-width", 2.5)
        .attr("d", path);
  }

// Draw state border lines on top of county fills
svg.append("path")
    .datum(stateMesh)
    .attr("fill", "none")
    .attr("stroke", _stateLine)
    .attr("stroke-width", 0.7)
    .attr("stroke-linejoin", "round")
    .attr("d", path);

// Hover outline — rendered above state borders, below the selection outline
hoverPath = svg.append("path")
    .attr("class", "hover-county")
    .attr("fill", "none")
    .attr("stroke", _hoverLine)
    .attr("stroke-width", 1.5)
    .attr("pointer-events", "none");

display(svg.node());

// Format helpers for displaying megawatts and acreage in the detail card
const fmtMW = (n) => n == null ? "—" : `${Number(n).toLocaleString()} MW`;
const fmtAcres = (n) => n == null ? null : `${Number(n).toLocaleString()} acres`;

// Returns a color hex for each facility status string
const statusColor = (s) => {
  const x = (s || "").toLowerCase();
  if (x.includes("operating")) return "#2b8a3e";
  if (x.includes("construction") || x.includes("permitted")) return "#e8590c";
  if (x.includes("proposed")) return "#1971c2";
  if (x.includes("cancel")) return "#868e96";
  if (x.includes("suspend")) return "#a61e4d";
  return "#555";
};
// Renders a colored pill badge for a facility's status string
const statusBadge = (s) => html`<span style="display:inline-block; padding:2px 8px; border-radius:10px; font-size:0.78em; background:${statusColor(s)}; color:white;">${(s || "—").replace("Approved/Permitted/Under construction", "Under construction")}</span>`;

// Maps each measure key to a status filter keyword and a human-readable card label
const measureMeta = {
  total:        { filter: null,        label: "Largest facility" },
  mwTotal:      { filter: null,        label: "Highest-capacity facility" },
  proposed:     { filter: "proposed",  label: "Largest proposed facility" },
  operating:    { filter: "operating", label: "Largest operating facility" },
  cancelled:    { filter: "cancel",    label: "Largest cancelled facility" },
  pushbackCount:{ filter: "pushback",  label: "Contested facility" },
};

const globalMaxSqft = d3.max(counties.flatMap(c => c.facilities), d => d.sqft) ?? 1000000;
const sqftScale = d3.scaleSqrt(2)
  .domain([0, globalMaxSqft])
  .range([10, 30]);

// Picks the most relevant facility to spotlight based on the active measure
function pickSpotlight(facilities, measure) {
  const meta = measureMeta[measure] ?? measureMeta.total;
  let pool = facilities;
  if (meta.filter === "pushback") {
    // Rank contested facilities by richness of advocacy detail, then by MW
    pool = facilities.filter(f => f.pushback).sort((a, b) => {
      const score = f => (f.advocacyInfo ? 2 : 0) + (f.resistanceStatus ? 1 : 0) + (f.sources?.length > 0 ? 1 : 0);
      return score(b) - score(a) || (b.mw ?? 0) - (a.mw ?? 0);
    });
  } else if (meta.filter) {
    // Filter to only facilities matching the active status keyword
    pool = facilities.filter(f => f.status?.toLowerCase().includes(meta.filter));
  }
  // Fall back to full list if no facilities match the filter
  if (!pool.length) pool = facilities;
  // Return the largest facility by MW from the filtered pool
  return pool.slice().sort((a, b) => (b.mw ?? 0) - (a.mw ?? 0))[0] ?? null;
}

const countyDetails = html`<div></div>`;

function renderCountyDetails() {
  const selected = selectedState.fips
    ? countyByFips.get(selectedState.fips)
    : null;

  countyDetails.replaceChildren();

  if (!selected) {
    countyDetails.append(html`
      <p style="color:var(--dc-text-muted);">
        <em>Hover any colored county for a quick read. Click a county to see operators and the spotlight facility.</em>
      </p>
    `);
    return;
  }

  const sp = pickSpotlight(selected.facilities, measure);
  const ops = selected.operators.filter((o) => o.name !== "Unknown").slice(0, 6);
  const unknownGroup = selected.operators.find((o) => o.name === "Unknown");
  const namedCount = selected.operators.filter((o) => o.name !== "Unknown").length;

  countyDetails.append(html`
    <div style="margin-top: 1em;">
      <h2 style="margin: 0;">${selected.name}</h2>
      <p style="margin: 4px 0 14px 0; color:var(--dc-text-muted); font-size:0.95em;">
        <strong style="color:var(--dc-text-strong);">${selected.total}</strong> facilities ·
        <strong style="color:var(--dc-text-strong);">${selected.mwTotal.toLocaleString()} MW</strong> ·
        ${selected.operating} operating ·
        ${selected.proposed} proposed ·
        ${selected.pushbackCount > 0
          ? html`<strong style="color:var(--dc-pb-accent);">${selected.pushbackCount} with community pushback</strong>`
          : html`<span style="color:var(--dc-text-faint);">no recorded pushback</span>`}
      </p>

      <div style="margin-bottom: 16px;">
        <div style="font-size:0.8em; color:var(--dc-text-muted); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;">Top operators in this county</div>
        ${ops.map((o) => html`
          <span style="display:inline-block; padding:4px 10px; margin:0 6px 6px 0; background:var(--dc-op-chip-bg); border:1px solid var(--dc-op-chip-border); border-radius:14px; font-size:0.85em; color:var(--dc-op-chip-text);">
            <strong style="color:var(--dc-text-strong);">${o.name}</strong><span style="color:var(--dc-text-muted);"> · ${o.count}</span>
          </span>
        `)}
        ${unknownGroup ? html`<span style="color:var(--dc-text-faint); font-size:0.85em; margin-left:4px;">+ ${unknownGroup.count} unknown</span>` : ""}
        ${namedCount > 6 ? html`<span style="color:var(--dc-text-faint); font-size:0.85em; margin-left:8px;">+ ${namedCount - 6} more</span>` : ""}
      </div>

      ${sp ? html`
        <div style="border:1px solid ${sp.pushback ? "var(--dc-pb-border)" : "var(--dc-border)"}; border-radius:8px; overflow:hidden; background:var(--dc-card);">
          <div style="padding:10px 16px; background:${sp.pushback ? "var(--dc-pb-card)" : "var(--dc-card-alt)"}; border-bottom:1px solid ${sp.pushback ? "var(--dc-pb-border)" : "var(--dc-border)"}; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span style="font-size:0.7em; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:${sp.pushback ? "var(--dc-pb-accent)" : "var(--dc-text-faint)"};">
              ${sp.pushback ? "★ " : ""}${measureMeta[measure]?.label ?? "Spotlight"}
            </span>
            ${statusBadge(sp.status)}
          </div>

          <div style="padding:14px 16px 10px;">
            <h3 style="margin:0 0 6px 0; font-size:1.1em;">${sp.name || "Unnamed facility"}</h3>
            <div style="color:var(--dc-text-muted); font-size:0.88em; line-height:1.8;">
              ${[
                sp.operator ? html`<span style="color:var(--dc-text-muted);">${sp.operator}</span>` : null,
                sp.sizeRank ? html`<span>${sp.sizeRank}</span>` : null,
                sp.mw ? html`<span><strong style="color:var(--dc-text-strong);">${fmtMW(sp.mw)}</strong></span>` : null,
                sp.acres ? html`<span>${fmtAcres(sp.acres)}</span>` : null,
                sp.projectCost ? html`<span>${sp.projectCost}</span>` : null,
                sp.powerSource ? html`<span>Power: ${sp.powerSource}</span>` : null,
                sp.expectedOnline ? html`<span>Online: ${sp.expectedOnline}</span>` : null,
              ].filter(Boolean).reduce((acc, el, i) =>
                i === 0 ? [el] : [...acc, html`<span style="color:var(--dc-separator);"> · </span>`, el], []
              )}
            </div>
          </div>

          ${sp.pushback ? html`
            <div style="margin:0 16px 14px; padding:12px 14px; background:var(--dc-pb-inner); border:1px solid var(--dc-pb-inner-border); border-radius:6px;">
              <div style="font-size:0.7em; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--dc-pb-accent); margin-bottom:10px;">Community resistance</div>

              ${sp.advocacyInfo ? html`<p style="margin:0 0 10px 0; font-size:0.92em; line-height:1.6;">${sp.advocacyInfo}</p>` : ""}
              ${sp.otherInfo ? html`<p style="margin:0 0 10px 0; color:var(--dc-text-muted); font-size:0.87em; line-height:1.6; font-style:italic;">${sp.otherInfo}</p>` : ""}

              ${(sp.resistanceStatus || sp.nda) ? html`
                <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
                  ${sp.resistanceStatus ? html`
                    <span style="display:inline-flex; align-items:center; gap:5px; padding:3px 10px; background:var(--dc-pb-badge-bg); border:1px solid var(--dc-pb-badge-border); border-radius:12px; font-size:0.82em; color:var(--dc-pb-badge-text);">
                      <strong>Status:</strong> ${sp.resistanceStatus}
                    </span>` : ""}
                  ${sp.nda ? html`
                    <span style="display:inline-flex; align-items:center; gap:5px; padding:3px 10px; background:var(--dc-pb-badge-bg); border:1px solid var(--dc-pb-badge-border); border-radius:12px; font-size:0.82em; color:var(--dc-pb-badge-text);">
                      <strong>NDA:</strong> ${sp.nda}
                    </span>` : ""}
                </div>
              ` : ""}

              ${(sp.petitionUrl || sp.communityGroupUrl1 || sp.communityGroupUrl2 || (sp.sources && sp.sources.length)) ? html`
                <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:0.85em; padding-top:8px; border-top:1px solid var(--dc-pb-inner-border);">
                  ${sp.petitionUrl ? html`<a href="${sp.petitionUrl}" target="_blank" style="color:var(--dc-pb-link-petition); text-decoration:none;">✍ Petition</a>` : ""}
                  ${sp.communityGroupUrl1 ? html`<a href="${sp.communityGroupUrl1}" target="_blank" style="color:var(--dc-pb-link-group); text-decoration:none;">Community group →</a>` : ""}
                  ${sp.communityGroupUrl2 ? html`<a href="${sp.communityGroupUrl2}" target="_blank" style="color:var(--dc-pb-link-group); text-decoration:none;">Community group 2 →</a>` : ""}
                  ${sp.sources?.slice(0, 3).map((u, i) => html`<a href="${u}" target="_blank" style="color:var(--dc-pb-link-news); text-decoration:none;">News ${i + 1} →</a>`)}
                </div>
              ` : ""}
            </div>
          ` : sp.otherInfo ? html`
            <p style="margin:0 16px 14px; color:var(--dc-text-muted); font-size:0.87em; line-height:1.6;">${sp.otherInfo}</p>
          ` : ""}
        </div>
      ` : ""}
    </div>
  `);
}

selectedState.renderCountyDetails = renderCountyDetails;
renderCountyDetails();

display(countyDetails);

const statusPalette = {
  pushback: "#c92a2a",
  cancelled: "#868e96",
  inProgress: "#e8590c",
  operating: "#2b8a3e",
  proposed: "#ff0038",
  other: "#555"
};

function facilityStatusKey(d) {
  const s = (d.status || "").toLowerCase();

  if (s.includes("cancel")) return "cancelled";
  if (s.includes("construction") || s.includes("permitted") || s.includes("approved")) return "inProgress";
  if (s.includes("operating")) return "operating";
  if (s.includes("proposed")) return "proposed";

  return "other";
}

function facilityColor(d) {
  return statusPalette[facilityStatusKey(d)];
}

function facilityMatchesMeasure(d, measure) {
  const key = facilityStatusKey(d);

  if (measure === "total" || measure === "mwTotal") return true;
  if (measure === "pushbackCount") return d.pushback;
  if (measure === "cancelled") return key === "cancelled";
  if (measure === "operating") return key === "operating";
  if (measure === "proposed") return key === "proposed";
  if (measure === "inProgress") return key === "inProgress";

  return true;
}

const mapView = (() => {
  // Reference darkMode so this IIFE re-runs on every theme change
  const _btnBg     = darkMode ? "#2a2a2a" : "#e8e8e8";
  const _btnText   = darkMode ? "#e8e8e8" : "#111111";
  const _btnBorder = darkMode ? "#444444" : "#cccccc";
  const _boundaryFill   = darkMode ? "#f8f8f8" : "#1a1a1a";
  const _boundaryStroke = darkMode ? "#555555" : "#888888";
  const _sizeLine  = darkMode ? "#aaaaaa" : "#555555";

  // --- State ---
  
  let metricIndex = 0;

  // --- Container ---
  const container = html`<div style="font-family: sans-serif;margin-top:12px;">
  <div id="metric-btns" style="display:flex; gap:8px; margin-bottom:16px;"></div>

  <svg id="map" width="1200" height="550"></svg>

  <div id="tooltip" style="position:fixed; background:var(--dc-tooltip-bg); border:1px solid var(--dc-tooltip-border); color:var(--dc-tooltip-text);
    padding:6px 10px; border-radius:4px; font-size:13px; pointer-events:none; opacity:0;"></div>
</div>`;

  // --- Metric buttons ---
  const metricButtons = [];

  const metricContainer = container.querySelector("#metric-btns");
  metrics.forEach((m, i) => {
    const btn = document.createElement("button");
    btn.textContent = m.label;
    btn.style.cssText = "padding:4px 12px; cursor:pointer;";
  
    btn.addEventListener("click", () => {
      metricIndex = i;
      renderLocal();
    });
  
    metricButtons.push(btn);
    metricContainer.appendChild(btn);
  });


  const svg = d3.select(container.querySelector("#map"));
  const tooltip = d3.select(container.querySelector("#tooltip"));

  const defs = svg.append("defs");

  const pattern = defs.append("pattern")
  .attr("id", "no-data-pattern")
  .attr("patternUnits", "userSpaceOnUse")
  .attr("width", 8)
  .attr("height", 8)
  .attr("patternTransform", "rotate(45)");

pattern.append("rect")
  .attr("width", 8)
  .attr("height", 8)
  .attr("fill", "#eee");

pattern.append("line")
  .attr("x1", 0)
  .attr("y1", 0)
  .attr("x2", 0)
  .attr("y2", 8)
  .attr("stroke", "red")
  .attr("stroke-width", 2);


selectedState.renderLocal = renderLocal;

  function renderLocal() {
    svg.selectAll(".town").remove();
    svg.selectAll(".boundary").remove();
    svg.selectAll(".dc").remove();
    svg.selectAll(".legend").remove();
    tooltip.style("opacity", 0);

    const metric = metrics[metricIndex];

    metricButtons.forEach((btn, i) => {
      if (i === metricIndex) {
        btn.style.background = "#1976d2";
        btn.style.color = "white";
        btn.style.fontWeight = "bold";
        btn.style.border = "1px solid #1976d2";
      } else {
        btn.style.background = _btnBg;
        btn.style.color = _btnText;
        btn.style.fontWeight = "";
        btn.style.border = `1px solid ${_btnBorder}`;
      }
    });

    if (!selectedState.fips || !selectedState.countyData) {
      return;
    }

    const selectedCountyRecord = countyByFips.get(selectedState.fips);
    if (!selectedCountyRecord) return;

    const boundary = selectedState.countyData.county;
    const towns = selectedState.countyData.places;
    
    const dcs = selectedCountyRecord.facilities
    .filter(d =>
      d.lat != null &&
      d.lon != null &&
      facilityMatchesMeasure(d, measure)
    );


    const operatingDcs = selectedCountyRecord.facilities
      .filter(d => d.lat != null && d.lon != null);

    const sqft = d => (d.sqft == null || d.sqft === 0) ? medSqft : d.sqft;


    const projection = d3.geoMercator()
      .fitSize([900, 550], boundary);

    const path = d3.geoPath(projection);

    // --- Color scale ---
    const values = towns.features.map(f => f.properties[metric.key]).filter(v => v != null);
    const colorScale = d3.scaleSequential()
      .domain(d3.extent(values))
      .interpolator(d3.interpolateBlues);

    // --- Legend panel background ---
    svg.append("rect")
      .attr("class", "legend")
      .attr("x", 893).attr("y", 18)
      .attr("width", 295).attr("height", 515)
      .attr("fill", darkMode ? "rgba(18,18,18,0.88)" : "rgba(248,248,248,0.92)")
      .attr("stroke", darkMode ? "#444" : "#ccc")
      .attr("stroke-width", 1)
      .attr("rx", 6);

    // --- Vertical Legend for chloropleth---
    const legendWidth = 18;
    const legendHeight = 200;
    
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(900, 40)");
    
    defs.select("#legend-choropleth-grad").remove();
    const gradient = defs.append("linearGradient")
      .attr("id", "legend-choropleth-grad")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");
    
    gradient.selectAll("stop")
      .data(d3.range(0, 1.01, 0.1))
      .join("stop")
      .attr("offset", d => `${d * 100}%`)
      .attr("stop-color", d =>
        colorScale(
          colorScale.domain()[0] +
          d * (colorScale.domain()[1] - colorScale.domain()[0])
        )
      );
    
    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("fill", "url(#legend-choropleth-grad)")
      .attr("stroke", _sizeLine);
    
    const legendScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([legendHeight, 0]);
    
    legend.append("g")
      .attr("transform", `translate(${legendWidth},0)`)
      .call(
        d3.axisRight(legendScale)
          .ticks(5)
          .tickFormat(metric.format ?? d3.format(","))
      )
      .call(g => {
        g.selectAll("text").attr("fill", "currentColor");
        g.selectAll(".domain, .tick line").attr("stroke", "currentColor");
      });
    
    legend.append("text")
      .attr("x", 0)
      .attr("y", -12)
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .attr("fill", "currentColor")
      .text(metric.label);

    // --- Datacenter Size Legend ---
    const fallbackLegendValues = [100000, 500000, 1000000];
    
    const countyMaxSqft = d3.max(operatingDcs, d => sqft(d));
    const sizeLegendValues = countyMaxSqft
      ? fallbackLegendValues.filter(v => v <= countyMaxSqft)
      : fallbackLegendValues;
    
    const sizeLegend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(900, 275)");
    
    sizeLegend.append("text")
      .attr("x", 0)
      .attr("y", -15)
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .attr("fill", "currentColor")
      .text("Datacenter Size");
    
    const maxR = sqftScale(d3.max(sizeLegendValues));
    
    [...sizeLegendValues].reverse().forEach((value, i) => {
      const r = sqftScale(value);
      const y = maxR * 2 + i * (maxR * 2.5);
    
      sizeLegend.append("circle")
        .attr("cx", r)
        .attr("cy", y)
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", _sizeLine);
    
      sizeLegend.append("line")
        .attr("x1", r * 2)
        .attr("x2", r * 2 + 30)
        .attr("y1", y)
        .attr("y2", y)
        .attr("stroke", _sizeLine);
    
      sizeLegend.append("text")
        .attr("x", r * 2 + 35)
        .attr("y", y + 4)
        .attr("font-size", 11)
        .attr("fill", "currentColor")
        .text(`${d3.format(",")(value)} sqft`);
    });

    // --- Datacenter Status Legend ---
    const statusLegendItems = [
      ["cancelled", "Cancelled"],
      ["inProgress", "In progress / permitted"],
      ["operating", "Operating"],
      ["proposed", "Proposed"],
      ["other", "Other"]
    ];

    const statusLegend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(900, 425)");

    statusLegend.append("text")
      .attr("x", 0)
      .attr("y", -12)
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .attr("fill", "currentColor")
      .text("Facility Status");

    statusLegendItems.forEach(([key, label], i) => {
      const y = i * 20;

      statusLegend.append("circle")
        .attr("cx", 7)
        .attr("cy", y)
        .attr("r", 6)
        .attr("fill", statusPalette[key])
        .attr("stroke", darkMode ? "#222" : "#fff")
        .attr("stroke-width", 1);

      statusLegend.append("text")
        .attr("x", 20)
        .attr("y", y + 4)
        .attr("font-size", 11)
        .attr("fill", "currentColor")
        .text(label);
    });

    const pushbackY = statusLegendItems.length * 20 + 6;

    statusLegend.append("path")
      .attr("transform", `translate(7, ${pushbackY})`)
      .attr("d", d3.symbol().type(d3.symbolStar).size(110)())
      .attr("fill", "#ffd43b")
      .attr("stroke", darkMode ? "#222" : "#000")
      .attr("stroke-width", 0.8);

    statusLegend.append("text")
      .attr("x", 20)
      .attr("y", pushbackY + 4)
      .attr("font-size", 11)
      .attr("fill", "currentColor")
      .text("Community pushback");

    // --- County boundary layer ---
    svg.selectAll(".boundary")
      .data(boundary.features)
      .join("path")
      .attr("class", "boundary")
      .attr("d", path)
      .attr("fill", _boundaryFill)
      .attr("stroke", _boundaryStroke)
      .attr("stroke-width", 2)
      .style("pointer-events", "none");

        // --- Towns layer ---
    svg.selectAll(".town")
      .data(towns.features)
      .join("path")
      .attr("class", "town")
      .attr("d", path)
      .attr("fill", d => {
        const v = d.properties[metric.key];
        return (v != null && v > 0) ? colorScale(v) : "url(#no-data-pattern)";
      })
      .attr("stroke", _sizeLine)
      .attr("stroke-width", 0.5)
      .on("mousemove", (event, d) => {
          const value = d.properties[metric.key];
          tooltip
            .style("opacity", 1)
            .style("left", (event.clientX + 12) + "px")
            .style("top", (event.clientY - 28) + "px")
            .html(`
              <strong>${d.properties.place_name}</strong><br>
              ${metric.label}: ${
                value != null
                  ? (metric.format ? metric.format(value) : value)
                  : "No data"
              }
            `);
            })
      .on("mouseleave", () => tooltip.style("opacity", 0));

    // --- Datacenter layer ---
    const dcSelection = svg.selectAll(".dc")
      .data(dcs.slice().sort((a, b) => d3.descending(sqft(a), sqft(b))))
      .join("g")
      .attr("class", "dc")
      .attr("transform", d => {
        const p = projection([d.lon, d.lat]);
        return p ? `translate(${p[0]},${p[1]})` : null;
      });

    dcSelection.append("circle")
      .attr("r", d => sqftScale(sqft(d)))
      .attr("fill", facilityColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    dcSelection
      .filter(d => d.pushback)
      .append("path")
      .attr("d", d =>
        d3.symbol()
          .type(d3.symbolStar)
          .size(Math.max(90, sqftScale(sqft(d)) ** 2.2))
          ()
      )
      .attr("fill", "#ffd43b")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.8);

    dcSelection
      .on("mousemove", (event, d) => {
        tooltip
          .style("opacity", 1)
          .style("left", (event.clientX + 12) + "px")
          .style("top", (event.clientY - 28) + "px")
          .html(`
            <strong>${d.name}</strong><br>
            Status: ${d.status ?? "Unknown"}<br>
            Operator: ${d.operator ?? "Unknown"}<br>
            Size: ${d.sqft != null ? d.sqft.toLocaleString() + " sqft" : "Unknown"}
            ${d.pushback ? `
              <hr style="border:none; border-top:1px solid var(--dc-separator); margin:6px 0;">
              <strong>Community pushback</strong><br>
              ${d.resistanceStatus ? `Resistance status: ${d.resistanceStatus}<br>` : ""}
              ${d.nda ? `NDA: ${d.nda}<br>` : ""}
              ${d.advocacyInfo ? `<div style="margin-top:4px;">${d.advocacyInfo}</div>` : ""}
              ${d.otherInfo ? `<div style="margin-top:4px;"><em>${d.otherInfo}</em></div>` : ""}
            ` : ""}
          `);
      })
      .on("mouseleave", () => tooltip.style("opacity", 0));


  }

  renderLocal();
  return container;
})();

display(mapView);
```

## References / Data Sources

U.S data center facility records (data_centers.csv) - https://data.msdlive.org/records/65g71-a4731

FracTracker Alliance, National Data Centers Tracker. (datacenter2.csv) - https://www.fractracker.org/2025/07/national-data-centers-tracker/

Frontier AI data center construction observations (datacenters3.csv) - https://epoch.ai/data/data-centers

County boundary geometry — us-atlas (https://github.com/topojson/us-atlas)

Data Center Opposition Survey Visualization - https://news.gallup.com/poll/709772/americans-oppose-data-centers-area.aspx

Github Repository - https://github.com/TreyMartin0/Datacenter-Project


## Claim References
[1] https://www.reveliolabs.com/news/tech/data-centers-are-spreading-the-ai-boom-beyond-tech-hubs/
[2] https://escholarship.org/uc/item/32d6m0d1
[3] https://news.gallup.com/poll/709772/americans-oppose-data-centers-area.aspx
[4] https://www.fractracker.org/2025/07/national-data-centers-tracker/