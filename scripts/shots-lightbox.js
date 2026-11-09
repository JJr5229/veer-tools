#!/usr/bin/env node
/* Screenshots for the Light Box Studio product page (lightbox/index.html).

     node scripts/shots-lightbox.js

   Re-runnable. Starts scripts/dev-server.js on port 8774 if nothing is
   listening there, drives lightbox/app.html with Playwright (Chromium),
   and writes WebP images (each kept under ~400 KB) to lightbox/img/.

   Every image is real tool output:
     • app-*.webp       screenshots of the tool UI / its preview stage
     • proof-*.webp     the tool's own proof PNG (the "Proof image" button, or
                        for the batch row the same proofPNG() the batch zip uses)
   Input artwork (a 3-colour logo and a photo-like pet picture) is generated
   with Pillow (python3) into a temp folder, then uploaded through #file.
   Logos, lithophanes and batch are previewable on the free plan, so no
   license is needed. */
"use strict";
const { chromium } = require("playwright");
const { execFileSync, spawn } = require("child_process");
const fs = require("fs"), os = require("os"), path = require("path"), http = require("http");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "lightbox", "img");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "veer-lightbox-shots-"));
const PORT = 8774, BASE = `http://localhost:${PORT}`;
const MAX_BYTES = 400 * 1024;
fs.mkdirSync(OUT, { recursive: true });

/* ───────────── helpers ───────────── */
function py(code, ...args) { return execFileSync("python3", ["-c", code, ...args], { encoding: "utf8" }); }

function up() {
  return new Promise(res => {
    const r = http.get(BASE + "/lightbox/app.html", s => { s.resume(); res(s.statusCode === 200); });
    r.on("error", () => res(false)); r.setTimeout(1500, () => { r.destroy(); res(false); });
  });
}
async function ensureServer() {
  if (await up()) return null;
  const p = spawn(process.execPath, [path.join(ROOT, "scripts", "dev-server.js"), String(PORT)], { stdio: "ignore" });
  for (let i = 0; i < 50; i++) { if (await up()) return p; await new Promise(r => setTimeout(r, 200)); }
  throw new Error("dev server did not start on " + PORT);
}

/* PNG → WebP, stepping quality (then size) down until it fits under MAX_BYTES.
   Optional crop box [l,t,r,b] in source pixels; optional max width. */
const TO_WEBP = `
import sys, json, os
from PIL import Image
src, dst, opts = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
im = Image.open(src).convert("RGB")
if opts.get("crop"): im = im.crop(tuple(opts["crop"]))
mw = opts.get("maxw")
if mw and im.width > mw: im = im.resize((mw, round(im.height * mw / im.width)), Image.LANCZOS)
limit = opts["limit"]
while True:
    for q in (86, 80, 74, 68, 62):
        im.save(dst, "WEBP", quality=q, method=6)
        if os.path.getsize(dst) <= limit: break
    if os.path.getsize(dst) <= limit or im.width < 600: break
    im = im.resize((round(im.width * .88), round(im.height * .88)), Image.LANCZOS)
print(im.width, im.height, os.path.getsize(dst))
`;
function toWebp(src, name, opts = {}) {
  const dst = path.join(OUT, name + ".webp");
  const [w, h, b] = py(TO_WEBP, src, dst, JSON.stringify({ limit: MAX_BYTES, ...opts })).trim().split(" ");
  console.log(`  ${name}.webp  ${w}×${h}  ${(b / 1024).toFixed(0)} KB`);
  return { w: +w, h: +h };
}

/* ───────────── input artwork (Pillow) ───────────── */
const MAKE_INPUTS = `
import sys, random, math
from PIL import Image, ImageDraw, ImageFilter
out = sys.argv[1]
random.seed(7)

# 1) A simple 3-colour logo on white: sun, two mountains, a river. Flat colours,
#    so the tool's colour separation finds three clean filaments.
S = 1200
im = Image.new("RGB", (S, S), "white"); d = ImageDraw.Draw(im)
d.ellipse((330, 170, 870, 710), fill="#e8892b")                       # sun (orange)
d.polygon([(110, 900), (470, 360), (830, 900)], fill="#1d1d22")        # big mountain (black)
d.polygon([(560, 900), (820, 540), (1090, 900)], fill="#1d1d22")       # small mountain
d.polygon([(470, 360), (560, 495), (520, 470), (470, 520), (420, 470), (382, 492)], fill="white")  # snow cap
d.polygon([(330, 900), (610, 900), (700, 1030), (440, 1030)], fill="#3d9fd0")  # river (sky blue)
d.rectangle((110, 900, 1090, 935), fill="#1d1d22")                     # ground line
im.save(out + "/logo.png")

# 2) A photo-like pet picture with real tonal range: soft gradient backdrop,
#    out-of-focus lights, a dog's head-and-shoulders silhouette lit from the
#    left, a little grain. Grayscale is enough for a lithophane.
W, H = 1500, 1040
bg = Image.new("L", (W, H))
px = bg.load()
for y in range(H):
    for x in range(W):
        v = 70 + 150 * (x / W) * 0.55 + 90 * (1 - y / H) * 0.6
        px[x, y] = int(max(0, min(255, v)))
bok = Image.new("L", (W, H), 0); bd = ImageDraw.Draw(bok)
for _ in range(26):
    r = random.randint(30, 95); x = random.randint(700, W); y = random.randint(0, 560)
    bd.ellipse((x - r, y - r, x + r, y + r), fill=random.randint(40, 110))
bok = bok.filter(ImageFilter.GaussianBlur(14))
bg = Image.composite(Image.new("L", (W, H), 255), bg, bok)

dog = Image.new("L", (W, H), 0); dd = ImageDraw.Draw(dog)
cx, cy = 560, 520
dd.ellipse((cx - 330, cy + 180, cx + 380, cy + 760), fill=255)        # shoulders / chest
dd.ellipse((cx - 210, cy - 250, cx + 230, cy + 220), fill=255)        # head
dd.ellipse((cx - 60, cy - 10, cx + 330, cy + 210), fill=255)          # muzzle
dd.polygon([(cx - 200, cy - 150), (cx - 330, cy + 210), (cx - 150, cy + 120), (cx - 90, cy - 220)], fill=255)  # ear L
dd.polygon([(cx + 110, cy - 240), (cx + 240, cy - 330), (cx + 250, cy - 90), (cx + 170, cy - 140)], fill=255)  # ear R
dog = dog.filter(ImageFilter.GaussianBlur(7))

# shading: bright on the left (window light), falling off to the right
sh = Image.new("L", (W, H)); sp = sh.load()
for y in range(H):
    for x in range(W):
        t = (x - (cx - 330)) / 760.0
        v = 235 - 170 * max(0, min(1, t)) + 25 * math.sin(y / 40.0) * 0.3
        sp[x, y] = int(max(0, min(255, v)))
sh = sh.filter(ImageFilter.GaussianBlur(30))
img = Image.composite(sh, bg, dog)
fd = ImageDraw.Draw(img)
fd.ellipse((cx + 10, cy - 90, cx + 62, cy - 38), fill=22)             # eye
fd.ellipse((cx + 27, cy - 80, cx + 39, cy - 68), fill=200)            # catch light
fd.ellipse((cx + 255, cy + 30, cx + 345, cy + 100), fill=15)          # nose
img = img.filter(ImageFilter.GaussianBlur(1.6))
noise = Image.effect_noise((W, H), 10)
img = Image.blend(img, noise, 0.05)
# vignette
vig = Image.new("L", (W, H), 0); vd = ImageDraw.Draw(vig)
vd.ellipse((-260, -200, W + 260, H + 200), fill=255); vig = vig.filter(ImageFilter.GaussianBlur(120))
img = Image.composite(img, Image.new("L", (W, H), 25), vig)
img.convert("RGB").save(out + "/pet.jpg", quality=92)
`;

/* ───────────── driving the app ───────────── */
async function settle(page, ms = 450) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
}
async function setText(page, l1, l2 = "") {
  await page.fill("#l1", l1);
  await page.fill("#l2", l2);
}
async function setFont(page, f) {
  // the polished app hides the <select> behind font tiles; set it and fire change like a tile click would
  await page.evaluate(f => { const s = document.getElementById("font"); s.value = f; s.dispatchEvent(new Event("change", { bubbles: true })); }, f);
  await page.evaluate(f => document.fonts.load(`700 64px "${f}"`), f);
}
async function setRange(page, id, v) {
  await page.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); }, [id, String(v)]);
}
async function setTextColour(page, hex) {
  await page.evaluate(hex => {
    const i = document.querySelector("#colours .swatch input[type=color]");
    if (i) { i.value = hex; i.dispatchEvent(new Event("input", { bubbles: true })); }
  }, hex);
}
async function preset(page, v) { await page.selectOption("#preset", v); }
async function upload(page, file) { await page.setInputFiles("#file", file); await page.waitForFunction(() => !document.getElementById("imgClear").hidden); }

/* The proof PNG exactly as the "Proof image (PNG)" button downloads it. */
async function proofViaButton(page, name) {
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#btnProof")]);
  const f = path.join(TMP, name + ".png"); await dl.saveAs(f); return f;
}
/* The same proofPNG() the batch export writes for each name in the zip. */
async function proofForName(page, name, file) {
  const b64 = await page.evaluate(async n => {
    const st = window.__veerLightBox.readSettings();
    const u8 = await proofPNG(st, n, st.l2);
    let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }, name);
  const f = path.join(TMP, file + ".png"); fs.writeFileSync(f, Buffer.from(b64, "base64")); return f;
}
async function shotStage(page, name, opts) {
  const f = path.join(TMP, name + ".png");
  await page.evaluate(() => { const o = document.getElementById("overlay"); if (o) o.style.visibility = "hidden"; });
  await page.locator("#stage").screenshot({ path: f });
  await page.evaluate(() => { const o = document.getElementById("overlay"); if (o) o.style.visibility = ""; });
  return toWebp(f, name, opts);
}
async function shotApp(page, name, opts) {
  const f = path.join(TMP, name + ".png");
  await page.screenshot({ path: f });
  return toWebp(f, name, opts);
}

(async () => {
  console.log("inputs → " + TMP);
  py(MAKE_INPUTS, TMP);
  const server = await ensureServer();
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  // every design starts from the app's defaults: wipe saved settings before the app's own scripts run
  await ctx.addInitScript(() => { try { localStorage.removeItem("veerLightBox"); } catch (e) {} });
  const fresh = async () => {
    await page.goto(BASE + "/lightbox/app.html");
    await page.waitForSelector("#lit"); await settle(page, 900);
  };

  try {
    console.log("writing → " + path.relative(ROOT, OUT));

    /* 1. Script name, Pacifico. Hero proof + full UI with lit preview. */
    await fresh();
    await setText(page, "Olivia"); await setFont(page, "Pacifico"); await preset(page, "name");
    await settle(page);
    toWebp(await proofViaButton(page, "proof-olivia"), "proof-olivia", { maxw: 1600 });
    await shotApp(page, "app-lit");

    /* 2. Lights on / lights off pair, same design (stage only). */
    await shotStage(page, "stage-olivia-on", { maxw: 1500 });
    await page.uncheck("#lightsOn"); await settle(page, 250);
    await shotStage(page, "stage-olivia-off", { maxw: 1500 });
    await page.check("#lightsOn"); await settle(page, 250);

    /* 3. 3D preview with the part list. */
    await page.click("#btnBuild");
    await page.waitForFunction(() => document.getElementById("stat").classList.contains("ok"), null, { timeout: 60000 });
    await settle(page, 600);
    await shotApp(page, "app-3d");

    /* 4. Two-line family sign. */
    await fresh();
    await setText(page, "The Johnsons", "Est. 2024"); await setFont(page, "Playfair Display"); await preset(page, "wide");
    await setRange(page, "tL2", 42);
    await settle(page);
    toWebp(await proofViaButton(page, "proof-family"), "proof-family", { maxw: 1600 });

    /* 5. Logo inlay: 3-colour logo + business name. */
    await fresh();
    await preset(page, "wide");
    await upload(page, path.join(TMP, "logo.png"));
    await page.selectOption("#k", "3");
    await setRange(page, "iScale", 84); await page.fill("#iX", "-68"); await page.dispatchEvent("#iX", "input");
    await setText(page, "Ridge", "COFFEE ROASTERS"); await setFont(page, "Montserrat");
    await page.fill("#tX", "34"); await page.dispatchEvent("#tX", "input");
    await setRange(page, "tSize", 46); await setRange(page, "tL2", 30);
    await settle(page, 700);
    toWebp(await proofViaButton(page, "proof-logo"), "proof-logo", { maxw: 1600 });
    await shotApp(page, "app-logo");

    /* 6. Photo lithophane: pet picture + name. */
    await fresh();
    await page.click("#modeSeg [data-m=litho]");
    await upload(page, path.join(TMP, "pet.jpg"));
    await setText(page, "Biscuit"); await setFont(page, "Dancing Script");
    await setRange(page, "tSize", 22); await page.fill("#tX", "30"); await page.dispatchEvent("#tX", "input");
    await page.fill("#tY", "-34"); await page.dispatchEvent("#tY", "input");
    await setRange(page, "lContrast", 25);
    await settle(page, 800);
    toWebp(await proofViaButton(page, "proof-pet"), "proof-pet", { maxw: 1600 });
    await shotStage(page, "stage-pet-on", { maxw: 1500 });
    await page.uncheck("#lightsOn"); await settle(page, 250);
    await shotStage(page, "stage-pet-off", { maxw: 1500 });
    await page.check("#lightsOn");

    /* 7. Batch: a day's Etsy names pasted in. UI shot + a proof for each name. */
    await fresh();
    await setFont(page, "Pacifico"); await preset(page, "name");
    await page.evaluate(() => { document.querySelectorAll("details.sec").forEach((d, i) => d.open = i === 3 || i === 0); });
    const names = ["Olivia", "Mason", "Ava Grace", "Theo", "Harper", "Noah"];
    await page.fill("#batch", names.join("\n"));
    await settle(page);
    await page.evaluate(() => { const t = document.getElementById("batch"); t.scrollIntoView({ block: "center" }); t.scrollTop = 0; t.blur(); });
    await shotApp(page, "app-batch");
    for (const n of ["Mason", "Ava Grace", "Theo", "Harper"])
      toWebp(await proofForName(page, n, "proof-batch-" + n.toLowerCase().replace(/\s+/g, "-")), "proof-batch-" + n.toLowerCase().replace(/\s+/g, "-"), { maxw: 800 });

    /* 8. Open Graph card: the hero proof, cropped to 1200×630 (JPEG for wide support). */
    py(`
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB")      # 1600×1200
im = im.crop((0, 180, 1600, 1020)).resize((1200, 630), Image.LANCZOS)
im.save(sys.argv[2], "JPEG", quality=86, optimize=True, progressive=True)
`, path.join(TMP, "proof-olivia.png"), path.join(OUT, "og.jpg"));
    console.log(`  og.jpg  1200×630  ${(fs.statSync(path.join(OUT, "og.jpg")).size / 1024).toFixed(0)} KB`);

    if (errors.length) { console.log("\napp console errors:"); errors.forEach(e => console.log("  " + e)); }
    else console.log("\nno console errors in the app");
  } finally {
    await browser.close();
    if (server) server.kill();
    fs.rmSync(TMP, { recursive: true, force: true });
  }
})().catch(e => { console.error(e); process.exit(1); });
