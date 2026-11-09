/* ═══════════════════════════════════════════════════════════════════════════
   Veer Tools — license server  (Vercel serverless function: POST /api/license)

   The tools never talk to the store directly. They send the buyer's license
   key here; this function checks it with the store (Lemon Squeezy or Gumroad)
   and, if it's good, returns a short-lived token signed with Veer's private
   key. The tool verifies that signature with the matching public key baked
   into its page, so the Pro unlock can't be faked by editing localStorage, and
   the tool keeps working offline until the token expires.

   Request  { action: "activate" | "refresh" | "deactivate",
              product: "nfc-studio", key: "XXXX-…", instance?: "…" }
   Response { ok: true, token, instance }   or   { ok: false, error }

   ── Environment variables (Vercel → Project → Settings → Environment) ──────
   LICENSE_SIGNING_KEY   required. EC P-256 private key, PKCS#8 PEM, or that
                         PEM base64-encoded on one line. Generate the pair with
                         `node scripts/gen-license-keypair.js`.
   LICENSE_PROVIDER      "lemonsqueezy" (default) or "gumroad".

   Lemon Squeezy
   LS_STORE_ID           your store id (number) — keys from other stores fail.
   LS_PRODUCTS           JSON map of LS product id → tool, e.g.
                         {"412345":"nfc-studio","412399":"veer-pro"}
                         "veer-pro" unlocks every tool.

   Gumroad
   GUMROAD_PRODUCTS      JSON map of Gumroad product id → tool (same idea).
   GUMROAD_MAX_USES      activations allowed per key (default 5).

   Both
   COMMERCIAL_MATCH      text that marks the commercial variant/tier in the
                         product or variant name (default "commercial").
   LICENSE_TEST_KEYS     optional, for testing before the store exists:
                         "VEER-TEST-PRO:pro,VEER-TEST-COM:commercial".
                         Remove it before launch.
   ═══════════════════════════════════════════════════════════════════════════ */
"use strict";
const crypto = require("crypto");

const TOKEN_DAYS = 14;              // tools refresh well before this runs out
const KNOWN_TOOLS = ["nfc-studio", "vectorizer", "lightbox"];

/* ───────── helpers ───────── */
const b64url = buf => Buffer.from(buf).toString("base64")
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function signingKey() {
  let raw = process.env.LICENSE_SIGNING_KEY || "";
  if (!raw) throw new Error("LICENSE_SIGNING_KEY is not set");
  if (!raw.includes("BEGIN")) raw = Buffer.from(raw, "base64").toString("utf8");
  raw = raw.replace(/\\n/g, "\n");
  return crypto.createPrivateKey(raw);
}

function signToken(payload) {
  const body = b64url(JSON.stringify(payload));
  // ieee-p1363 = raw r||s, which is what WebCrypto's ECDSA verify expects
  const sig = crypto.sign("sha256", Buffer.from(body), { key: signingKey(), dsaEncoding: "ieee-p1363" });
  return body + "." + b64url(sig);
}

function jsonEnv(name) {
  try { return JSON.parse(process.env[name] || "{}"); } catch { return {}; }
}

const maskEmail = e => {
  if (!e || !e.includes("@")) return "";
  const [u, d] = e.split("@");
  return (u.length <= 2 ? u[0] + "•" : u.slice(0, 2) + "•••") + "@" + d;
};

const tierFrom = (...names) => {
  const m = (process.env.COMMERCIAL_MATCH || "commercial").toLowerCase();
  return names.some(n => String(n || "").toLowerCase().includes(m)) ? "commercial" : "pro";
};

const keyHash = key => crypto.createHash("sha256").update(key).digest("hex").slice(0, 16);

/* A grant covers the requested tool if it's that tool or the Veer Pro bundle. */
const covers = (granted, wanted) => granted === wanted || granted === "veer-pro";

/* ───────── providers ───────── */
async function lemonSqueezy(action, key, instance, product) {
  const form = new URLSearchParams({ license_key: key });
  let url;
  if (action === "activate") {
    url = "https://api.lemonsqueezy.com/v1/licenses/activate";
    form.set("instance_name", "Veer " + product + " " + new Date().toISOString().slice(0, 10));
  } else if (action === "deactivate") {
    url = "https://api.lemonsqueezy.com/v1/licenses/deactivate";
    form.set("instance_id", instance || "");
  } else {
    url = "https://api.lemonsqueezy.com/v1/licenses/validate";
    if (instance) form.set("instance_id", instance);
  }
  const r = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: form
  });
  const j = await r.json().catch(() => ({}));

  if (action === "deactivate") return { ok: !!j.deactivated, error: j.error };

  const good = action === "activate" ? j.activated : j.valid;
  if (!good) {
    const msg = String(j.error || "");
    if (/activation limit/i.test(msg))
      return { ok: false, error: "This key is already active on the maximum number of browsers. Remove it from one (Manage license → Remove) or contact support." };
    return { ok: false, error: "That license key wasn't recognised." };
  }
  const meta = j.meta || {};
  const status = j.license_key && j.license_key.status;
  if (status && !["active", "inactive"].includes(status))
    return { ok: false, error: `This license is ${status}. If you think that's wrong, contact support.` };

  const storeId = String(process.env.LS_STORE_ID || "");
  if (storeId && String(meta.store_id) !== storeId)
    return { ok: false, error: "That key is for a different store." };

  const granted = jsonEnv("LS_PRODUCTS")[String(meta.product_id)];
  if (!granted || !covers(granted, product))
    return { ok: false, error: "That key is for a different Veer product." };

  return {
    ok: true, granted,
    tier: tierFrom(meta.variant_name, meta.product_name),
    email: meta.customer_email,
    instance: (j.instance && j.instance.id) || instance || ""
  };
}

async function gumroad(action, key, instance, product) {
  if (action === "deactivate") return { ok: true };       // Gumroad has no per-device seats to release
  const map = jsonEnv("GUMROAD_PRODUCTS");
  const ids = Object.keys(map).filter(id => covers(map[id], product));
  const maxUses = parseInt(process.env.GUMROAD_MAX_USES || "5", 10);
  for (const id of ids) {
    const r = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        product_id: id, license_key: key,
        increment_uses_count: action === "activate" ? "true" : "false"
      })
    });
    const j = await r.json().catch(() => ({}));
    if (!j.success) continue;
    const p = j.purchase || {};
    if (p.refunded || p.chargebacked || p.disputed)
      return { ok: false, error: "This purchase was refunded, so the license is no longer active." };
    if (p.subscription_cancelled_at || p.subscription_failed_at || p.subscription_ended_at)
      return { ok: false, error: "This subscription has ended. Renew it to keep Pro." };
    if (action === "activate" && j.uses > maxUses)
      return { ok: false, error: "This key has been activated too many times. Contact support to reset it." };
    return {
      ok: true, granted: map[id],
      tier: tierFrom(p.variants, p.product_name),
      email: p.email,
      instance: instance || crypto.randomUUID()
    };
  }
  return { ok: false, error: "That license key wasn't recognised." };
}

function testKey(key) {
  const list = (process.env.LICENSE_TEST_KEYS || "").split(",").map(s => s.trim()).filter(Boolean);
  for (const item of list) {
    const [k, tier] = item.split(":");
    if (k && k === key) return { ok: true, granted: "veer-pro", tier: tier === "commercial" ? "commercial" : "pro", email: "test@veer", instance: "test" };
  }
  return null;
}

/* ───────── handler ───────── */
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "Use POST." }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const action = ["activate", "refresh", "deactivate"].includes(body.action) ? body.action : "activate";
  const product = KNOWN_TOOLS.includes(body.product) ? body.product : null;
  const key = String(body.key || "").trim();
  const instance = String(body.instance || "").slice(0, 200);

  if (!product) { res.status(400).json({ ok: false, error: "Unknown product." }); return; }
  if (!key || key.length > 200) { res.status(400).json({ ok: false, error: "Enter a license key." }); return; }

  try {
    let r = testKey(key);
    if (!r) {
      const provider = (process.env.LICENSE_PROVIDER || "lemonsqueezy").toLowerCase();
      r = provider === "gumroad"
        ? await gumroad(action, key, instance, product)
        : await lemonSqueezy(action, key, instance, product);
    }
    if (action === "deactivate") { res.status(200).json({ ok: true }); return; }
    if (!r.ok) { res.status(200).json({ ok: false, error: r.error }); return; }

    const now = Math.floor(Date.now() / 1000);
    const token = signToken({
      v: 1, p: r.granted, t: r.tier, kh: keyHash(key),
      e: maskEmail(r.email), iat: now, exp: now + TOKEN_DAYS * 86400
    });
    res.status(200).json({ ok: true, token, instance: r.instance });
  } catch (e) {
    console.error("license error", e);
    res.status(502).json({ ok: false, error: "The license server couldn't reach the store. Try again in a minute." });
  }
};
