# Veer Tools icons (v2)

One family: 1024 tile, 225 corner radius (22%), charcoal `#17191d`, orange `#f69322` primary shape, cream `#ffd9a1` secondary shape, 96-unit strokes, gaps of 64 or more. Each icon uses one glyph of 2–3 shapes, so it still reads at 16 px.

- `nfc-studio.svg`: an orange NFC card with two cream tap waves coming off its corner ("tap a phone to the card").
- `vectorizer.svg`: an orange bezier curve between two cream square anchor nodes (the pen-tool signifier for "this becomes a vector path").
- `lightbox.svg`: an orange light-box frame around a glowing cream diffuser with a name written as one bold script stroke.
- `veer-tools.svg`: the three-colour Veer chevron V on the same tile, for the Veer Tools brand itself (bundle, site, social).

## Which file to use where
- **Lemon Squeezy / Stripe product image, store listings:** `<name>-1024.png`
- **Retina UI, Open Graph thumbnails, docs:** `<name>-512.png` or `<name>-256.png`
- **In-app / nav icons:** `<name>-64.png`, `<name>-32.png`, or the `.svg` (preferred on the web)
- **Favicon:** `<name>-favicon-32.png` and `<name>-favicon-16.png`, for example
  `<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/nfc-studio-favicon-32.png">`
  `<link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/nfc-studio-favicon-16.png">`
  Modern browsers can use the SVG too: `<link rel="icon" type="image/svg+xml" href="/assets/icons/nfc-studio.svg">`

PNGs have transparent corners outside the rounded tile. They were rendered from the SVGs with Playwright/Chromium, each size rasterised directly from the vector.
