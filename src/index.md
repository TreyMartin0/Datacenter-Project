# Mapping the Data Center Buildout

Where is the data center buildout concentrating, who is building it, and where are communities pushing back? This visualization maps 1,505 U.S. data center facilities by the county that hosts them, colored by your choice of buildout measure.

```js
// Load the TopoJSON library for converting topology data to GeoJSON shapes
import * as topojson from "npm:topojson-client";
```

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

const allFacilities = counties.flatMap(c => c.facilities);
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
    svg.append("text").attr("x", 20).attr("y", 11).attr("font-size", 11).attr("fill", "#aaa").text("Has cancelled facilities");
  } else {
    // Gradient bar from low (yellow) to high (dark red) with labeled endpoints
    const w = 240, h = 12;
    svg.attr("width", w + 60);
    const grad = svg.append("defs").append("linearGradient").attr("id", "leg-grad");
    d3.range(0, 1.01, 0.1).forEach((t) => {
      grad.append("stop").attr("offset", `${t * 100}%`).attr("stop-color", d3.interpolateYlOrRd(t));
    });
    svg.append("rect").attr("x", 0).attr("y", 0).attr("width", w).attr("height", h).attr("fill", "url(#leg-grad)");
    svg.append("text").attr("x", 0).attr("y", h + 14).attr("font-size", 11).attr("fill", "#aaa").text("low");
    svg.append("text").attr("x", w).attr("y", h + 14).attr("font-size", 11).attr("fill", "#aaa").attr("text-anchor", "end").text(`high (max ${maxVal.toLocaleString()})`);
  }
  return svg.node();
})();
const nationalLegendNode = legendNode;
```

```js
// Standard Albers USA canvas size matching the us-atlas projection
const width = 760;
const height = 575;
const projection = d3.geoAlbersUsa().scale(1000).translate([380, 237.5]);
// Path generator that converts GeoJSON coordinates to SVG path strings
const path = d3.geoPath(projection);

// Resolve the currently selected county object, or null if none selected
const selected = selectedState.fips ? countyByFips.get(selectedState.fips) : null;

// Create the root SVG element
const svg = d3.create("svg")
  .attr("viewBox", [0, 0, width, height])
  .attr("width", width)
  .attr("style", "max-width: 100%; height: auto; cursor: pointer;");

// Draw one path per county, colored by the active measure
svg.append("g")
  .selectAll("path")
  .data(countyFeatures)
  .join("path")
    .attr("d", path)
    .attr("fill", (d) => {
      const rec = countyByFips.get(String(d.id).padStart(5, "0"));
      const v = rec ? rec[measure] : 0;
      // Counties with no data get a neutral gray fill
      if (v <= 0) return "#f0f0f0";
      // Cancelled uses a flat red
      return isBinary ? cancelledColor : color(v);
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.2)
    .on("click", async (event, d) => {
      const fips = String(d.id).padStart(5, "0");
      const rec = countyByFips.get(fips);

      if (!rec || rec.total === 0) return;

      await setSelected(
        selectedState.fips === fips ? null : fips
      );
    })
    .append("title")
      // Native browser tooltip shown on hover
      .text((d) => {
        const rec = countyByFips.get(String(d.id).padStart(5, "0"));
        if (!rec || rec.total === 0) return "";
        return `${rec.name}\n${rec.total} facilities · ${rec.mwTotal.toLocaleString()} MW\n${rec.pushbackCount > 0 ? `${rec.pushbackCount} with community pushback` : "no recorded pushback"}`;
      });

  function updateSelectionOutline() {
  svg.selectAll(".selected-county").remove();
  if (selectedState.fips) {
    svg.append("path")
      .datum(countyFeatures.find(d => String(d.id).padStart(5, "0") === selectedState.fips))
      .attr("class", "selected-county")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 2.5)
      .attr("d", path);
  }
}
selectedState.updateSelectionOutline = updateSelectionOutline;

  // Draw a black outline around the selected county on top of the fill layer
  if (selected) {
    svg.append("path")
        .datum(countyFeatures.find((d) => String(d.id).padStart(5, "0") === selected.fips))
        .attr("class", "selected-county")
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 2.5)
        .attr("d", path);
  }

// Draw white state border lines on top of county fills
svg.append("path")
    .datum(stateMesh)
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.7)
    .attr("stroke-linejoin", "round")
    .attr("d", path);

const nationalMapNode = svg.node();

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
      <p style="color:#888;">
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
      <p style="margin: 4px 0 14px 0; color:#aaa; font-size:0.95em;">
        <strong style="color:#fff;">${selected.total}</strong> facilities ·
        <strong style="color:#fff;">${selected.mwTotal.toLocaleString()} MW</strong> ·
        ${selected.operating} operating ·
        ${selected.proposed} proposed ·
        ${selected.pushbackCount > 0
          ? html`<strong style="color:#ff6b6b;">${selected.pushbackCount} with community pushback</strong>`
          : html`<span style="color:#666;">no recorded pushback</span>`}
      </p>

      <div style="margin-bottom: 16px;">
        <div style="font-size:0.8em; color:#888; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;">Top operators in this county</div>
        ${ops.map((o) => html`
          <span style="display:inline-block; padding:4px 10px; margin:0 6px 6px 0; background:#1a1a1a; border:1px solid #333; border-radius:14px; font-size:0.85em; color:#e8e8e8;">
            <strong style="color:#fff;">${o.name}</strong><span style="color:#888;"> · ${o.count}</span>
          </span>
        `)}
        ${unknownGroup ? html`<span style="color:#666; font-size:0.85em; margin-left:4px;">+ ${unknownGroup.count} unknown</span>` : ""}
        ${namedCount > 6 ? html`<span style="color:#666; font-size:0.85em; margin-left:8px;">+ ${namedCount - 6} more</span>` : ""}
      </div>

      ${sp ? html`
        <div style="border:1px solid ${sp.pushback ? "#c92a2a" : "#2a2a2a"}; border-radius:8px; overflow:hidden; background:#0d0d0d;">
          <div style="padding:10px 16px; background:${sp.pushback ? "#1a0505" : "#111"}; border-bottom:1px solid ${sp.pushback ? "#c92a2a" : "#222"}; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span style="font-size:0.7em; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:${sp.pushback ? "#ff6b6b" : "#666"};">
              ${sp.pushback ? "★ " : ""}${measureMeta[measure]?.label ?? "Spotlight"}
            </span>
            ${statusBadge(sp.status)}
          </div>

          <div style="padding:14px 16px 10px;">
            <h3 style="margin:0 0 6px 0; font-size:1.1em;">${sp.name || "Unnamed facility"}</h3>
            <div style="color:#999; font-size:0.88em; line-height:1.8;">
              ${[
                sp.operator ? html`<span style="color:#ccc;">${sp.operator}</span>` : null,
                sp.sizeRank ? html`<span>${sp.sizeRank}</span>` : null,
                sp.mw ? html`<span><strong style="color:#fff;">${fmtMW(sp.mw)}</strong></span>` : null,
                sp.acres ? html`<span>${fmtAcres(sp.acres)}</span>` : null,
                sp.projectCost ? html`<span>${sp.projectCost}</span>` : null,
                sp.powerSource ? html`<span>Power: ${sp.powerSource}</span>` : null,
                sp.expectedOnline ? html`<span>Online: ${sp.expectedOnline}</span>` : null,
              ].filter(Boolean).reduce((acc, el, i) =>
                i === 0 ? [el] : [...acc, html`<span style="color:#444;"> · </span>`, el], []
              )}
            </div>
          </div>

          ${sp.pushback ? html`
            <div style="margin:0 16px 14px; padding:12px 14px; background:#120808; border:1px solid #3a1010; border-radius:6px;">
              <div style="font-size:0.7em; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#ff6b6b; margin-bottom:10px;">Community resistance</div>

              ${sp.advocacyInfo ? html`<p style="margin:0 0 10px 0; color:#e0e0e0; font-size:0.92em; line-height:1.6;">${sp.advocacyInfo}</p>` : ""}
              ${sp.otherInfo ? html`<p style="margin:0 0 10px 0; color:#bbb; font-size:0.87em; line-height:1.6; font-style:italic;">${sp.otherInfo}</p>` : ""}

              ${(sp.resistanceStatus || sp.nda) ? html`
                <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
                  ${sp.resistanceStatus ? html`
                    <span style="display:inline-flex; align-items:center; gap:5px; padding:3px 10px; background:#1e0c0c; border:1px solid #5c2020; border-radius:12px; font-size:0.82em; color:#ffb3b3;">
                      <strong>Status:</strong> ${sp.resistanceStatus}
                    </span>` : ""}
                  ${sp.nda ? html`
                    <span style="display:inline-flex; align-items:center; gap:5px; padding:3px 10px; background:#1e0c0c; border:1px solid #5c2020; border-radius:12px; font-size:0.82em; color:#ffb3b3;">
                      <strong>NDA:</strong> ${sp.nda}
                    </span>` : ""}
                </div>
              ` : ""}

              ${(sp.petitionUrl || sp.communityGroupUrl1 || sp.communityGroupUrl2 || (sp.sources && sp.sources.length)) ? html`
                <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:0.85em; padding-top:8px; border-top:1px solid #2a1010;">
                  ${sp.petitionUrl ? html`<a href="${sp.petitionUrl}" target="_blank" style="color:#ff8787; text-decoration:none;">✍ Petition</a>` : ""}
                  ${sp.communityGroupUrl1 ? html`<a href="${sp.communityGroupUrl1}" target="_blank" style="color:#74c0fc; text-decoration:none;">Community group →</a>` : ""}
                  ${sp.communityGroupUrl2 ? html`<a href="${sp.communityGroupUrl2}" target="_blank" style="color:#74c0fc; text-decoration:none;">Community group 2 →</a>` : ""}
                  ${sp.sources?.slice(0, 3).map((u, i) => html`<a href="${u}" target="_blank" style="color:#adb5bd; text-decoration:none;">News ${i + 1} →</a>`)}
                </div>
              ` : ""}
            </div>
          ` : sp.otherInfo ? html`
            <p style="margin:0 16px 14px; color:#888; font-size:0.87em; line-height:1.6;">${sp.otherInfo}</p>
          ` : ""}
        </div>
      ` : ""}
    </div>
  `);
}

selectedState.renderCountyDetails = renderCountyDetails;
renderCountyDetails();

import * as aq from "npm:arquero";

const {op} = aq;

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
  // --- State ---
  
  let metricIndex = 0;
  let showProposed = false;
  let currentScale = 1;

  // --- Container ---
  const container = html`<div style="font-family: sans-serif;">
    <div style="display:flex; align-items:center; gap:16px; margin-bottom:12px;">
      <span id="county-label" style="font-size:1.2em; font-weight:bold;"></span>
    </div>
    <div id="metric-btns" style="display:flex; gap:8px; margin-bottom:16px;"></div>
    <div style="margin-bottom:12px;">
    </div>
    <svg id="map" width="760" height="620" style="max-width:100%; height:auto;"></svg>
    <div id="tooltip" style="position:fixed; background:#fff; border:1px solid #ccc; 
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
    const metric = metrics[metricIndex];

  if (!selectedState.fips || !selectedState.countyData) {
    container.querySelector("#county-label").textContent = "Click a county in the national map.";
    return;
  }

  const selectedCountyRecord = countyByFips.get(selectedState.fips);
  const boundary = selectedState.countyData.county;
  const towns = selectedState.countyData.places;

    metricButtons.forEach((btn, i) => {
      if (i === metricIndex) {
        btn.style.background = "#1976d2";
        btn.style.color = "white";
        btn.style.fontWeight = "bold";
      } else {
        btn.style.background = "";
        btn.style.color = "";
        btn.style.fontWeight = "";
      }
    });

    
    const dcs = selectedCountyRecord.facilities
  .filter(d =>
    d.lat != null &&
    d.lon != null &&
    facilityMatchesMeasure(d, measure)
  );


    const operatingDcs = selectedCountyRecord.facilities
      .filter(d =>
        d.lat != null &&
        d.lon != null //&&
        //d.status?.toLowerCase().includes("operating")
      );

    const sqftValues = operatingDcs.map(d => d.sqft).filter(v => v != null && v > 0);
    const sqft = d => (d.sqft == null || d.sqft === 0) ? medSqft : d.sqft;

    container.querySelector("#county-label").textContent = selectedCountyRecord?.name ?? selectedState.fips;

    //svg.selectAll("*").remove();

    const projection = d3.geoMercator()
      .fitSize([500, 580], boundary);

    const path = d3.geoPath(projection);

    const outOfBounds = dcs.filter(d => projection([d.lon, d.lat]) == null);
      console.log("out of bounds:", outOfBounds.length, outOfBounds.map(d => d.name));
      console.log("medianSqft:", medSqft, "sqftValues:", sqftValues);
    console.log("dcs:", dcs.length, "operatingDcs:", operatingDcs.length);


    // --- Color scale ---
    const values = towns.features.map(f => f.properties[metric.key]).filter(v => v != null);
    const colorScale = d3.scaleSequential()
      .domain(d3.extent(values))
      .interpolator(d3.interpolateBlues);

    // --- Vertical Legend for chloropleth---
    const legendWidth = 18;
    const legendHeight = 200;
    
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(585, 40)");
    
    const legendId = `legend-gradient-${selectedState.fips}-${metricIndex}`;
    
    const defs = svg.append("defs");
    
    const gradient = defs.append("linearGradient")
      .attr("id", legendId)
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
      .attr("fill", `url(#${legendId})`)
      .attr("stroke", "#999");
    
    const legendScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([legendHeight, 0]);
    
    legend.append("g")
      .attr("transform", `translate(${legendWidth},0)`)
      .call(
        d3.axisRight(legendScale)
          .ticks(5)
          .tickFormat(metric.format ?? d3.format(","))
      );
    
    legend.append("text")
      .attr("x", 0)
      .attr("y", -12)
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .text(metric.label);

    // --- Datacenter Size Legend ---
    const fallbackLegendValues = [100000, 500000, 1000000];
    
    const countyMaxSqft = d3.max(operatingDcs, d => sqft(d));
    const sizeLegendValues = countyMaxSqft
      ? fallbackLegendValues.filter(v => v <= countyMaxSqft)
      : fallbackLegendValues;
    
    const sizeLegend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(585, 260)");
    
    sizeLegend.append("text")
      .attr("x", 0)
      .attr("y", -15)
      .attr("font-size", 12)
      .attr("font-weight", "bold")
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
        .attr("stroke", "#333");
    
      sizeLegend.append("line")
        .attr("x1", r * 2)
        .attr("x2", r * 2 + 30)
        .attr("y1", y)
        .attr("y2", y)
        .attr("stroke", "#333");
    
      sizeLegend.append("text")
        .attr("x", r * 2 + 35)
        .attr("y", y + 4)
        .attr("font-size", 11)
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
      .attr("transform", "translate(585, 390)");

    statusLegend.append("text")
      .attr("x", 0)
      .attr("y", -12)
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .text("Facility Status");

    statusLegendItems.forEach(([key, label], i) => {
      const y = i * 20;

      statusLegend.append("circle")
        .attr("cx", 7)
        .attr("cy", y)
        .attr("r", 6)
        .attr("fill", statusPalette[key])
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);

      statusLegend.append("text")
        .attr("x", 20)
        .attr("y", y + 4)
        .attr("font-size", 11)
        .text(label);
    });

    const pushbackY = statusLegendItems.length * 20 + 6;

    statusLegend.append("path")
      .attr("transform", `translate(7, ${pushbackY})`)
      .attr("d", d3.symbol().type(d3.symbolStar).size(110)())
      .attr("fill", "#ffd43b")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.8);

    statusLegend.append("text")
      .attr("x", 20)
      .attr("y", pushbackY + 4)
      .attr("font-size", 11)
      .text("Community pushback");

    // --- County boundary layer ---
    svg.selectAll(".boundary")
      .data(boundary.features)
      .join("path")
      .attr("class", "boundary")
      .attr("d", path)
      .attr("fill", "white")
      .attr("stroke", "#333")
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
      .attr("stroke", "#999")
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
              <hr style="border:none; border-top:1px solid #ddd; margin:6px 0;">
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

display(html`
  <div style="max-width: 1700px;">
    <div style="
      display:grid;
      grid-template-columns:minmax(0, 1fr) minmax(0, 1fr);
      gap:20px;
      align-items:start;
    ">
      <div style="min-width:0;">
        <h3 style="margin:0 0 6px 0;">Nationwide view</h3>
        <div style="margin-bottom:8px;">${nationalLegendNode}</div>
        ${nationalMapNode}
      </div>

      <div style="min-width:0;">
        <h3 style="margin:0 0 6px 0;">County view</h3>
        ${mapView}
      </div>
    </div>

    <div style="margin-top:18px;">
      ${countyDetails}
    </div>
  </div>
`);
```

## Design Rationale
I first began this assignment with a different focus: do data center counties grow economically differently from their neighbors. After making a version of this, I found that my data had too little information to make any claims about my findings. Rather than making a claim I couldn't defend honestly, I decided to move to a more concrete question: where is the buildout happening, who is running it, and where are communities pushing back? I chose this so that every measure is a counted fact and not an inferred effect.

The quesiton I ask is pretty spatial, so I decide to go with a choropleth as my view. Counties were colored on a sequential ramp with a logarithmic scale. I made this decision because some counties, like Loudoun, VA and Pike, OH dominate the distribution and would saturate a linear scale. The zero-value counties were rendered light gray to seperate them from the counties with low facility counts.

The radio button toggle is a main interaction. They allow the viewer to switch between total facilities, total megawatts, proposed, operating, cancelled, and community pushback turn othe map into six views and shows interesting comparisons in the data. For example, the densest counties are not alwasy the largest in raw power, and the pushback hotspots are in a different geography from facilties count hotspots.

The click-to-detail panel saw various iterations. My early version lsited every facility as a table row, which would overwhelm the viewer for big counties. I tried collapsing by faciltiy name, but found duplicated that were actually distinct facilites at different addresses sharing a project name. The final verison I landed on was groups by operator and using a spotlight card to give one facility deep treatment rather than spreading attention across many.

The pushback field also saw some iteration. The "pushback count" alone was abstract and didn't give a viewer any information as to why. The dataset also didn't have a "reason" field, but does include evidence fields: advocacy descriptions, resistance status, NDA flags, petition URLs, and news sources. The spotlight card displays these when present.

Encoding channels are kept seperate: color encodes the chosen measure, a black outline marks the selected county, and the detail panel uses a categorical palette for status.

## References / Data Sources 

U.S data center facility records (data_centers.csv) - https://data.msdlive.org/records/65g71-a4731

FracTracker Alliance, National Data Centers Tracker. (datacenter2.csv) - https://www.fractracker.org/2025/07/national-data-centers-tracker/

Frontier AI data center construction observations (datacenters3.csv) - https://epoch.ai/data/data-centers

County boundary geometry — us-atlas (https://github.com/topojson/us-atlas)

Github Repository - https://github.com/TreyMartin0/Assignment5_CSC477

*There is two additional dataset in the repository that are not used, but I can provide links upon request if needed*

