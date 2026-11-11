#!/usr/bin/env node
/* Screenshots for the Vectorizer product page (vectorizer/index.html).

     node scripts/dev-server.js 8773 &      # in another terminal
     node scripts/shots-vectorizer.js [baseURL]

   Re-runnable: it regenerates the sample inputs (Python + Pillow, into a temp
   folder, so nothing extra ships), drives the real tool at
   <baseURL>/vectorizer/app.html with Playwright, and overwrites the images in
   vectorizer/img/. Page images are written as WebP (converted with Pillow);
   the Open Graph card is a JPEG because some link unfurlers skip WebP.

   Images
     before-after.webp   original vs traced SVG (flat 3-colour logo)
     maker-exports.webp  the Pro maker-exports row (mm width, layers, DXF, batch)
     p3-cutter.webp      "Print it in 3D" panel, cookie cutter (marker doodle)
     p3-stencil.webp     "Print it in 3D" panel, stencil with bridges ("BOO")
     out-cutter.webp     preview only: cookie cutter
     out-stamp.webp      preview only: stamp
     out-stencil.webp    preview only: stencil
     out-plaque.webp     preview only: multi-colour plaque with magnet pocket
     og.jpg              1200×630 social card */
"use strict";
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs"), os = require("os"), path = require("path");

const BASE = (process.argv[2] || "http://localhost:8773").replace(/\/$/, "");
const APP = BASE + "/vectorizer/app.html";
const OUT = path.join(__dirname, "..", "vectorizer", "img");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "veer-vec-shots-"));
const MAX_BYTES = 400 * 1024;
fs.mkdirSync(OUT, { recursive: true });

/* ───────── sample inputs ───────── */
const PY_SAMPLES = String.raw`
import sys, math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
out = sys.argv[1]
FONT = None
for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
          "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]:
    if os.path.exists(f): FONT = f; break

# 1. A flat three-colour logo on white: teal disc, mustard ring, coral heart.
S = 4; W = 900
im = Image.new("RGB", (W*S, W*S), "white"); d = ImageDraw.Draw(im)
c = W*S/2
def circ(r, fill): d.ellipse([c-r, c-r, c+r, c+r], fill=fill)
circ(400*S, "#1d6b73"); circ(330*S, "#f2b134"); circ(282*S, "#1d6b73")
# heart: two circles + a triangle
hr = 92*S; hy = c - 40*S
d.ellipse([c-2*hr+12*S, hy-hr, c+12*S, hy+hr], fill="#e9573f")
d.ellipse([c-12*S, hy-hr, c+2*hr-12*S, hy+hr], fill="#e9573f")
d.polygon([(c-2*hr+16*S, hy+30*S), (c+2*hr-16*S, hy+30*S), (c, hy+235*S)], fill="#e9573f")
# hard edges, like a flat export from a design app: exactly four colours
im.resize((W, W), Image.NEAREST).save(os.path.join(out, "logo.png"))

# 2. Bold black lettering: every letter has an enclosed centre.
font = ImageFont.truetype(FONT, 420)
im = Image.new("RGB", (1400, 620), "white"); d = ImageDraw.Draw(im)
bb = d.textbbox((0, 0), "BOO", font=font)
d.text(((1400-(bb[2]-bb[0]))/2 - bb[0], (620-(bb[3]-bb[1]))/2 - bb[1]), "BOO", font=font, fill="#111111")
im.save(os.path.join(out, "boo.png"))

# 3. A marker doodle of a gingerbread person: wobbly outline, dot eyes,
#    a smile and three buttons, on white paper.
S = 2; W, H = 900, 1000
m = Image.new("L", (W*S, H*S), 0); d = ImageDraw.Draw(m)
def disc(x, y, r): d.ellipse([(x-r)*S, (y-r)*S, (x+r)*S, (y+r)*S], fill=255)
def limb(x0, y0, x1, y1, r):
    n = 40
    for i in range(n+1):
        t = i/n; disc(x0+(x1-x0)*t, y0+(y1-y0)*t, r)
disc(450, 230, 140)                      # head
d.rounded_rectangle([300*S, 330*S, 600*S, 700*S], radius=120*S, fill=255)  # body
limb(350, 420, 165, 520, 62); limb(550, 420, 735, 500, 62)                 # arms
limb(380, 640, 285, 880, 70); limb(520, 640, 625, 870, 70)                 # legs
a = np.asarray(m, dtype=np.uint8)
# smooth wobble so it reads as hand-drawn rather than CAD
yy, xx = np.mgrid[0:H*S, 0:W*S].astype(np.float32)
dx = 9*S*np.sin(yy/(61*S)) + 5*S*np.sin(xx/(37*S) + 1.3)
dy = 8*S*np.sin(xx/(53*S) + 0.7) + 4*S*np.sin(yy/(29*S))
sx = np.clip((xx+dx).round().astype(int), 0, W*S-1); sy = np.clip((yy+dy).round().astype(int), 0, H*S-1)
a = a[sy, sx]
sil = Image.fromarray(a)
k = 2*8*S + 1
outer = sil.filter(ImageFilter.MaxFilter(k)); inner = sil.filter(ImageFilter.MinFilter(k))
stroke = np.asarray(outer, dtype=np.int16) - np.asarray(inner, dtype=np.int16)
paper = Image.new("RGB", (W*S, H*S), "white")
ink = Image.new("RGB", (W*S, H*S), "#26201c")
paper.paste(ink, (0, 0), Image.fromarray((stroke > 128).astype(np.uint8)*255))
d = ImageDraw.Draw(paper)
def dot(x, y, r): d.ellipse([(x-r)*S, (y-r)*S, (x+r)*S, (y+r)*S], fill="#26201c")
dot(400, 205, 20); dot(500, 205, 20)
d.arc([385*S, 210*S, 515*S, 300*S], 20, 160, fill="#26201c", width=16*S)
for y in (430, 520, 610): dot(450, y, 18)
paper.resize((W, H), Image.LANCZOS).save(os.path.join(out, "doodle.png"))
print("ok")
`;
execFileSync("python3", ["-I", "-", TMP], { input: PY_SAMPLES, stdio: ["pipe", "inherit", "inherit"] });

/* ───────── image writing ───────── */
const PY_CONVERT = String.raw`
import sys
from PIL import Image
src, dst, fmt, q, maxb = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
im = Image.open(src).convert("RGB")
import io
while True:
    b = io.BytesIO()
    if fmt == "webp": im.save(b, "WEBP", quality=q, method=6)
    else: im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    if b.tell() <= maxb or q <= 50: break
    q -= 6
open(dst, "wb").write(b.getvalue())
print(im.size[0], im.size[1], b.tell(), q)
`;
const manifest = {};
function save(name, png, fmt = "webp") {
  const tmp = path.join(TMP, name + ".png");
  fs.writeFileSync(tmp, png);
  const dst = path.join(OUT, name + "." + (fmt === "webp" ? "webp" : "jpg"));
  const r = execFileSync("python3", ["-I", "-c", PY_CONVERT, tmp, dst, fmt, fmt === "webp" ? "86" : "84", String(MAX_BYTES)]).toString().trim().split(" ");
  manifest[path.basename(dst)] = { width: +r[0], height: +r[1], bytes: +r[2] };
  console.log(`  ${path.basename(dst).padEnd(20)} ${r[0]}×${r[1]}  ${(r[2] / 1024).toFixed(0)} KB  (q${r[3]})`);
}

/* ───────── driving the tool ───────── */
async function load(page, file, preset, colors) {
  await page.goto(APP, { waitUntil: "load" });
  await page.setInputFiles("#file", path.join(TMP, file));
  await page.waitForSelector("#svgOut svg", { timeout: 20000 });
  if (preset) await page.click(`#presets [data-p=${preset}]`);
  if (colors) await page.evaluate(c => { const e = document.getElementById("colors"); e.value = c; e.dispatchEvent(new Event("input", { bubbles: true })); }, colors);
  await page.waitForTimeout(700);
  await page.waitForFunction(() => !document.querySelector("#svgBox").classList.contains("tracing"));
  await settle(page);
  console.log(`  ${file}: ` + await page.$eval("#svgMeta", e => e.textContent));
}
// the 3D preview re-plans 160 ms after any change; wait for it to draw
async function settle(page) {
  await page.waitForTimeout(500);
  await page.waitForFunction(() => {
    const l = window.__veerPrint3d && window.__veerPrint3d.last();
    return l && !l.err;
  }, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(250);
}
async function mode(page, m) {
  await page.click(`#p3Seg [data-m=${m}]`);
  await settle(page);
}
async function setVal(page, sel, v) {
  await page.evaluate(([s, v]) => {
    const el = document.querySelector(s); if (!el) return;
    if (el.type === "checkbox") el.checked = !!v; else el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, [sel, v]);
  await settle(page);
}
// element screenshot with a little breathing room, clipped to the page
async function shot(page, sel, pad = 0) {
  const el = await page.$(sel);
  if (!el) throw new Error("missing element " + sel);
  await el.scrollIntoViewIfNeeded();
  const b = await el.boundingBox();
  const sy = await page.evaluate(() => window.scrollY), sx = await page.evaluate(() => window.scrollX);
  const vw = page.viewportSize().width;
  const x = Math.max(0, b.x + sx - pad), y = Math.max(0, b.y + sy - pad);
  return page.screenshot({ clip: { x, y, width: Math.min(vw - x, b.width + 2 * pad), height: b.height + 2 * pad }, fullPage: true });
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 1000 }, deviceScaleFactor: 2, colorScheme: "dark" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  console.log("Samples in " + TMP + "\nWriting to " + OUT);

  // 1. before / after + maker exports: the three-colour logo
  await load(page, "logo.png", "logo");
  save("before-after", await shot(page, ".panes"));
  save("maker-exports", await shot(page, ".maker", 14));

  // multi-colour plaque with a magnet pocket (same logo)
  await mode(page, "plaque");
  await setVal(page, "#pShape", "circle");
  await setVal(page, "#pMag", true);
  await setVal(page, "#p3W", 80);
  save("out-plaque", await shot(page, ".p3-prev"));

  // 2. the marker doodle as a cookie cutter
  await load(page, "doodle.png", null, 4);
  await mode(page, "cutter");
  await setVal(page, "#p3W", 90);
  save("p3-cutter", await shot(page, "#p3d"));
  save("out-cutter", await shot(page, ".p3-prev"));

  // the same doodle as a round cookie stamp (marker lines become the relief)
  await mode(page, "stamp");
  await setVal(page, "#sShape", "circle");
  save("out-stamp", await shot(page, ".p3-prev"));
  await mode(page, "cutter");

  // OG card: 1200×630 at 1×, the before/after of the doodle beside the cutter
  {
    const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    const doodle = "data:image/png;base64," + fs.readFileSync(path.join(TMP, "doodle.png")).toString("base64");
    const cutter = "data:image/png;base64," + fs.readFileSync(path.join(TMP, "out-cutter.png")).toString("base64");
    await og.setContent(`<!doctype html><html><head>
      <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,600..900&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
      <style>
      body{margin:0;width:1200px;height:630px;background:#0f1114;color:#f2efe9;font-family:Archivo,sans-serif;overflow:hidden;
        background-image:linear-gradient(#ffffff0a 1px,transparent 1px),linear-gradient(90deg,#ffffff0a 1px,transparent 1px);background-size:50px 50px}
      .t{position:absolute;left:64px;top:60px;font-stretch:112%;font-weight:800;font-size:58px;line-height:1.02;letter-spacing:-.02em;width:560px}
      .t em{font-style:normal;background:linear-gradient(96deg,#ef4037,#f69322 62%,#ffd9a1);-webkit-background-clip:text;color:transparent}
      .m{position:absolute;left:64px;bottom:58px;font:500 18px "JetBrains Mono",monospace;letter-spacing:.08em;color:#a5a39e;text-transform:uppercase}
      .m b{color:#f69322;font-weight:500}
      .a{position:absolute;left:584px;top:318px;width:190px;height:211px;background:#fff;border-radius:10px;padding:10px;box-sizing:border-box;z-index:2;box-shadow:0 20px 50px -10px #000c;transform:rotate(-3deg)}
      .a img{width:100%;height:100%;object-fit:contain}
      .b{position:absolute;right:48px;top:118px;width:500px;height:392px;border-radius:14px;overflow:hidden;border:1px solid #2c3037;background:#17191d}
      .b img{width:100%;height:100%;object-fit:contain}
      </style></head><body>
      <div class="t">A drawing in.<br>A <em>cookie cutter</em> out.</div>
      <div class="m"><b>Veer Vectorizer</b> · PNG → SVG · DXF · STL</div>
      <div class="a"><img src="${doodle}" alt=""></div>
      <div class="b"><img src="${cutter}" alt=""></div>
      </body></html>`, { waitUntil: "networkidle" }).catch(() => {});
    await og.waitForTimeout(400);
    save("og", await og.screenshot(), "jpg");
    await og.close();
  }

  // 3. "BOO" as a stencil with automatic bridges
  await load(page, "boo.png", "bw");
  await mode(page, "stencil");
  await setVal(page, "#p3W", 160);
  save("p3-stencil", await shot(page, "#p3d"));
  save("out-stencil", await shot(page, ".p3-prev"));

  fs.writeFileSync(path.join(OUT, "shots.json"), JSON.stringify(manifest, null, 2) + "\n");
  await browser.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  if (errors.length) { console.error("Console errors in the tool:\n  " + errors.join("\n  ")); process.exitCode = 1; }
  else console.log("Done, no console errors.");
})().catch(e => { console.error(e); process.exit(1); });
