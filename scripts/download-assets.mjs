// Downloads every image and video from the Figma Site into ./assets
// Run once from the project folder:  node scripts/download-assets.mjs
// Needs Node 18+ (built-in fetch). Re-running skips files you already have.

import { writeFile, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://elarosenai.figma.site";
const ASSETS = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");

const files = {
  // Video ads variations (/videos)
  "videos-hero.mp4":          "/_videos/v1/dc2188324906fdd4ae172b0c1dc9976cbd689254",
  "videos-challenge.mp4":     "/_videos/v1/532ff6f800cc18a3f9cf25b35a0650e8b197ac00",
  "videos-architecture.png":  "/_assets/v11/743a92cfd6e97703e3952012f7dbf430df0849c4.png",
  "videos-hitl.mp4":          "/_videos/v1/1b036672667af830ba7a57306892d21d2b6e9801",
  "videos-bottlenecks.mp4":   "/_videos/v1/aa80b4ff2bb407ee814187134fb58637f0217baf",
  "videos-next-steps.mp4":    "/_videos/v1/59edea9d57142550c2716eadadb6139a7622351f",

  // Batch image gen (/batch)
  "batch-grid-1.png":         "/_assets/v11/6254bca7cea42538168a246dc67847bbd38067e4.png",
  "batch-grid-2.png":         "/_assets/v11/a6584636348a208026f9e195f98a4a71d7b2c856.png",
  "batch-grid-3.png":         "/_assets/v11/f1c19e0109ff720e554b6af85f7333c328cfea2c.png",
  "batch-grid-4.png":         "/_assets/v11/552429ebe1def6451b3f74c17b7307d3cfbc1d1f.png",
  "batch-grid-5.png":         "/_assets/v11/313c7d21e2e59d858b0d7b71aaeae3062e2291cc.png",
  "batch-grid-6.png":         "/_assets/v11/589cb0f9b4ff53d7f7c089a402383c0b969e955a.png",
  "batch-challenge.mp4":      "/_videos/v1/6a10791eb2fa4463b6a70a8e364a2af0f9371075",
  "batch-flow.mp4":           "/_videos/v1/b9ce6306be6a56bc7d37de2d995b2fa47cd3ecf2",
  "batch-bottlenecks.png":    "/_assets/v11/2c01db9f3060ed2addf13ef9f6b044e4ae04f012.png",

  // Character re-skin (/reskin)
  "reskin-hero.png":          "/_assets/v11/39adef5f7dbf7491050c36374e7987ae18833f0a.png",
  "reskin-solution.png":      "/_assets/v11/ec13e77eac9b829623133836d0593cd02ae1b48a.png",

  // LoRA training (/loras)
  "loras-hero.png":           "/_assets/v11/8fd661087ac3e8a5bdfa694c6d176485301ac2d0.png",
  "loras-challenge-1.png":    "/_assets/v11/b71b20093304748b9cb6df00a74ba16b6b7793c0.png",
  "loras-challenge-2.png":    "/_assets/v11/b95bc4e7bb1e1a87ec263d126d56203f2d6f909c.png",
  "loras-hitl.png":           "/_assets/v11/eb1977b7a4e9b1151d9e55425e80c0684a68b98a.png",
};

await mkdir(ASSETS, { recursive: true });

let failed = 0;
for (const [name, path] of Object.entries(files)) {
  const dest = join(ASSETS, name);
  try {
    await access(dest);
    console.log(`skip  ${name} (already downloaded)`);
    continue;
  } catch {}

  try {
    const res = await fetch(SITE + path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, buf);
    console.log(`ok    ${name}  ${(buf.length / 1048576).toFixed(1)} MB`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${name}: ${err.message}`);
  }
}

console.log(failed ? `\n${failed} file(s) failed. Run again to retry.` : "\nAll assets downloaded.");
process.exit(failed ? 1 : 0);
