// Black Friday deal finder: the program hands the site in. It copies app/
// and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. Leave vendor/makefun-frontend.ts as it is: the scorer
// requires dossier.json to be byte for byte what its own copy writes.
//
// The program is deterministic: it reads only the files in this repository,
// takes no input from the clock or the network, and writes the same bytes
// on every run.
//
// Serve the site locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// The gate's own caps (reference/gate.json): a bad hand-in must fail loudly
// here, in this program, instead of being handed to the scorer silently.
const DOSSIER_MAX_BYTES = 1572864; // 1.5 MiB
const SCREENSHOT_MAX_BYTES = 262144; // 256 KiB
const SCREENSHOT_MIN = 3;
const SCREENSHOT_MAX = 4;

function fail(message) {
  throw new Error(`hand-in refused: ${message}`);
}

function verifyOutput(outDir) {
  const shots = readdirSync(join(outDir, "screenshots")).filter((f) => !f.startsWith(".")).sort();
  if (shots.length < SCREENSHOT_MIN || shots.length > SCREENSHOT_MAX)
    fail(`expected ${SCREENSHOT_MIN}-${SCREENSHOT_MAX} screenshots, found ${shots.length}`);
  for (const shot of shots) {
    const size = statSync(join(outDir, "screenshots", shot)).size;
    if (size > SCREENSHOT_MAX_BYTES)
      fail(`screenshot ${shot} is ${size} bytes, over the ${SCREENSHOT_MAX_BYTES} byte cap`);
  }
  const dossierPath = join(outDir, "dossier.json");
  const dossierBytes = readFileSync(dossierPath);
  if (dossierBytes.length > DOSSIER_MAX_BYTES)
    fail(`dossier.json is ${dossierBytes.length} bytes, over the ${DOSSIER_MAX_BYTES} byte cap`);
  let dossier;
  try {
    dossier = JSON.parse(dossierBytes.toString("utf8"));
  } catch {
    fail("dossier.json does not parse as JSON");
  }
  if (typeof dossier !== "object" || dossier === null) fail("dossier.json is not an object");
  if (typeof dossier.text !== "string" || dossier.text.length === 0)
    fail("dossier.json has no dossier text");
  if (!Array.isArray(dossier.images) || dossier.images.length !== shots.length)
    fail(`dossier.json holds ${Array.isArray(dossier.images) ? dossier.images.length : 0} images for ${shots.length} screenshots`);
  if (typeof dossier.cover !== "number" || dossier.cover < 0 || dossier.cover >= shots.length)
    fail("dossier.json names no valid cover screenshot");
  if (typeof dossier.schema !== "string" || dossier.schema.length === 0)
    fail("dossier.json has no schema");
  if (!existsSync(join(outDir, "app", "index.html"))) fail("app/index.html is missing from the output");
}

mkdirSync(out, { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots")))
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in
// app/ or 16 MiB of app files: app/ counts beside /output's own 1000-entry
// cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);

// Refuse a broken hand-in instead of submitting it: the written dossier is
// re-read and checked against the gate's caps and shape before this program
// reports success, so a bad build can never pass as a good one.
verifyOutput(out);
