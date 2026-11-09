#!/usr/bin/env node
/* Captures the screenshots used on the NFC Studio product page
   (nfc-studio/index.html) from the real tool, nfc-studio/app.html.

     node scripts/dev-server.js 8772 &      # in another terminal, or backgrounded
     node scripts/shots-nfc.js [baseUrl]    # default http://localhost:8772

   Writes into nfc-studio/img/:
     sample-logo.svg     the made-up logo that gets fed to the tool
     card-face.webp      card-face preview: 3 logo colours + company text
     card-3d.webp        3D preview after "Build mesh"
     parts.webp          part list with the sealed-tag pause banner
     keychain.webp       a keychain preset (Keychain 45 x 28, keyring hole)
     keychain-3d.webp    the same keychain in 3D
     app.webp            the whole tool, for the hero
     og.png              1200 x 630 Open Graph image

   Re-runnable: every run starts from a fresh browser profile (no saved
   settings), drives the app only through its visible controls, and overwrites
   the files above. Images are encoded as WebP in the page itself, and quality
   steps down until each file is under MAX_BYTES. */
"use strict";
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");

const BASE = (process.argv[2] || "http://localhost:8772").replace(/\/$/, "");
const OUT = path.join(__dirname, "..", "nfc-studio", "img");
const MAX_BYTES = 400 * 1024;
fs.mkdirSync(OUT, { recursive: true });

/* A made-up maker brand: a pine, a ridge and a sun. Three flat colours on a
   transparent background, the way a real logo usually arrives. */
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
  <circle cx="640" cy="330" r="150" fill="#f08a24"/>
  <path d="M60 860 L380 420 L520 600 L640 470 L940 860 Z" fill="#2c6e68"/>
  <path d="M300 900 L300 820 L190 820 L300 690 L225 690 L330 560 L265 560 L380 380 L495 560 L430 560 L535 690 L460 690 L570 820 L460 820 L460 900 Z" fill="#1d3b2f"/>
</svg>
`;
const logoPath = path.join(OUT, "sample-logo.svg");
fs.writeFileSync(logoPath, LOGO);

const CARD = "#ece3d2";                       // AMS 1: a cream card body
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Encode a PNG buffer as WebP inside the page (no native image deps needed). */
async function saveWebp(page, png, name, { maxW, w } = {}) {
  let q = 0.9, buf;
  for (;;) {
    const b64 = await page.evaluate(async ({ src, q, maxW, w }) => {
      const img = new Image();
      await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = src; });
      const s = w ? w / img.naturalWidth : maxW && img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      const x = c.getContext("2d"); x.imageSmoothingQuality = "high";
      x.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL("image/webp", q).split(",")[1];
    }, { src: "data:image/png;base64," + png.toString("base64"), q, maxW, w });
    buf = Buffer.from(b64, "base64");
    if (buf.length <= MAX_BYTES || q <= 0.5) break;
    q -= 0.08;
  }
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(`  ${name.padEnd(18)} ${(buf.length / 1024).toFixed(0).padStart(4)} KB  (webp q${q.toFixed(2)})`);
}

/* Screenshot an element, then crop around the object in it: pixels that match
   `match` (a hex colour, for the flat card-face view) or, with no colour, that
   differ from the background (for the shaded 3D view). The box is padded and
   widened to `ratio`, so the framing holds whatever size the app draws at.
   The bottom `skip` fraction is ignored (dimension labels live there). */
async function shotObject(page, sel, { ratio = 16 / 9, pad = 0.08, match = null, skip = 0.04 } = {}) {
  // the status chip (#overlay) repeats the size we already caption; keep it out of these crops
  await page.evaluate(() => { const o = document.getElementById("overlay"); if (o) o.style.visibility = "hidden"; });
  const png = await page.locator(sel).screenshot({ animations: "disabled" });
  await page.evaluate(() => { const o = document.getElementById("overlay"); if (o) o.style.visibility = ""; });
  const b64 = await page.evaluate(async ({ src, ratio, pad, match, skip }) => {
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = src; });
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, W, H).data;
    const ref = match ? [1, 3, 5].map(i => parseInt(match.slice(i, i + 2), 16)) : [d[0], d[1], d[2]];
    const tol = match ? 18 : 40;
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H * (1 - skip); y += 2) for (let xx = 0; xx < W; xx += 2) {
      const i = (y * W + xx) * 4;
      const dist = Math.abs(d[i] - ref[0]) + Math.abs(d[i + 1] - ref[1]) + Math.abs(d[i + 2] - ref[2]);
      if (match ? dist < tol : dist > tol) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 <= x0) { x0 = 0; y0 = 0; x1 = W; y1 = H; }
    let w = x1 - x0, h = y1 - y0;
    const p = Math.max(w, h) * pad; w += 2 * p; h += 2 * p;
    if (w / h < ratio) w = h * ratio; else h = w / ratio;
    let cx = (x0 + x1) / 2 - w / 2, cy = (y0 + y1) / 2 - h / 2;
    cx = Math.max(0, Math.min(cx, W - w)); cy = Math.max(0, Math.min(cy, H - h));
    const o = document.createElement("canvas"); o.width = Math.round(w); o.height = Math.round(h);
    const ox = o.getContext("2d"); ox.fillStyle = `rgb(${d[0]},${d[1]},${d[2]})`; ox.fillRect(0, 0, o.width, o.height);
    ox.drawImage(c, -cx, -cy);
    return o.toDataURL("image/png").split(",")[1];
  }, { src: "data:image/png;base64," + png.toString("base64"), ratio, pad, match, skip });
  return Buffer.from(b64, "base64");
}

async function setVal(page, id, v) {
  await page.evaluate(([id, v]) => {
    const e = document.getElementById(id);
    if (e.type === "checkbox") e.checked = !!v; else e.value = v;
    e.dispatchEvent(new Event("input", { bubbles: true }));
    e.dispatchEvent(new Event("change", { bubbles: true }));
  }, [id, v]);
}
async function openSections(page) {        // sections are <details>; open them so controls are live
  await page.evaluate(() => document.querySelectorAll("details.sec").forEach(d => d.open = true));
}
async function view(page, v) {
  await page.click(`.tab[data-v="${v}"]`);
  await sleep(500);
}
async function build(page) {
  await page.click("#btnBuild");
  await page.waitForFunction(() => /^Built /.test(document.getElementById("stat").textContent), null, { timeout: 60000 });
  await sleep(600);
}
async function shotEl(page, sel, opts = {}) {
  return page.locator(sel).screenshot({ animations: "disabled", ...opts });
}

(async () => {
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: "dark" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });

  await page.goto(`${BASE}/nfc-studio/app.html`, { waitUntil: "networkidle" });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: "networkidle" });
  await openSections(page);
  console.log("NFC Studio shots →", path.relative(process.cwd(), OUT) || OUT);

  /* ── 1. the business card ── */
  await page.selectOption("#preset", "cr80");                // 85.6 × 54 × 2.5, 25 mm tag, sealed
  await page.setInputFiles("#file", logoPath);
  await page.waitForFunction(() => /loaded/i.test(document.getElementById("stat").textContent), null, { timeout: 20000 });
  await setVal(page, "k", "3");
  // wait for the colour separation to settle: card + 3 real (non-placeholder) swatches
  await page.waitForFunction(() => {
    const v = [...document.querySelectorAll("#swatches input[type=color]")].map(e => e.value);
    return v.length === 4 && v.slice(1).every(h => h !== "#888888");
  }, null, { timeout: 20000 });
  await sleep(800);
  await page.locator("#swatches input[type=color]").first().fill(CARD);   // AMS 1: a cream card
  await setVal(page, "artScale", "38");
  await setVal(page, "artX", "-24");
  await setVal(page, "artY", "1");
  // freeze the detected palette so the colour order can't shift between preview and build
  await setVal(page, "lockPal", true);
  await setVal(page, "txOn", true);
  await setVal(page, "tx1", "NORTHPINE");
  await setVal(page, "tx2", "PRINT CO.");
  await setVal(page, "tx3", "Tap for contact");
  await setVal(page, "txFont", "Arial Black");
  await setVal(page, "txAlign", "left");
  await setVal(page, "txSize", "3.5");
  await setVal(page, "txX", "-3");
  await setVal(page, "txY", "4");
  // print the text in the darkest logo colour (palette order is auto-detected, so look it up)
  const dark = await page.$$eval("#swatches input[type=color]", els => {
    const lum = h => { const n = parseInt(h.slice(1), 16); return 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255); };
    let best = 1; els.slice(1).forEach((e, i) => { if (lum(e.value) < lum(els[best].value)) best = i + 1; });
    return best;
  });
  await setVal(page, "txSlot", String(dark));
  await sleep(800);
  await view(page, "2d");
  await saveWebp(page, await shotObject(page, "#stage", { ratio: 3 / 2, match: CARD, pad: 0.025 }), "card-face.webp", { w: 1800 });

  await build(page);

  // the part list scrolls inside a 150 px strip in the app; let it show in full for the shot
  // (the free-plan note is hidden: a Pro licence doesn't show it, and this shot is about the pause)
  await page.addStyleTag({ content: "#partlist{max-height:none!important} #partlist .freenote{display:none!important}" });
  await sleep(200);
  await saveWebp(page, await shotEl(page, "#partlist"), "parts.webp", { w: 2000 });

  // the whole tool, for the hero and the OG image
  await view(page, "2d");
  await saveWebp(page, await page.screenshot({ animations: "disabled" }), "app.webp", { w: 2400 });
  {
    const og = await shotObject(page, "#stage", { ratio: 1200 / 630, match: CARD, pad: 0.1 });
    // scale the card-face crop to exactly 1200 × 630
    const b64 = await page.evaluate(async src => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = src; });
      const c = document.createElement("canvas"); c.width = 1200; c.height = 630;
      const x = c.getContext("2d");
      x.fillStyle = "#0f1114"; x.fillRect(0, 0, 1200, 630);
      const s = Math.max(1200 / img.naturalWidth, 630 / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      x.imageSmoothingQuality = "high";
      x.drawImage(img, (1200 - w) / 2, (630 - h) / 2, w, h);
      return c.toDataURL("image/png").split(",")[1];
    }, "data:image/png;base64," + og.toString("base64"));
    const buf = Buffer.from(b64, "base64");
    fs.writeFileSync(path.join(OUT, "og.png"), buf);
    console.log(`  ${"og.png".padEnd(18)} ${(buf.length / 1024).toFixed(0).padStart(4)} KB`);
  }

  /* 3D preview. The text is switched off for this one: the 3D view draws the
     print-space (mirrored) model, so lettering would read backwards there. */
  await setVal(page, "txOn", false);
  await sleep(400);
  await build(page);
  await view(page, "3d");
  await saveWebp(page, await shotObject(page, "#stage", { ratio: 16 / 10 }), "card-3d.webp", { w: 1800 });

  /* ── 2. a keychain preset ── */
  await page.selectOption("#preset", "kcRect");             // 45 × 28 × 3, 22 mm tag, hole top left
  await setVal(page, "artScale", "62");
  await setVal(page, "artX", "3");
  await setVal(page, "artY", "0");
  await sleep(800);
  await view(page, "2d");
  await saveWebp(page, await shotObject(page, "#stage", { ratio: 16 / 10, match: CARD, pad: 0.03 }), "keychain.webp", { w: 1800 });
  await build(page);
  await view(page, "3d");
  await saveWebp(page, await shotObject(page, "#stage", { ratio: 16 / 10 }), "keychain-3d.webp", { w: 1800 });

  await browser.close();
  if (errors.length) { console.warn("Console errors in the app:\n  " + errors.join("\n  ")); process.exitCode = 1; }
})().catch(e => { console.error(e); process.exit(1); });
