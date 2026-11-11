/* ═══════════════════════════════════════════════════════════════════════════
   Stripe as the license store.

   Stripe doesn't issue license keys, so we derive one from the purchase:

       VEER-<PaymentIntent id without "pi_">-<check>

   <check> is an HMAC of the PaymentIntent id (keyed from LICENSE_SIGNING_KEY),
   so a key can't be guessed or made up, and checking one needs no database:
   verify the HMAC, then fetch that PaymentIntent from Stripe to confirm it
   was paid and not refunded or disputed. Which tool and tier it unlocks, and
   which browsers it's active in, are stored in the PaymentIntent's metadata.

   (Files in /api starting with "_" aren't deployed as endpoints.)

   Env: STRIPE_SECRET_KEY (a restricted key is fine: read Checkout Sessions;
   read + write PaymentIntents; read Charges; read Products and Prices).
   Optional STRIPE_API_BASE for tests.
   ═══════════════════════════════════════════════════════════════════════════ */
"use strict";
const crypto = require("crypto");

const API = () => (process.env.STRIPE_API_BASE || "https://api.stripe.com").replace(/\/$/, "");
const ACTIVATION_LIMIT = () => parseInt(process.env.LICENSE_ACTIVATION_LIMIT || "3", 10);
const TOOLS = ["nfc-studio", "vectorizer", "lightbox", "veer-pro"];
const TOOL_NAMES = { "nfc-studio": "NFC Studio", "vectorizer": "Vectorizer", "lightbox": "Light Box Studio", "veer-pro": "Veer Pro" };
const TOOL_PATHS = { "nfc-studio": "/nfc-studio/app.html", "vectorizer": "/vectorizer/app.html", "lightbox": "/lightbox/app.html", "veer-pro": "/" };

async function stripe(method, path, form) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  const r = await fetch(API() + path, {
    method,
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded" },
    body: form ? new URLSearchParams(form) : undefined
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error((j.error && j.error.message) || ("Stripe " + r.status)); e.status = r.status; throw e; }
  return j;
}

function hmacKey() {
  const raw = process.env.LICENSE_SIGNING_KEY || "";
  if (!raw) throw new Error("LICENSE_SIGNING_KEY is not set");
  return crypto.createHash("sha256").update("veer-license-key|" + raw).digest();
}
const B32 = "ABCDEFGHJKMNPQRSTVWXYZ23456789";   // no 0/O, 1/I/L, U
function check(pi) {
  const mac = crypto.createHmac("sha256", hmacKey()).update(pi).digest();
  let out = ""; for (let i = 0; i < 8; i++) out += B32[mac[i] % B32.length];
  return out;
}
function keyFor(pi) { return "VEER-" + pi.replace(/^pi_/, "") + "-" + check(pi); }
function parseKey(key) {
  const m = /^VEER-([A-Za-z0-9]{8,64})-([A-Z0-9]{8})$/.exec(String(key || "").trim());
  if (!m) return null;
  const pi = "pi_" + m[1];
  const a = Buffer.from(check(pi)), b = Buffer.from(m[2].toUpperCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? pi : null;
}

const tierOf = s => /commercial/i.test(String(s || "")) ? "commercial" : "pro";
const toolOf = s => { s = String(s || "").toLowerCase();
  if (TOOLS.includes(s)) return s;
  if (/nfc/.test(s)) return "nfc-studio"; if (/vector/.test(s)) return "vectorizer";
  if (/light\s*box|lightbox/.test(s)) return "lightbox"; if (/veer\s*pro|bundle/.test(s)) return "veer-pro";
  return null; };

/* After checkout: look up the session, record tool + tier on the payment,
   and hand back the key. Safe to call repeatedly. */
async function claim(sessionId) {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(String(sessionId || ""))) return { ok: false, error: "That link is missing its purchase reference." };
  const s = await stripe("GET", "/v1/checkout/sessions/" + encodeURIComponent(sessionId)
    + "?expand[]=line_items.data.price.product&expand[]=payment_intent");
  if (s.status !== "complete" || s.payment_status !== "paid")
    return { ok: false, error: "This purchase isn't complete yet. If you just paid, refresh in a few seconds." };
  const pi = s.payment_intent && (s.payment_intent.id || s.payment_intent);
  if (!pi) return { ok: false, error: "No payment found for this purchase." };
  const item = ((s.line_items && s.line_items.data) || [])[0] || {};
  const price = item.price || {}, prod = price.product || {};
  const md = Object.assign({}, prod.metadata || {}, price.metadata || {});
  const tool = toolOf(md.tool) || toolOf(prod.name) || toolOf(item.description);
  const tier = md.tier ? tierOf(md.tier) : tierOf(prod.name || item.description);
  if (!tool) return { ok: false, error: "This purchase isn't for a Veer tool." };
  const email = (s.customer_details && s.customer_details.email) || s.customer_email || "";
  const piMeta = (s.payment_intent && s.payment_intent.metadata) || {};
  if (piMeta.veer_tool !== tool || piMeta.veer_tier !== tier) {
    await stripe("POST", "/v1/payment_intents/" + pi, {
      "metadata[veer_tool]": tool, "metadata[veer_tier]": tier, "metadata[veer_email]": email
    });
  }
  return { ok: true, key: keyFor(pi), tool, tier, email, name: TOOL_NAMES[tool], path: TOOL_PATHS[tool] };
}

/* License check, used by api/license.js */
async function check3(action, key, instance, product) {
  const pi = parseKey(key);
  if (!pi) return { ok: false, error: "That license key wasn't recognised." };
  let p;
  try { p = await stripe("GET", "/v1/payment_intents/" + pi + "?expand[]=latest_charge"); }
  catch (e) { if (e.status === 404) return { ok: false, error: "That license key wasn't recognised." }; throw e; }
  const md = p.metadata || {};
  const tool = md.veer_tool, tier = md.veer_tier === "commercial" ? "commercial" : "pro";
  if (!tool) return { ok: false, error: "This key hasn't been set up yet. Open the link from your receipt once, then try again." };
  if (tool !== product && tool !== "veer-pro") return { ok: false, error: "That key is for " + (TOOL_NAMES[tool] || "a different Veer tool") + "." };
  const ch = p.latest_charge || {};
  if (p.status !== "succeeded") return { ok: false, error: "This payment hasn't gone through." };
  if (ch.refunded || ch.disputed || (ch.amount_refunded && ch.amount_refunded >= ch.amount))
    return { ok: false, error: "This purchase was refunded, so the license is no longer active." };

  let list = String(md.veer_activations || "").split(",").filter(Boolean);
  if (action === "deactivate") {
    if (instance && list.includes(instance)) {
      list = list.filter(x => x !== instance);
      await stripe("POST", "/v1/payment_intents/" + pi, { "metadata[veer_activations]": list.join(",") });
    }
    return { ok: true };
  }
  if (action === "activate" || !instance || !list.includes(instance)) {
    if (list.length >= ACTIVATION_LIMIT())
      return { ok: false, error: "This key is already active in " + list.length + " browsers. Remove it from one (click your plan → Remove from this browser) and try again." };
    instance = crypto.randomBytes(5).toString("hex");
    list.push(instance);
    await stripe("POST", "/v1/payment_intents/" + pi, { "metadata[veer_activations]": list.join(",") });
  }
  return { ok: true, granted: tool, tier, email: md.veer_email || "", instance };
}

module.exports = { claim, check: check3, keyFor, parseKey, TOOL_NAMES };
