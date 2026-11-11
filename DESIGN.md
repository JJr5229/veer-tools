# Veer Tools: design brief

Read this before touching any page. Every page must look like it came from
one careful studio, not from a template or an AI page generator.

## Brand
- **Veer** is a digital studio (websites, marketing, AI ads) that also makes
  browser tools for makers. Social: **@getveer**. Main site: veersolutions.com.
- **The mark** is the three-colour chevron "V" (SVG below). Colours:
  `#ef4037` red, `#bd222f` deep red, `#f69322` orange.
- **Dark theme only.** Warm charcoal `#0f1114` surfaces, warm off-white `#f2efe9`
  text. Never pure black or pure white.
- **Accent:** orange `#f69322` is the one action colour (primary buttons,
  focus, small highlights). The red→orange→cream gradient (`.grad`) is used
  sparingly: one headline phrase per page at most, plus the mark.

## Type
Load once per page:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,600..900&family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```
- **Archivo**, wide (`font-stretch:112%`), 800: headlines. It has a confident,
  engineered feel.
- **Figtree**: body and UI.
- **JetBrains Mono**: eyebrows, dimensions, specs, prices' small print. Real
  units are the subject's vernacular (`85.6 × 54 × 2.5 mm`, `0.2 mm layers`,
  `AMS 1–4`). Use them as content.

## Motifs (use with restraint)
- **Millimetre grid** (`.mm-grid`): the build plate. Behind a hero or a product
  shot, never everywhere.
- **Dimension callouts** (`.dim`): technical-drawing annotations next to
  product imagery.
- **Real screenshots** of the tools and real exported output (proof PNGs,
  previews). No stock photos, no AI-generated illustrations, no emoji icons.

## Avoid (these read as AI-generated)
Purple/blue gradients; Inter/Space Grotesk; emoji as section markers; every
block centred; identical rounded cards with shadows everywhere; three-column
"feature" grids with icon + title + blurb used by reflex; numbered 01/02/03
markers that don't encode a real sequence; filler like "Unlock the power of…",
"Seamless", "Elevate", "Revolutionize"; fake testimonials or fake user counts.

## Copy voice
Plain, specific and confident, like a maker explaining their own tool. Short
sentences. Say what it does and for whom, in their words: "Drop in a logo. Get
STL files your Bambu prints in four colours." No hype, and no claims we can't
back up. Never invent reviews, ratings, customer counts or press.

## Facts you can use
- All tools run 100% in the browser. Nothing is uploaded. Free to use; Pro
  unlocks with a license key (one-time purchase), works offline after unlock.
- **NFC Studio:** logo → multi-colour STL set for NFC business cards and
  keychains (Bambu Studio, AMS). Colour separation, vector tracing, sealed NFC
  tag cavity with exact pause layer, keyring hole, card/pill/disc shapes,
  company-info text. Free: 1–2 colours, small "MADE WITH VEER" debossed on
  the back. **Pro $29:** up to 4 colours, company text, no mark.
  **Commercial $79:** + right to sell prints.
- **Vectorizer:** PNG/JPG → SVG, free and unlimited, with background removal.
  **Pro $19:** real-size SVG with colour layers, one SVG per colour, DXF for
  laser cutters, batch convert, and "Print it in 3D": cookie cutters, stamps,
  stencils (auto bridges), multi-colour plaques (with magnet pocket). STL
  preview is free; download is Pro.
- **Light Box Studio:** name / logo / any photo → 3D-printable light box:
  frame, white diffuser front (multi-colour inlay or photo lithophane), back
  panel with USB cable hole + keyhole slots. 9 fonts, lit preview, proof PNG
  for customers, batch names for Etsy orders. Free: text names, small mark on
  the back. **Pro $29:** logos, photos/lithophanes, batch. **Commercial $79:**
  + sell what you print.
- **Veer Pro bundle:** every tool + future tools, coming soon (do not state a
  price).
- Checkout links aren't live yet. Use `assets/checkout.js` (`data-checkout`
  keys: `nfc-pro`, `nfc-commercial`, `vectorizer-pro`, `lightbox-pro`,
  `lightbox-commercial`, `veer-pro`).

## Site structure
```
/                     landing page (index.html)
/nfc-studio/          product page (index.html) → the tool is app.html
/vectorizer/          product page → app.html
/lightbox/            product page → app.html
/assets/site.css      shared styles for marketing pages (don't fork it)
/assets/checkout.js   checkout links
```
Product pages link to `app.html` ("Open NFC Studio"). The apps link back to
`./` (their product page) and `../` (all tools).

## Shared header (copy exactly; set aria-current on the active link)
```html
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="/" aria-label="Veer Tools home">
      <svg viewBox="0 0 79.9 66.6" aria-hidden="true"><g transform="translate(-100.447,-44.954)"><path transform="matrix(1,0,0,-1,125.672,87.0075)" d="M0 0-25.225 42.053H-4.347L12.208 14.454C6.144 11.892 1.523 6.522 0 0" fill="#ef4037"/><path transform="matrix(1,0,0,-1,145.9093,70.930309)" d="M0 0H1.884V3.96L10.637-1.095 16.258-4.341 34.443 25.976H13.564L-2.078-.103C-1.395-.035-.701 0 0 0" fill="#bd222f"/><path transform="matrix(1,0,0,-1,156.546,82.131008)" d="M0 0-8.753-5.054V-1.033H-10.637C-12.896-1.033-15.034-1.928-16.658-3.551-18.283-5.177-19.178-7.314-19.178-9.574V-16.618H-23.83L-16.146-29.428 2.305 1.331Z" fill="#f69322"/></g></svg>
      Veer <span>Tools</span>
    </a>
    <nav class="nav" aria-label="Main">
      <a class="hide-sm" href="/nfc-studio/">NFC Studio</a>
      <a class="hide-sm" href="/vectorizer/">Vectorizer</a>
      <a class="hide-sm" href="/lightbox/">Light Box Studio</a>
      <a class="hide-sm" href="/#pricing">Pricing</a>
      <a class="btn btn-primary btn-sm" href="/#tools">Open a tool</a>
    </nav>
  </div>
</header>
```

## Shared footer (copy exactly)
```html
<footer class="site-foot">
  <div class="wrap">
    <div class="cols">
      <div>
        <a class="brand" href="/">…same svg… Veer <span>Tools</span></a>
        <p style="margin-top:14px;max-width:34ch">Browser tools for makers, from Veer, a digital studio for small businesses. Everything runs on your machine.</p>
      </div>
      <div><h4>Tools</h4><ul><li><a href="/nfc-studio/">NFC Studio</a></li><li><a href="/vectorizer/">Vectorizer</a></li><li><a href="/lightbox/">Light Box Studio</a></li></ul></div>
      <div><h4>Veer</h4><ul><li><a href="https://veersolutions.com">Websites &amp; marketing</a></li><li><a href="https://instagram.com/getveer">Instagram @getveer</a></li></ul></div>
      <div><h4>Help</h4><ul><li><a href="/#faq">FAQ</a></li><li><a href="/#pricing">Pricing &amp; licenses</a></li></ul></div>
    </div>
    <div class="base"><span>© 2026 Veer</span><span>No uploads. No accounts. Your files stay yours.</span></div>
  </div>
</footer>
```

## Page rules
- Link `/assets/site.css` (absolute path). Page-specific CSS goes in the page's
  own `<style>`, built from the tokens in site.css.
- Responsive down to 375 px with no horizontal scroll. Test at 1440 and 390.
- Real `<title>` + meta description + Open Graph tags (og:title,
  og:description, og:image pointing at a real screenshot in the page's `img/`).
- Images: real screenshots, saved under the page's own `img/` folder as PNG/WebP.
  Always set width/height or aspect-ratio. Give them descriptive alt text.
- Accessible: semantic headings in order, visible focus, contrast ≥ 4.5:1 for
  body text, `prefers-reduced-motion` respected.
- No external JS except `assets/checkout.js`. Motion: at most one deliberate
  moment per page, and the page must look complete with JS off.
