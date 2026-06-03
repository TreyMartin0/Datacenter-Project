# When Communities Push Back: Public Resistance to the Data Center Boom

Artificial intelligence has rapidly transformed from a niche technology into a major driver of economic investment. Behind every AI chatbot, image generator, and recommendation system is an enormous amount of computing infrastructure. As demand for AI continues to grow, so does the need for data centers.

What was once an industry concentrated in a handful of technology hubs is now spreading across the country. Companies are proposing new facilities in urban areas, suburban communities, and rural regions alike, making data centers an increasingly visible part of the American landscape.
```js
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
const vl = vegaLiteApi.register(vega, vegaLite);
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
const chart = vl.layer(
  vl.markGeoshape({ fill: "#f5f5f0", stroke: "#bbb", strokeWidth: 0.5 })
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
    legend: { labelColor: "#fff", titleColor: "#fff" }
  })
  .title({ text: "U.S. Data Centers", color: "#fff", fontSize: 24 });

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
    color: #fff;
    background: ${showProposed ? "#dd831b" : "#333"};
    border: 2px solid ${showProposed ? "#f08f20" : "#555"};
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
  "
>${showProposed ? "Hide proposed facilities" : "Show proposed facilities"}</button>`);
```
The map above illustrates both existing and proposed data centers across the United States. While existing facilities are already widespread, the number of proposed projects demonstrates that expansion is far from over. The growth of AI has created unprecedented demand for computing power, leading technology companies and developers to pursue new facilities at an accelerating pace.

However, the expansion of data centers has not been universally welcomed.

Many residents view data centers as a source of concern rather than opportunity. Critics point to the large amounts of electricity and water these facilities consume, their potential environmental impacts, and the strain they can place on local infrastructure. Others question whether communities should bear these costs in order to support technologies that primarily benefit large corporations. Concerns about artificial intelligence itself, including its societal impacts, labor implications, and energy consumption, have further fueled opposition.

<!-- Insert Vis 2 Here -->

Public opinion reflects these concerns. As shown above, a substantial majority of respondents express opposition to having data centers built in their communities. While motivations vary, the pattern is clear. Many people are skeptical of the costs associated with data center development and are increasingly willing to voice those concerns.

The question, then, is whether that opposition actually matters.

Developers and technology companies often possess significant financial resources and political influence, which can make large infrastructure projects appear inevitable. Yet local communities have more power than they may realize. Public meetings, community organizing, advocacy groups, and local government decisions can all affect the outcome of proposed developments.

<!-- Insert Vis 3 Here -->

The final map highlights locations where proposed data centers have faced pushback, alongside projects that were ultimately canceled. It becomes apparent that areas that experienced substantial public pushback frequently overlap with locations where projects were later canceled.

While community opposition is not the sole factor behind every cancellation, the relationship is difficult to ignore. Public pressure can influence local officials, affect permitting decisions, generate media attention, and increase the costs and risks associated with development. In many cases, organized residents have successfully altered or halted projects that once appeared certain to move forward.

As demand for AI infrastructure continues to grow, conflicts over data center development are likely to become increasingly common. The expansion of technology will continue to affect communities across the country, but these decisions are not made in a vacuum. The evidence suggests that local voices can influence outcomes and that community engagement remains an important force in determining how and where future development occurs.

The story of data centers is therefore not just a story about technology. It is also a story about civic participation. As communities confront the opportunities and challenges of the AI era, public engagement can play an important part in affecting what gets built, where it gets built, and whether it gets built at all.

---

# Mapping the Data Center Buildout

Where is the data center buildout concentrating, who is building it, and where are communities pushing back? This visualization maps 1,505 U.S. data center facilities by the county that hosts them, colored by your choice of buildout measure.

```js
// Load the TopoJSON library for converting topology data to GeoJSON shapes
import * as topojson from "npm:topojson-client";
```

```js
// Load county facility records and U.S. county/state geometry
const counties = await FileAttachment("data/data_prep.json").json();
const us = await FileAttachment("data/counties-10m.json").json();

// Index county records by FIPS code for fast lookups during map rendering
const countyByFips = new Map(counties.map((c) => [c.fips, c]));
// Convert TopoJSON topology into individual GeoJSON county polygons
const countyFeatures = topojson.feature(us, us.objects.counties).features;
// Build a mesh of state borders (shared edges only) for the border overlay
const stateMesh = topojson.mesh(us, us.objects.states, (a, b) => a !== b);
```

```js
// Reactive mutable that tracks which county FIPS is currently selected
const selectedFips = Mutable(null);
// Setter used inside click handlers to update the selected county
const setSelected = (fips) => (selectedFips.value = fips);
```

```js
// Radio input that controls which data field colors the map
const measure = view(
  Inputs.radio(
    new Map([
      ["Total facilities", "total"],
      ["Total megawatts", "mwTotal"],
      ["Proposed", "proposed"],
      ["Operating", "operating"],
      ["Cancelled", "cancelled"],
      ["Community pushback", "pushbackCount"],
    ]),
    { value: "total", label: "Color counties by:" },
  ),
);
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
    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 14)
      .attr("height", 14)
      .attr("rx", 3)
      .attr("fill", cancelledColor);
    svg
      .append("text")
      .attr("x", 20)
      .attr("y", 11)
      .attr("font-size", 11)
      .attr("fill", "#aaa")
      .text("Has cancelled facilities");
  } else {
    // Gradient bar from low (yellow) to high (dark red) with labeled endpoints
    const w = 240,
      h = 12;
    svg.attr("width", w + 60);
    const grad = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "leg-grad");
    d3.range(0, 1.01, 0.1).forEach((t) => {
      grad
        .append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", d3.interpolateYlOrRd(t));
    });
    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", w)
      .attr("height", h)
      .attr("fill", "url(#leg-grad)");
    svg
      .append("text")
      .attr("x", 0)
      .attr("y", h + 14)
      .attr("font-size", 11)
      .attr("fill", "#aaa")
      .text("low");
    svg
      .append("text")
      .attr("x", w)
      .attr("y", h + 14)
      .attr("font-size", 11)
      .attr("fill", "#aaa")
      .attr("text-anchor", "end")
      .text(`high (max ${maxVal.toLocaleString()})`);
  }
  return svg.node();
})();
display(legendNode);
```

```js
// Standard Albers USA canvas size matching the us-atlas projection
const width = 975;
const height = 610;
// Albers USA projection
const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
// Path generator that converts GeoJSON coordinates to SVG path strings
const path = d3.geoPath(projection);

// Resolve the currently selected county object, or null if none selected
const selected = selectedFips ? countyByFips.get(selectedFips) : null;

// Create the root SVG element
const svg = d3
  .create("svg")
  .attr("viewBox", [0, 0, width, height])
  .attr("width", width)
  .attr("style", "max-width: 100%; height: auto; cursor: pointer;");

// Draw one path per county, colored by the active measure
svg
  .append("g")
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
  .on("click", (event, d) => {
    // Toggle selection
    const fips = String(d.id).padStart(5, "0");
    const rec = countyByFips.get(fips);
    if (!rec || rec.total === 0) return;
    setSelected(selectedFips === fips ? null : fips);
  })
  .append("title")
  // Native browser tooltip shown on hover
  .text((d) => {
    const rec = countyByFips.get(String(d.id).padStart(5, "0"));
    if (!rec || rec.total === 0) return "";
    return `${rec.name}\n${rec.total} facilities · ${rec.mwTotal.toLocaleString()} MW\n${rec.pushbackCount > 0 ? `${rec.pushbackCount} with community pushback` : "no recorded pushback"}`;
  });

// Draw a black outline around the selected county on top of the fill layer
if (selected) {
  svg
    .append("path")
    .datum(
      countyFeatures.find(
        (d) => String(d.id).padStart(5, "0") === selected.fips,
      ),
    )
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-width", 2.5)
    .attr("d", path);
}

// Draw white state border lines on top of county fills
svg
  .append("path")
  .datum(stateMesh)
  .attr("fill", "none")
  .attr("stroke", "#fff")
  .attr("stroke-width", 0.7)
  .attr("stroke-linejoin", "round")
  .attr("d", path);

display(svg.node());
```

```js
// Format helpers for displaying megawatts and acreage in the detail card
const fmtMW = (n) => (n == null ? "—" : `${Number(n).toLocaleString()} MW`);
const fmtAcres = (n) =>
  n == null ? null : `${Number(n).toLocaleString()} acres`;

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
const statusBadge = (s) =>
  html`<span
    style="display:inline-block; padding:2px 8px; border-radius:10px; font-size:0.78em; background:${statusColor(
      s,
    )}; color:white;"
    >${(s || "—").replace(
      "Approved/Permitted/Under construction",
      "Under construction",
    )}</span
  >`;

// Maps each measure key to a status filter keyword and a human-readable card label
const measureMeta = {
  total: { filter: null, label: "Largest facility" },
  mwTotal: { filter: null, label: "Highest-capacity facility" },
  proposed: { filter: "proposed", label: "Largest proposed facility" },
  operating: { filter: "operating", label: "Largest operating facility" },
  cancelled: { filter: "cancel", label: "Largest cancelled facility" },
  pushbackCount: { filter: "pushback", label: "Contested facility" },
};

// Picks the most relevant facility to spotlight based on the active measure
function pickSpotlight(facilities, measure) {
  const meta = measureMeta[measure] ?? measureMeta.total;
  let pool = facilities;
  if (meta.filter === "pushback") {
    // Rank contested facilities by richness of advocacy detail, then by MW
    pool = facilities
      .filter((f) => f.pushback)
      .sort((a, b) => {
        const score = (f) =>
          (f.advocacyInfo ? 2 : 0) +
          (f.resistanceStatus ? 1 : 0) +
          (f.sources?.length > 0 ? 1 : 0);
        return score(b) - score(a) || (b.mw ?? 0) - (a.mw ?? 0);
      });
  } else if (meta.filter) {
    // Filter to only facilities matching the active status keyword
    pool = facilities.filter((f) =>
      f.status?.toLowerCase().includes(meta.filter),
    );
  }
  // Fall back to full list if no facilities match the filter
  if (!pool.length) pool = facilities;
  // Return the largest facility by MW from the filtered pool
  return pool.slice().sort((a, b) => (b.mw ?? 0) - (a.mw ?? 0))[0] ?? null;
}

if (!selected) {
  display(
    html`<p style="color:#888;">
      <em
        >Hover any colored county for a quick read. Click a county to see
        operators and the spotlight facility.</em
      >
    </p>`,
  );
} else {
  // Pick the spotlight facility based on the currently active measure
  const sp = pickSpotlight(selected.facilities, measure);
  // Filter out "Unknown" operators and cap display at 6 named chips
  const ops = selected.operators
    .filter((o) => o.name !== "Unknown")
    .slice(0, 6);
  const unknownGroup = selected.operators.find((o) => o.name === "Unknown");
  const namedCount = selected.operators.filter(
    (o) => o.name !== "Unknown",
  ).length;

  display(html`
    <div style="margin-top: 1em;">
      <h2 style="margin: 0;">${selected.name}</h2>
      <p style="margin: 4px 0 14px 0; color:#aaa; font-size:0.95em;">
        <strong style="color:#fff;">${selected.total}</strong> facilities ·
        <strong style="color:#fff;"
          >${selected.mwTotal.toLocaleString()} MW</strong
        >
        · ${selected.operating} operating · ${selected.proposed} proposed ·
        ${selected.pushbackCount > 0
          ? html`<strong style="color:#ff6b6b;"
              >${selected.pushbackCount} with community pushback</strong
            >`
          : html`<span style="color:#666;">no recorded pushback</span>`}
      </p>

      <div style="margin-bottom: 16px;">
        <div
          style="font-size:0.8em; color:#888; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.05em;"
        >
          Top operators in this county
        </div>
        ${ops.map(
          (o) =>
            html`<span
              style="display:inline-block; padding:4px 10px; margin:0 6px 6px 0; background:#1a1a1a; border:1px solid #333; border-radius:14px; font-size:0.85em; color:#e8e8e8;"
            >
              <strong style="color:#fff;">${o.name}</strong
              ><span style="color:#888;"> · ${o.count}</span>
            </span>`,
        )}
        ${unknownGroup
          ? html`<span style="color:#666; font-size:0.85em; margin-left:4px;"
              >+ ${unknownGroup.count} unknown</span
            >`
          : ""}
        ${namedCount > 6
          ? html`<span style="color:#666; font-size:0.85em; margin-left:8px;"
              >+ ${namedCount - 6} more</span
            >`
          : ""}
      </div>

      ${sp
        ? html`
            <div
              style="border:1px solid ${sp.pushback
                ? "#c92a2a"
                : "#2a2a2a"}; border-radius:8px; overflow:hidden; background:#0d0d0d;"
            >
              ${/* Header bar */ ""}
              <div
                style="padding:10px 16px; background:${sp.pushback
                  ? "#1a0505"
                  : "#111"}; border-bottom:1px solid ${sp.pushback
                  ? "#c92a2a"
                  : "#222"}; display:flex; align-items:center; gap:10px; flex-wrap:wrap;"
              >
                <span
                  style="font-size:0.7em; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:${sp.pushback
                    ? "#ff6b6b"
                    : "#666"};"
                >
                  ${sp.pushback ? "⚑ " : ""}${measureMeta[measure]?.label ??
                  "Spotlight"}
                </span>
                ${statusBadge(sp.status)}
              </div>

              ${/* Facility name + stats */ ""}
              <div style="padding:14px 16px 10px;">
                <h3 style="margin:0 0 6px 0; font-size:1.1em;">
                  ${sp.name || "Unnamed facility"}
                </h3>
                <div style="color:#999; font-size:0.88em; line-height:1.8;">
                  ${[
                    sp.operator
                      ? html`<span style="color:#ccc;">${sp.operator}</span>`
                      : null,
                    sp.sizeRank ? html`<span>${sp.sizeRank}</span>` : null,
                    sp.mw
                      ? html`<span
                          ><strong style="color:#fff;"
                            >${fmtMW(sp.mw)}</strong
                          ></span
                        >`
                      : null,
                    sp.acres ? html`<span>${fmtAcres(sp.acres)}</span>` : null,
                    sp.projectCost
                      ? html`<span>${sp.projectCost}</span>`
                      : null,
                    sp.powerSource
                      ? html`<span>Power: ${sp.powerSource}</span>`
                      : null,
                    sp.expectedOnline
                      ? html`<span>Online: ${sp.expectedOnline}</span>`
                      : null,
                  ]
                    .filter(Boolean)
                    .reduce(
                      (acc, el, i) =>
                        i === 0
                          ? [el]
                          : [
                              ...acc,
                              html`<span style="color:#444;"> · </span>`,
                              el,
                            ],
                      [],
                    )}
                </div>
              </div>

              ${sp.pushback
                ? html`
                    ${/* Community resistance section */ ""}
                    <div
                      style="margin:0 16px 14px; padding:12px 14px; background:#120808; border:1px solid #3a1010; border-radius:6px;"
                    >
                      <div
                        style="font-size:0.7em; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#ff6b6b; margin-bottom:10px;"
                      >
                        Community resistance
                      </div>

                      ${sp.advocacyInfo
                        ? html`
                            <p
                              style="margin:0 0 10px 0; color:#e0e0e0; font-size:0.92em; line-height:1.6;"
                            >
                              ${sp.advocacyInfo}
                            </p>
                          `
                        : ""}
                      ${sp.otherInfo
                        ? html`
                            <p
                              style="margin:0 0 10px 0; color:#bbb; font-size:0.87em; line-height:1.6; font-style:italic;"
                            >
                              ${sp.otherInfo}
                            </p>
                          `
                        : ""}
                      ${sp.resistanceStatus || sp.nda
                        ? html`
                            <div
                              style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px;"
                            >
                              ${sp.resistanceStatus
                                ? html`
                                    <span
                                      style="display:inline-flex; align-items:center; gap:5px; padding:3px 10px; background:#1e0c0c; border:1px solid #5c2020; border-radius:12px; font-size:0.82em; color:#ffb3b3;"
                                    >
                                      <strong>Status:</strong>
                                      ${sp.resistanceStatus}
                                    </span>
                                  `
                                : ""}
                              ${sp.nda
                                ? html`
                                    <span
                                      style="display:inline-flex; align-items:center; gap:5px; padding:3px 10px; background:#1e0c0c; border:1px solid #5c2020; border-radius:12px; font-size:0.82em; color:#ffb3b3;"
                                    >
                                      <strong>NDA:</strong> ${sp.nda}
                                    </span>
                                  `
                                : ""}
                            </div>
                          `
                        : ""}
                      ${sp.petitionUrl ||
                      sp.communityGroupUrl1 ||
                      sp.communityGroupUrl2 ||
                      (sp.sources && sp.sources.length)
                        ? html`
                            <div
                              style="display:flex; flex-wrap:wrap; gap:10px; font-size:0.85em; padding-top:8px; border-top:1px solid #2a1010;"
                            >
                              ${sp.petitionUrl
                                ? html`<a
                                    href="${sp.petitionUrl}"
                                    target="_blank"
                                    style="color:#ff8787; text-decoration:none; display:inline-flex; align-items:center; gap:4px;"
                                    >✍ Petition</a
                                  >`
                                : ""}
                              ${sp.communityGroupUrl1
                                ? html`<a
                                    href="${sp.communityGroupUrl1}"
                                    target="_blank"
                                    style="color:#74c0fc; text-decoration:none;"
                                    >Community group →</a
                                  >`
                                : ""}
                              ${sp.communityGroupUrl2
                                ? html`<a
                                    href="${sp.communityGroupUrl2}"
                                    target="_blank"
                                    style="color:#74c0fc; text-decoration:none;"
                                    >Community group 2 →</a
                                  >`
                                : ""}
                              ${sp.sources &&
                              sp.sources
                                .slice(0, 3)
                                .map(
                                  (u, i) =>
                                    html`<a
                                      href="${u}"
                                      target="_blank"
                                      style="color:#adb5bd; text-decoration:none;"
                                      >News ${i + 1} →</a
                                    >`,
                                )}
                            </div>
                          `
                        : ""}
                    </div>
                  `
                : sp.otherInfo
                  ? html`
                      <p
                        style="margin:0 16px 14px; color:#888; font-size:0.87em; line-height:1.6;"
                      >
                        ${sp.otherInfo}
                      </p>
                    `
                  : ""}
            </div>
          `
        : ""}
    </div>
  `);
}
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

_There is two additional dataset in the repository that are not used, but I can provide links upon request if needed_
