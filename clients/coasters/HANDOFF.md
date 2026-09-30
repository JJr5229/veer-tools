# Coasters — handoff

The concept site and the proposal are built and pushed. The only thing missing is
the photography: the cloud session that built this could not reach any image host
(network policy), so `site/img/` is empty and every `<img>` slot is unfilled.

Finish it from a machine with normal internet.

## 1. Get the images

Ten images were already generated on Higgsfield (`z_image`, 0.15 credits each,
1.5 credits total — already spent, nothing more to pay). Download each URL to
`site/img/<name>.jpg`.

Base URL:

```
https://d8j0ntlcm91z4.cloudfront.net/user_3FcBTDEZMCROpBK3unX0E1xh16T/
```

| save as | ratio | file on the CDN |
|---|---|---|
| `exterior.jpg` | 16:9 | `hf_20260925_131430_73740205-eebe-4011-9d23-24b28260d955.png` |
| `wings.jpg` | 4:3 | `hf_20260925_131430_6ff97d87-6619-425e-a348-a987564bc305.png` |
| `cuban.jpg` | 4:3 | `hf_20260925_131431_6601453e-7b73-4afc-9378-3cbcaa4f2860.png` |
| `pizza.jpg` | 4:3 | `hf_20260925_131432_9884208f-5ab4-4c97-b1d2-ffdb7f6baed2.png` |
| `fishfry.jpg` | 4:3 | `hf_20260925_131432_b66fb050-d3b4-4570-91dc-a91314e837df.png` |
| `burger.jpg` | 4:3 | `hf_20260925_131432_c1cf8f62-e413-4cf2-bd99-fdc3bccb0093.png` |
| `interior.jpg` | 16:9 | `hf_20260925_131430_8dff3cc1-486e-404e-8648-f2283d895b62.png` |
| `beer.jpg` | 1:1 | `hf_20260925_131431_017b4c45-c229-45ca-9276-864501a86018.png` |
| `loaded.jpg` | 4:3 | `hf_20260925_131431_2b416535-eb47-444d-95bf-f99ea628c923.png` |
| `pool.jpg` | 16:9 | `hf_20260925_131431_13b8817b-c2e1-437b-a5e3-3323cb824234.png` |

If those URLs have expired, the same ten are in the Higgsfield library from the
25 Sep 2026 batch, or regenerate from the prompts (they are stored with each job).

Real photos of Coasters beat these outright. Any of the ten slots can take a real
photo under the same filename — no code changes.

## 2. Size them

Originals are 2048px PNGs, far too heavy for a page that should load fast on bar
wifi. Re-encode to JPEG:

- `exterior`, `interior`, `pool` → 1600px wide, quality ~72
- everything else → 1000px wide, quality ~72

Target under ~150KB each; the whole page including fonts should stay well under 2MB.

## 3. Check it

Open `site/index.html`. Things to look at specifically:

- Hero text stays legible over `exterior.jpg` — the scrim is tuned for a dark,
  moody frame. If the image is bright, deepen the `.hero .scrim` gradient.
- The three signature cards (`.dish`) crop to 4:5 on desktop and 16:10 on mobile;
  check nothing important sits at the edges.
- The 64px menu thumbnails are center-cropped squares.

## 4. Rebuild the proposal

The proposal embeds screenshots of the site, and the ones currently in
`proposal/index.html` are of the older imageless version. Re-shoot and rebuild:

```
pip install playwright && playwright install chromium
cd proposal
python3 shoot.py     # writes shots/pv-desktop.jpg, pv-menu.jpg, pv-mobile.jpg
python3 build.py     # writes index.html
```

## 5. Still open, decide before sending

- **No audit numbers.** The cloud session could not reach coasterspubngrill.com,
  so the proposal says plainly that the measured audit was not run rather than
  printing figures. Run the `rebuild-pitch` audit and the `gbp-audit-fix` Local
  Score, then add the measured table and the score to sections 02 and 05.
- **Friends & Family not applied.** Investment is the standard $500. There is an
  HTML comment at that table in `proposal/proposal.tpl.html` with the −15% swap
  ($425, split $212.50 × 2) if this turns out to be a referral.
- **Written as cold outreach.** Section 01 says plainly that nobody referred us.
  Rewrite it if that is wrong.
- **Placeholders.** The eleven wing flavor names, most prices, and all
  photography are placeholders, labelled as such on the page banner and in the
  proposal. Verified from public listings: address, phone, 11am–midnight daily,
  est. 1995, pool/darts/arcade, Friday cod fry, the Cuban $11, bone-in wings
  10pc $8 / 20pc $15, boneless 12pc $7 / 24pc $14, ~4.3 Google rating.
- **Not deployed.** Neither the site nor the proposal has been published, and the
  proposal has not been sent. Deploying the proposal goes to the Veer Proposals
  hub per the `veer-proposal` skill; the site goes through `deploy-site`.
