# Coasters Bar & Grill — rebuild concept + proposal

Cold-outreach package for Coasters Bar & Grill, 1301 N Main St, Racine WI
(coasterspubngrill.com · (262) 637-9006).

```
site/       the rebuilt website concept (single page, self-contained + local fonts)
proposal/   the Veer client proposal
```

## site/
`index.html` plus `fonts/` (DM Sans + Bebas Neue, self-hosted, OFL). No build step,
no third-party requests, no trackers. Deploy the folder as-is.

Everything in it that is **not** verified is labelled a placeholder, on the page itself
(top banner) and in the proposal. Verified from public listings: address, phone, daily
11am–midnight hours, est. 1995, pool/darts/arcade, Friday cod fish fry, "11 flavors of
wings", the Cuban ($11), bone-in wings (10pc $8 / 20pc $15), boneless (12pc $7 / 24pc $14),
~4.3 Google rating. Everything else — the eleven flavor names, most prices, all food
photography — is a placeholder awaiting the client.

## proposal/
`proposal.tpl.html` is the source; `build.py` inlines the Veer mark, the date, the DM Sans
webfont and three screenshots of `site/` as base64, and writes `index.html`.

Rebuild it after changing the template or re-shooting screenshots:

```
cd proposal && python3 build.py
```

Screenshots are taken from `site/index.html` with headless Chromium at 1280x800
(desktop + menu section) and 390x760 @2x (mobile).

### Notes for whoever picks this up
- No measured site audit is in the proposal: this environment could not reach
  coasterspubngrill.com (egress policy), so the proposal says so instead of printing
  numbers nobody measured. Run `rebuild-pitch`/`gbp-audit-fix` from a machine with
  network access and add the real table + Veer Local Score before sending.
- Pricing is the standing default: build $500, Veer Care $25/mo, GBP Rescue $300 /
  Care $85/mo / Care Plus $150/mo / bundle $500. Friends & Family (−15% → $425) is NOT
  applied; there is an HTML comment at the Investment table showing what to change.
- Deployment (Veer Proposals hub on Vercel) has not been done — proposal has not been sent.
