# Veer · Light Box Studio

Name, logo or photo in. A 3D-printable light box out: frame, light-diffusing
front, and a back panel with a cable hole and keyhole slots. Single file; runs
in the browser.

## Fronts
- **Name & graphics (inlay):** text and artwork are set flush into a thin
  white front, one STL per colour for an AMS. White glows, colours glow
  tinted, black blocks light, so black text reads as a crisp silhouette.
- **Photo lithophane:** any photo becomes a variable-thickness front (thin =
  bright, thick = dark), with optional text printed dark over it.

## Box
Size presets (name sign, square, wide, 6×4 photo landscape/portrait) or custom.
Depth, wall, corner radius, front thickness and colour depth are adjustable.
The back panel has a locating rim that presses into the frame (snug, standard
or loose fit), a USB cable hole and keyhole slots for wall hanging.

## For sellers
- **Batch names:** paste one name per line (e.g. from Etsy orders). You get
  one shared frame and back, a front for every name, and a proof PNG per name.
- **Proof image:** a lit mock-up to send the customer before printing.

## Free vs Pro
| | Free | Pro ($29) | Commercial ($79) |
|---|---|---|---|
| Names in 9 fonts | ✓ | ✓ | ✓ |
| Logos / images | preview | ✓ | ✓ |
| Photo lithophane | preview | ✓ | ✓ |
| Batch names | preview | ✓ | ✓ |
| Back panel | small `MADE WITH VEER` deboss | clean | clean |
| Selling prints | — | — | ✓ |

Licensing works the same way as the other Veer tools (see `nfc-studio/README.md`).
Put the checkout links in `PRO.buyPro` / `PRO.buyCommercial` in the script.

## Geometry
Front view is authored with Z = 0 at the front face. Frame and front are
mirrored into print space (the front prints face-down). The back panel is
authored in print space, with its outside face on the plate. Every part
exports watertight: zero open or non-manifold edges, tested on text,
multi-colour logo, lithophane and batch builds.
