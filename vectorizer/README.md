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
script near the bottom of `index.html`.
