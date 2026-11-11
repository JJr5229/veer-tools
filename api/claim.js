/* GET /api/claim?session_id=cs_…  →  { ok, key, tool, tier, name, path, email }
   Stripe redirects buyers to /license/?session_id={CHECKOUT_SESSION_ID};
   that page calls this to show their license key. See api/_stripe.js.

   Optional: if RESEND_API_KEY and LICENSE_FROM_EMAIL are set, the key is also
   emailed to the buyer once (recorded on the payment so it isn't re-sent). */
"use strict";
const { claim } = require("./_stripe.js");

const SITE = () => (process.env.SITE_URL || "https://veer-tools.vercel.app").replace(/\/$/, "");

async function emailKey(r, sessionId) {
  const apiKey = process.env.RESEND_API_KEY, from = process.env.LICENSE_FROM_EMAIL;
  if (!apiKey || !from || !r.email) return;
  const link = SITE() + "/license/?session_id=" + encodeURIComponent(sessionId);
  const open = SITE() + r.path + "#license=" + encodeURIComponent(r.key);
  const text = [
    `Thanks for buying ${r.name} ${r.tier === "commercial" ? "Commercial" : "Pro"}.`, "",
    "Your license key:", r.key, "",
    "To unlock: open " + open, "(or open the tool, click \"Free · Upgrade\" and paste the key).", "",
    "You need to be online the first time; after that it works offline. Use it in up to 3 browsers.",
    "Your key is always available at: " + link, "",
    "Contact us within 14 days if it doesn't work for you, and we'll refund you.", "",
    "— Veer (@getveer)"
  ].join("\n");
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", "Idempotency-Key": "veer-key-" + sessionId },
      body: JSON.stringify({ from, to: [r.email], subject: `Your ${r.name} license key`, text })
    });
  } catch (e) { console.error("email failed", e); }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const sessionId = String((req.query && req.query.session_id) || (req.body && req.body.session_id) || "");
  try {
    const r = await claim(sessionId);
    if (r.ok) await emailKey(r, sessionId);
    res.status(200).json(r.ok ? { ok: true, key: r.key, tool: r.tool, tier: r.tier, name: r.name, path: r.path,
      email: r.email ? r.email.replace(/^(.{2}).*(@.*)$/, "$1•••$2") : "" } : r);
  } catch (e) {
    console.error("claim error", e);
    res.status(502).json({ ok: false, error: "We couldn't reach Stripe just now. Refresh in a minute; your purchase is safe." });
  }
};
