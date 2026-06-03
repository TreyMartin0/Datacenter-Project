import JSZip from "jszip";
import { readFileSync, readdirSync } from "fs";
import { writeSync } from "fs";

const zip = new JSZip();
const dir = "src/public/county_places";

for (const file of readdirSync(dir)) {
  if (file.endsWith(".json")) {
    zip.file(file, readFileSync(`${dir}/${file}`));
  }
}

const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
process.stdout.write(buffer);