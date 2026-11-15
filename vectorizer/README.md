# Veer · Vectorizer

Turn a PNG or JPG into a clean SVG, then into files you can cut or print.
Everything runs in the browser and nothing is uploaded.

## Free
- Unlimited PNG/JPG/WebP to SVG, with background removal
- Download the SVG or copy its code

## Pro ($19 one-time)

**Maker exports.** These use the output width you set, in mm.
- Sized SVG, with each colour on its own named layer (Inkscape, Cricut Design Space, LightBurn)
- One SVG per colour (.zip)
- DXF R12 for laser cutters: closed polylines, one layer per colour
- Batch convert: many images to sized SVG + DXF in one zip

**Stacked shapes** (a checkbox above the exports). Normally each colour is
cut out where other colours sit on it, like puzzle pieces. Stacked fills
each colour in underneath the colours above it, the way designers build
logos and layered vinyl works: a circle behind text comes out whole, and a
circle or rectangle partly covered at its edge is restored exactly. Every
piece can then be moved or recoloured in Illustrator without leaving a gap.

**Colour detection.** Before tracing, Vectorizer finds the logo's real
colours itself (histogram + farthest-colour seeding + k-means on the opaque
pixels), so small distinct colours aren't merged into their neighbours.
"Colors" is a maximum: soft anti-aliased edges don't become extra layers.

**Print it in 3D.** Preview is free; STL download is Pro.

| Mode | What you get | Notes |
|---|---|---|
| Cookie cutter | Thin cutting wall + flange that prints on the bed | Follows the outside outline. Mirrored, because it's used flange-up. |
| Stamp | Base plate + raised design | Base follows the outline, or is a rounded rectangle or circle. Mirrored so the impression reads correctly. |
| Stencil | Flat plate with the design cut through | Bridges are added automatically so the centres of O, A, B etc. don't fall out. |
| Multi-colour plaque | Base + one STL per colour, as a zip | For an AMS. Optional magnet pocket underneath for fridge magnets. |

"Colours to use" picks which traced colours count as the design. Near-white
layers start switched off, because on a logo with a white background they're
usually the enclosed letter centres.

### How the 3D files are made
The selected colour layers are rasterised (up to 12 px/mm), offset with an
exact Euclidean distance transform, traced back to smooth loops, and extruded
with the same watertight mesh code as NFC Studio. Every mode is tested to
export with zero open or non-manifold edges.

## Licensing
Same scheme as NFC Studio. See `nfc-studio/README.md` → *Free and Pro* and
the top of `api/license.js`. Put the checkout link in `PRO.buyPro` in the
script near the bottom of `app.html`.
