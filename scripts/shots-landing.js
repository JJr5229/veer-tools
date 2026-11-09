#!/usr/bin/env node
/* Screenshots for the landing page (index.html → img/).

     node scripts/shots-landing.js            # starts its own dev server on 8771
     node scripts/shots-landing.js 8771 --no-server   # use a server you already run

   Loads each tool's app.html, puts it in a realistic state (a sample logo
   drawn on a canvas, a name typed in, a mesh built), captures at
   deviceScaleFactor 2 and re-encodes in the browser to WebP (JPEG for the
   Open Graph card) so each file stays well under ~400 KB.

   Re-runnable: it overwrites img/*.webp and img/og.jpg. Nothing here depends on
   the tools' internal JS beyond element ids that are in their markup
   (#file, #k, #l1, #l2, #font, .tab[data-v], #btnBuild, #p3Seg …). */
"use strict";
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), http = require("http");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "img");
const PORT = +process.argv[2] || 8771;
const OWN_SERVER = !process.argv.includes("--no-server");
const BASE = `http://localhost:${PORT}`;
const DPR = 2;

fs.mkdirSync(OUT, { recursive: true });

function up(url) {
  return new Promise(res => {
    const r = http.get(url, x => { x.resume(); res(x.statusCode < 500); });
    r.on("error", () => res(false));
    r.setTimeout(800, () => { r.destroy(); res(false); });
  });
}
async function ensureServer() {
  if (await up(BASE + "/")) return null;
  if (!OWN_SERVER) throw new Error("No server on " + BASE);
  const p = spawn(process.execPath, [path.join(__dirname, "dev-server.js"), String(PORT)], { stdio: "ignore" });
  for (let i = 0; i < 50; i++) { if (await up(BASE + "/")) return p; await sleep(100); }
  throw new Error("dev-server did not start");
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── sample artwork, drawn in the browser so the script needs no Python ── */
// A fictional maker's badge ("Fernway"): orange ring, cream sky, orange sun,
// dark-teal peaks, cream river. Three flat colours with anti-aliased edges,
// like a real exported PNG. `transparent` drops the white backdrop.
async function sampleLogo(page, { size = 1200, transparent = false } = {}) {
  const dataUrl = await page.evaluate(({ size, transparent }) => {
    const c = document.createElement("canvas"); c.width = size; c.height = size;
    const g = c.getContext("2d");
    if (!transparent) { g.fillStyle = "#ffffff"; g.fillRect(0, 0, size, size); }
    const s = size / 1000, cx = 500 * s, cy = 500 * s;
    const ORANGE = "#ee8a1e", CREAM = "#f6ead2", TEAL = "#17363c";
    g.fillStyle = ORANGE; g.beginPath(); g.arc(cx, cy, 460 * s, 0, Math.PI * 2); g.fill();
    g.fillStyle = CREAM; g.beginPath(); g.arc(cx, cy, 372 * s, 0, Math.PI * 2); g.fill();
    g.fillStyle = ORANGE; g.beginPath(); g.arc(cx + 120 * s, cy - 130 * s, 88 * s, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, 372 * s, 0, Math.PI * 2); g.clip();
    g.fillStyle = TEAL; g.beginPath();
    g.moveTo(cx - 420 * s, cy + 420 * s); g.lineTo(cx - 420 * s, cy + 130 * s);
    g.lineTo(cx - 170 * s, cy - 160 * s); g.lineTo(cx - 30 * s, cy + 10 * s);
    g.lineTo(cx + 70 * s, cy - 80 * s); g.lineTo(cx + 420 * s, cy + 220 * s);
    g.lineTo(cx + 420 * s, cy + 420 * s); g.closePath(); g.fill();
    g.fillStyle = CREAM; g.beginPath();
    g.moveTo(cx - 170 * s, cy - 160 * s); g.lineTo(cx - 98 * s, cy - 76 * s); g.lineTo(cx - 138 * s, cy - 92 * s);
    g.lineTo(cx - 172 * s, cy - 62 * s); g.lineTo(cx - 212 * s, cy - 104 * s); g.closePath(); g.fill();
    g.strokeStyle = CREAM; g.lineWidth = 34 * s; g.lineCap = "round"; g.beginPath();
    g.moveTo(cx - 30 * s, cy + 420 * s);
    g.bezierCurveTo(cx + 130 * s, cy + 300 * s, cx - 130 * s, cy + 230 * s, cx + 40 * s, cy + 120 * s); g.stroke();
    g.restore();
    return c.toDataURL("image/png");
  }, { size, transparent });
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

// A heart with a scalloped edge and a cut-out initial: Etsy cookie-cutter fare.
async function sampleHeart(page, size = 900) {
  const dataUrl = await page.evaluate(size => {
    const c = document.createElement("canvas"); c.width = size; c.height = size;
    const g = c.getContext("2d"), s = size / 1000;
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, size, size);
    const heart = (r) => {
      g.beginPath();
      for (let i = 0; i <= 720; i++) {
        const t = i / 720 * Math.PI * 2;
        const x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const w = 1 + 0.03 * Math.cos(t * 22);           // scalloped edge
        const px = 500 * s + x * r * w * s, py = 470 * s - y * r * w * s;
        i ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath();
    };
    g.fillStyle = "#c2262e"; heart(26); g.fill();
    g.fillStyle = "#ffffff"; g.font = `700 ${380 * s}px Georgia, serif`;
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("M", 500 * s, 470 * s);
    return c.toDataURL("image/png");
  }, size);
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

/* ── capture + re-encode ── */
// Screenshot (PNG at DPR 2) → decode in the page → scale to `width` CSS→px →
// encode WebP (or JPEG). Keeps everything inside Chromium.
async function encode(page, png, { width, height, type = "image/webp", quality = 0.86 }) {
  const b64 = await page.evaluate(async ({ src, width, height, type, quality }) => {
    const img = new Image(); img.src = src; await img.decode();
    const w = Math.min(width, img.naturalWidth), h = height || Math.round(img.naturalHeight * w / img.naturalWidth);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, w, h);
    return c.toDataURL(type, quality).split(",")[1];
  }, { src: "data:image/png;base64," + png.toString("base64"), width, height, type, quality });
  return Buffer.from(b64, "base64");
}
async function save(page, name, png, opts) {
  let q = opts.quality || 0.86, buf;
  for (;;) {                                   // step quality down until under budget
    buf = await encode(page, png, { ...opts, quality: q });
    if (buf.length <= (opts.budget || 380e3) || q <= 0.6) break;
    q -= 0.06;
  }
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(`  ${name.padEnd(24)} ${(buf.length / 1024).toFixed(0).padStart(4)} KB  (q ${q.toFixed(2)})`);
}

async function newPage(browser, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: DPR });
  const page = await ctx.newPage();
  page.on("pageerror", e => console.warn("   pageerror:", e.message));
  page.on("console", m => { if (m.type() === "error") console.warn("   console:", m.text()); });
  return page;
}
async function fresh(page, url) {
  await page.goto(BASE + url);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts && document.fonts.ready);
}

// Drag on a canvas to orbit the tool's 3D camera, then wheel to zoom.
async function orbit(page, sel, dx, dy, wheel) {
  const bb = await page.locator(sel).boundingBox();
  const x = bb.x + bb.width / 2, y = bb.y + bb.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 6 }); await page.mouse.up();
  if (wheel) { await page.mouse.move(x, y); await page.mouse.wheel(0, wheel); }
  await page.waitForTimeout(400);
}
async function shotOf(page, sel) {
  await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  await page.mouse.move(0, 0);
  return page.locator(sel).screenshot();
}

// Screenshot the middle band of an element, `ratio` = height / width.
async function band(page, sel, ratio) {
  await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  await page.mouse.move(0, 0);
  const bb = await page.locator(sel).boundingBox();
  const h = Math.min(bb.height, bb.width * ratio);
  return page.screenshot({ clip: { x: bb.x, y: bb.y + (bb.height - h) / 2, width: bb.width, height: h } });
}

/* ── NFC Studio ── */
async function nfc(browser) {
  console.log("NFC Studio");
  const page = await newPage(browser, 1440, 900);
  await fresh(page, "/nfc-studio/app.html");
  await page.setInputFiles("#file", { name: "fernway-badge.png", mimeType: "image/png", buffer: await sampleLogo(page, { transparent: true }) });
  await page.waitForTimeout(600);
  await page.selectOption("#k", "3");
  await page.waitForTimeout(600);
  // a natural-white PLA card body reads better than the default charcoal
  await page.locator("#swatches input[type=color]").first().fill("#c9c4ba");
  await page.locator("#artScale").fill("72");
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.waitForTimeout(700);
  await save(page, "nfc-studio-app.webp", await page.screenshot(), { width: 2000 });
  await save(page, "nfc-studio-card.webp", await shotOf(page, "#stage"), { width: 1400 });
  await page.click("#btnBuild");
  await page.waitForFunction(() => !document.getElementById("btnStl").disabled, null, { timeout: 30000 }).catch(() => {});
  await page.click('.tab[data-v="3d"]');
  await page.waitForTimeout(700);
  // View from under the card (it prints face-down), reading the right way round.
  const ok = await page.evaluate("typeof cam==='object' && (cam.az=2.86, cam.el=-0.98, cam.dist=104, drawGL(), true)").catch(() => false);
  if (!ok) await orbit(page, "#gl", -30, -22, -230);
  await page.waitForTimeout(300);
  await save(page, "nfc-studio-build.webp", await shotOf(page, "#main"), { width: 1800 });
  await page.context().close();
}

/* ── Vectorizer ── */
async function vectorizer(browser) {
  console.log("Vectorizer");
  const page = await newPage(browser, 1280, 900);
  await fresh(page, "/vectorizer/app.html");
  await page.setInputFiles("#file", { name: "fernway-badge.png", mimeType: "image/png", buffer: await sampleLogo(page, { size: 900 }) });
  await page.waitForSelector("#svgOut svg", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await save(page, "vectorizer-trace.webp", await shotOf(page, "#work .panes"), { width: 1800 });
  await page.context().close();

  // Cookie cutter from a second, single-colour drawing (a cutter only follows
  // the outside outline, so it needs a shape with some character).
  const p2 = await newPage(browser, 1280, 900);
  await fresh(p2, "/vectorizer/app.html");
  await p2.setInputFiles("#file", { name: "heart-cutter.png", mimeType: "image/png", buffer: await sampleHeart(p2) });
  await p2.waitForSelector("#svgOut svg", { timeout: 30000 }).catch(() => {});
  await p2.waitForTimeout(1000);
  await p2.click('#p3Seg [data-m="cutter"]');
  await p2.locator("#p3W").fill("80"); await p2.locator("#p3W").press("Tab");
  await p2.waitForTimeout(1500);
  await save(p2, "vectorizer-cutter.webp", await shotOf(p2, "#p3d"), { width: 1800 });
  await p2.context().close();
}

/* ── Light Box Studio ── */
async function lightbox(browser) {
  console.log("Light Box Studio");
  const page = await newPage(browser, 1440, 900);
  await fresh(page, "/lightbox/app.html");
  await page.fill("#l1", "The Harlows");
  await page.fill("#l2", "Est. 2024");
  await page.selectOption("#font", "Great Vibes");
  await page.waitForTimeout(1200);
  await save(page, "lightbox-app.webp", await page.screenshot(), { width: 2000 });
  // the customer proof PNG the tool exports (real output, not a screenshot),
  // for a second order with a different font and a coloured text filament
  try {
    await page.fill("#l1", "Mason & Ruby");
    await page.fill("#l2", "");
    await page.selectOption("#font", "Lobster");
    const tc = page.locator("#colours input[type=color]").first();
    if (await tc.count()) await tc.fill("#1f5560");
    await page.waitForTimeout(1200);
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 15000 }), page.click("#btnProof")]);
    const proof = fs.readFileSync(await dl.path());
    await save(page, "lightbox-proof.webp", proof, { width: 1600 });
    await page.fill("#l1", "The Harlows");
    await page.fill("#l2", "Est. 2024");
    await page.selectOption("#font", "Great Vibes");
    if (await tc.count()) await tc.fill("#1b1b1f");
    await page.waitForTimeout(1000);
  } catch (e) { console.warn("   proof PNG not captured:", e.message); }
  // Open Graph card: the lit sign, 1200×630 JPEG
  await save(page, "lightbox-hero.webp", await band(page, "#stage", 0.6), { width: 1800 });
  await save(page, "og.jpg", await band(page, "#stage", 0.525), { width: 1200, height: 630, type: "image/jpeg", quality: 0.84, budget: 250e3 });
  await page.context().close();
}

(async () => {
  const server = await ensureServer();
  const browser = await chromium.launch();
  try {
    const only = process.argv.find(a => a.startsWith("--only="));
    const jobs = { nfc, vectorizer, lightbox };
    for (const [k, fn] of Object.entries(jobs)) if (!only || only.slice(7).split(",").includes(k)) await fn(browser);
  } finally {
    await browser.close();
    if (server) server.kill();
  }
})().catch(e => { console.error(e); process.exit(1); });
