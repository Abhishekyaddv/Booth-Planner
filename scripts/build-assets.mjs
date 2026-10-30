// Builds the optimised assets the planner actually uses.
//
//   assets-source/kenney/{models,Isometric,Side}  (raw Kenney packs, not served)
//     → public/assets/{models,iso,side}            (compressed, served)
//     → src/lib/assetManifest.json                 (content hashes for cache-busting)
//
// Only assets named in src/lib/catalogue.ts (`asset: "..."`) are included.
// Run with: npm run assets

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, prune, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "assets-source", "kenney");
const OUT = path.join(ROOT, "public", "assets");
const MANIFEST = path.join(ROOT, "src", "lib", "assetManifest.json");
const ISO_DIRS = ["SW", "NW", "NE", "SE"];

const catalogue = await readFile(path.join(ROOT, "src", "lib", "catalogue.ts"), "utf8");
const keys = [...new Set([...catalogue.matchAll(/asset: "(\w+)"/g)].map((m) => m[1]))].sort();

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });

await rm(OUT, { recursive: true, force: true });
for (const dir of ["models", "iso", "side"]) await mkdir(path.join(OUT, dir), { recursive: true });

const manifest = {};
const totals = { before: 0, after: 0 };
const missing = [];

async function record(rel, srcFile) {
  const buf = await readFile(path.join(OUT, rel));
  manifest[rel] = createHash("sha1").update(buf).digest("hex").slice(0, 8);
  totals.before += (await stat(srcFile)).size;
  totals.after += buf.length;
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

for (const key of keys) {
  // Model: dedupe, weld, then meshopt compression (includes quantisation).
  const glbSrc = path.join(SRC, "models", `${key}.glb`);
  if (await exists(glbSrc)) {
    const doc = await io.read(glbSrc);
    await doc.transform(dedup(), prune(), weld(), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
    await io.write(path.join(OUT, "models", `${key}.glb`), doc);
    await record(`models/${key}.glb`, glbSrc);
  } else missing.push(`models/${key}.glb`);

  // Images: lossless WebP.
  const images = [
    ...ISO_DIRS.map((d) => [path.join(SRC, "Isometric", `${key}_${d}.png`), `iso/${key}_${d}.webp`]),
    [path.join(SRC, "Side", `${key}.png`), `side/${key}.webp`],
  ];
  for (const [src, rel] of images) {
    if (!(await exists(src))) {
      missing.push(rel);
      continue;
    }
    await sharp(src).webp({ lossless: true, effort: 6 }).toFile(path.join(OUT, rel));
    await record(rel, src);
  }
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`Assets: ${keys.length} items, ${Object.keys(manifest).length} files`);
console.log(`Size:   ${kb(totals.before)} → ${kb(totals.after)}`);
if (missing.length) {
  console.error(`Missing source files:\n  ${missing.join("\n  ")}`);
  process.exitCode = 1;
}
