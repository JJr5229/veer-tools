# Veer · NFC Studio

A single-file browser tool that turns a logo into a set of watertight STLs for a
multi-colour NFC business card or keychain, ready to drop straight into Bambu
Studio.

Open **`nfc-card-studio.html`** in Chrome or Edge. No install, no internet, no
account. Everything runs locally — your logo never leaves the machine.

---

## What it does

1. You drop in a logo (PNG / JPG / SVG / WEBP).
2. It separates the artwork into up to 4 flat colours (k-means clustering).
3. It traces real vector contours around each colour region (marching squares +
   smoothing + Douglas-Peucker simplification) — not a pixel staircase.
4. It extrudes each colour into a solid and cuts the matching hole out of the
   card face, so the parts tile the top layer exactly with no gaps or overlaps.
5. It exports one STL per filament, all sharing a single origin.

Optional: a company-info text block (rendered as real geometry, not an image)
and an NFC tag pocket recessed into the back.

## Output

| File | What it is | Filament |
|---|---|---|
| `1_card.stl` | The whole card — body, front face, logo recesses, NFC pocket | AMS 1 |
| `2_colour1.stl` … | One solid per logo colour | AMS 2, 3, 4 |

So a 3-colour logo gives you **4 files**, and a 1-colour logo gives you 2.

STL carries no colour information — it's only triangles — so a separate closed
solid per filament is the only way to express a multi-colour part. That's why
there's more than one file, and it's the same for any multi-material model.

Plus a `README.txt` with the exact dimensions used.

**Use the STL set.** The `.3mf` button exists for other slicers, but Bambu
Studio will not give you a multi-colour card from it — see below.

### Why the 3MF doesn't work for Bambu (tested, confirmed)

Bambu Studio rejects part and filament data from any 3MF it did not write
itself. On import it shows:

> The 3mf is not from Bambu Lab, load geometry data and color data only.

…and then **flattens every component into a single object with one filament**.
Confirmed on a real import: a 4-part card came in as one object of 1156
triangles — the exact sum of all four parts — with no way to recolour it.

This is not a matter of getting the file structure right. The generated 3MF
already matches Bambu's own layout exactly, verified field by field against a
real Bambu-exported project:

- 3MF production extension, `requiredextensions="p"`, `p:UUID` throughout
- all parts in one `3D/Objects/object_N.model` as sibling `<object>` elements
- a wrapper object whose `<components>` share one `p:path`
- `Metadata/model_settings.config` with `<part id="1..N">` and per-part
  `extruder` metadata

None of it is honoured. The gate is whether Bambu recognises the file as its
own *project*, which means embedding a complete printer and filament profile
(`Metadata/project_settings.config`) — which would then override your own print
settings on import. Not worth it. **The multi-STL import below is the supported
path and it works.**

### Historical note on the 3MF layout

Written to match how Bambu Studio itself saves a project — reverse-engineered
from real Bambu-exported files, because nothing else imports as a multi-part
object. The layout:

```
[Content_Types].xml
_rels/.rels                        → /3D/3dmodel.model
3D/3dmodel.model                   wrapper object, one <component> per part
3D/_rels/3dmodel.model.rels        → the object file
3D/Objects/object_N.model          ALL parts, as <object id="1..N"> siblings
Metadata/model_settings.config     <part id="1..N"> + extruder per part
```

Three things have to be right, and each one on its own will silently produce an
unpaintable single-colour blob:

1. **The 3MF production extension.** `requiredextensions="p"`, the
   `BambuStudio` and `p` namespaces, `p:UUID` on every object, component and
   build item, and geometry referenced by `p:path` rather than inlined.
2. **All parts in one `object_N.model`**, as sibling `<object>` elements with
   ids 1..N. The wrapper's components all share that same `p:path` and differ
   only by `objectid`. One file per part is not the same thing.
3. **`<part id>` is a 1-based index within the object**, not the 3MF object id,
   and it's the `<part>` order that binds a part to its component.

For the record, what does *not* work: merging every part into a single mesh and
describing the split as triangle-index ranges in a `Slic3r_PE_model.config`.
That's PrusaSlicer's format — Bambu ignores the config and imports one solid.

## Importing into Bambu Studio

1. Select **all** the STL files at once and drag them onto the plate.
2. Bambu Studio asks *"load these files as a single object with multiple
   parts?"* → **Yes**. (If it doesn't ask, import the first file, then
   right-click the object → *Add part* → *Load* for the rest.)
3. Click each part in the object list and set its filament.
4. **Do not rotate it.** The model is already built face-down: the logo prints
   against the build plate as the first layers, and the NFC pocket opens
   upward, so nothing needs support.

Slice at 0.2 mm layers, 100% infill (the card is thin — solid is faster than
sparse plus top layers). A textured PEI plate becomes the card's front finish.

## Geometry notes

- **Orientation** — Z=0 is the card face. The logo colours occupy
  `0 … colour depth`, sitting in recesses cut into the front of the card. The
  top of the model is the *back* of the finished card.
- **The artwork is mirrored in X on export.** This is not optional. The card
  prints face-down, so the artwork surface is the z=0 plane lying on the build
  plate — you only ever see it by peeling the card off and turning it over,
  which is viewing that plane from the far side and reverses left/right.
  Without the mirror, every card comes out backwards. Both previews therefore
  show the **front of the finished card**, and the exported solids are the
  mirror of what you see.
- **The card is one solid**, `0 … thickness`, with the logo recesses and the
  tag cavity cut out of it. The colour parts drop into the recesses exactly —
  verified by volume: card + colours equals the full prism minus the cavity to
  within 0.003%.
- **Colour depth** — should be a multiple of your layer height. 0.6 mm is three
  layers at 0.2 mm, enough to fully hide the filament underneath.
- **Art margin** — artwork is always held at least 0.25 mm clear of the card
  edge. Letting the trace touch the analytic card outline would make the face
  polygon degenerate.
- **Meshes are watertight.** Caps are triangulated with an ear-clipper using
  only the polygon's own vertices, so every cap edge matches a wall edge
  exactly. Verified: zero unmatched edges, zero non-manifold edges, zero
  degenerate triangles across single-colour, 4-colour, draft and fine-trace
  configurations. Bambu Studio should not ask to repair these.

## Shapes and keychains

Three outlines, all driven by one generator — a pill is a rounded rectangle with
the corner radius maxed out, and a disc is a pill with equal sides:

- **Rounded rectangle** — cards, rectangular keychains
- **Pill / stadium** — rounded ends
- **Circle / disc** — width is the diameter

Keychain presets set a sensible size, thickness, tag and hole position in one
click:

| Preset | Size | Tag | Hole |
|---|---|---|---|
| Keychain | 45 × 28 × 3 | 22 mm | top left |
| Pill keychain | 50 × 25 × 3 | 20 mm | left end |
| Round keychain | 35 mm × 3 | 22 mm | top centre |
| Square keytag | 38 × 38 × 3 | 25 mm | top left |

Keychains are 3 mm rather than 2.5 mm — they take more abuse than a card, and
the extra thickness leaves room for the sealed cavity.

### Keyring hole

Tick **Keyring hole** on any shape. It goes straight through, and both the
artwork and the tag cavity are automatically held clear of it — the art is
masked around the hole, and the cavity shrinks or moves to avoid it (with a
warning if that makes it too small for your tag).

Position presets aim from the centre toward a corner or edge and then
binary-search the furthest point where the whole hole still clears the outline,
so they work on any shape without hand-tuning. Pick **Custom…** to place it
yourself.

4 mm suits a split ring; 5 mm if you want a lanyard clip.

## Sealing the tag inside the card

Default and recommended for anything you sell — the tag ends up completely
enclosed, with no recess or sticker visible on the back.

The cavity is a fully enclosed void inside the card, so the print has to stop
partway and let you drop the tag in:

1. Slice as normal.
2. In **Preview**, drag the layer slider to the height the tool reports
   (shown in a banner under the part list, e.g. *Z = 1.80 mm, layer 9*).
3. **Right-click the slider at that layer → Add pause.**
4. Print. When it stops, drop the tag into the cavity and press it flat.
5. Resume. The next layers close over it.

**Set "Tag thickness" to your tag's real thickness.** The cavity is built to
exactly that depth so the cover prints *directly onto the tag* instead of
bridging over open air. Too deep and the cover sags into the void; too shallow
and the nozzle collides with the tag. A bare NTAG215 sticker is roughly
0.3–0.4 mm; a foam-backed disc is nearer 0.8 mm. Measure yours with calipers if
you can.

The card has to be thick enough to contain the stack — logo depth + 0.3 mm
floor + tag + cover. With the defaults that's 2.0 mm minimum, and the tool
warns with the exact figure if you're under it. 2.5 mm is a comfortable target.

Untick **Seal the tag inside the card** to go back to an open recess in the
back (no pause needed, but the tag is visible).

## Tuning guide

| Symptom | Fix |
|---|---|
| Halo of a 3rd colour around a 2-colour logo | Lower **Logo colours**, or set them by hand and tick **Lock palette** |
| Speckles / confetti from a JPEG | Leave **Clean up JPEG noise** on; raise **Drop specks under** |
| Edges look like stair steps | Raise **Resolution** to Fine, raise **Edge smoothing** |
| Fine detail is getting rounded off | Lower **Edge smoothing** and **Simplify** |
| White box around the logo | Tick **Drop background colour** and raise the tolerance |
| Huge STL files | Lower Resolution, raise Simplify |

Text below about 2.5 mm cap height turns to mush on a 0.4 mm nozzle. 3.5 mm is
a safe minimum for anything a person has to read.

---

# Sourcing & economics

*Prices checked August 2026. Treat them as ballpark — card printers are sold
under minimum-advertised-price rules, so the real number comes from a quote.*

## Buying flat printed NFC cards (one-offs)

| Supplier | Price/card | Min. order | Turnaround | Notes |
|---|---|---|---|---|
| **Tagstand — Custom Small Batch** | **$2.60** | none | ~1 week | White PVC CR80, NTAG215, full-bleed UV inkjet, made in California. Best value for genuine one-offs. |
| Tap Tag | from $29.95 | 1 | ships next business day | 600 dpi edge-to-edge, both sides. Price includes their hosted digital-profile platform — you're buying the service, not just the card. |
| Alibaba factories | $0.04–0.70 | 100–500 | 2–4 weeks + freight | Only worth it once you're buying by the hundred. |

**Tagstand at $2.60 with no minimum is the answer to the question as asked.**

## Buying a machine to print them yourself

The right machine is a dye-sublimation CR80 card printer, not a flatbed or an
inkjet. (Inkjet-printable NFC cards exist but are explicitly *not* compatible
with thermal card printers — different card coating.)

| Item | Cost |
|---|---|
| Zebra ZC300, single-sided | from **$1,519** |
| Design software (often bundled) | $0–500 |
| YMCKO ribbon, 300 images | $99 → **$0.33/card** |
| Blank NTAG215 PVC card | ~**$0.55** in bulk |
| **Consumables per card** | **≈ $0.90–1.10** with waste |

You do **not** need the printer's built-in encoder option. Encode the tags
afterwards with a phone and a free app (NFC Tools) — it costs nothing and takes
seconds per card.

### Break-even

Against outsourcing to Tagstand: you save about **$1.60 per card**
($2.60 − ~$1.00). Against ~$1,700 of capital:

| Cards you sell per month | Time to pay off the machine |
|---|---|
| 20 | ~4.5 years |
| 50 | ~21 months |
| 100 | ~11 months |
| 500 | ~2 months |

**The machine only makes sense above roughly 100 cards/month, sustained.**
Below that, the capital sits idle and outsourcing is strictly better — same
product, no risk, no maintenance, no obsolete ribbon stock.

## The third option — and probably the best one

You already own the machine that makes the *differentiated* product.

A 3D-printed multi-colour card off this tool costs roughly:

- ~11 g of filament ≈ **$0.22**
- NFC sticker ≈ **$0.30–0.80**
- purge waste — the real variable

**Batch the plate.** Multi-colour purge is charged per colour change per layer,
not per card, so a plate of 10 cards costs about the same purge as a plate of 1.
Printing them one at a time is what makes multi-colour look expensive.

That lands around **$0.50–1.00/card with zero capital outlay** — and unlike a
flat PVC card, it's textured, tactile, and impossible to buy for $0.25 from a
factory. A flat printed card is a commodity you'd be competing on price to
sell. A raised multi-colour card is not.

**Suggested sequence:** sell the 3D-printed card as the premium product now.
Outsource flat cards to Tagstand at $2.60 when a customer wants conventional
ones. Buy the card printer only once you're consistently past ~100 flat
cards/month.
