# NFC Studio (Lemon Squeezy · Veer)

> Ready to paste into Lemon Squeezy. Items in `[square brackets]` are for the owner to fill in.

## Lemon Squeezy setup

- **Product:** NFC Studio
- **Variants:** `Pro` — $29, one-time · `Commercial` — $79, one-time
- **License keys:** on, for both variants. The commercial variant's name must contain "Commercial" (that's how the license server tells them apart).
- **Activation limit:** [3] per key (matches "a few browsers" below). Removing the key from a browser in the tool frees a slot.
- **License length:** unlimited (lifetime).
- Add the product ID to `LS_PRODUCTS` on Vercel as `"nfc-studio"`, and paste the two checkout links into `PRO.buyPro` / `PRO.buyCommercial` in `nfc-studio/app.html`.

---

## Product name

NFC Studio

## Tagline

Drop in a logo. Get the STL files for a multi-colour NFC business card or keychain.

## Short description (≤160 characters)

```
Turn a logo into multi-colour STL files for NFC business cards and keychains, with the tag sealed inside. Runs in your browser; nothing is uploaded.
```

(148 characters)

---

## Long description

```markdown
NFC Studio turns a logo into a set of print-ready STL files for an NFC business card or keychain. Drop the files into Bambu Studio, assign a filament to each, and print a card with your logo in up to four colours and an NFC tag sealed inside.

Everything runs in your browser. Your logo never leaves your computer.

## What it does

- **Separates your logo into flat colours** (up to 4) and traces clean vector outlines around each one, not a pixel staircase.
- **Builds the card.** Each colour becomes its own solid that drops exactly into a recess in the card face. One STL per filament, all sharing one origin: drag them in together and Bambu Studio loads them as one multi-part object.
- **Seals the NFC tag inside.** Set your tag's real thickness and the tool builds a cavity of exactly that depth, then tells you the height and layer to add a pause, e.g. *Z = 1.80 mm, layer 9*. Drop the tag in, resume, and it's sealed. No sticker on the back.
- **Shapes and keychains.** Rounded rectangle, pill and disc, with one-click presets: card 85.6 × 54 × 2.5 mm, keychain 45 × 28 × 3, pill 50 × 25 × 3, round 35 × 3, square keytag 38 × 38 × 3. Add a keyring hole anywhere; the artwork and tag cavity stay clear of it.
- **Company info text** as real geometry, up to three lines.
- **Watertight meshes.** Zero open or non-manifold edges, so Bambu Studio doesn't ask to repair them.

Prints face-down at 0.2 mm layers on a textured plate, no supports. The README in every download lists the exact dimensions used.

## Who it's for

Makers with a multi-colour printer (Bambu with AMS, or any multi-material setup that takes one STL per filament) who want to make NFC cards and tap tags for themselves, for clients, or to sell.

## Free, Pro and Commercial

Anyone can design with every feature. The plan only matters when you download.

|  | Free | Pro | Commercial |
|---|---|---|---|
| Logo colours | 1–2 | up to 4 | up to 4 |
| Company info text | — | ✓ | ✓ |
| Back of the card | small `MADE WITH VEER` deboss | clean | clean |
| Sell the cards you print | — | — | ✓ |
| Price | $0 | $29 one-time | $79 one-time |

## System requirements

- A recent version of Chrome, Edge, Safari or Firefox on a computer. [Owner: the tool README currently says Chrome or Edge; test Safari and Firefox before publishing this line.]
- A slicer that can load several STLs as one multi-part object (Bambu Studio recommended).
- An internet connection once, to unlock. After that it works offline; it checks in quietly when you're online, and needs to connect at least once every 14 days to stay unlocked.
- No account, no install.
```

---

## License terms (plain English)

```
Pro license
- For your own use: your own cards, gifts, your own business's cards.
- You can't sell prints made with Pro. For that, get Commercial.

Commercial license
- Everything in Pro, plus you can sell the physical cards and keychains you print, and make them for paying clients.

Both licenses
- One key per person (or one maker business). It works in up to [3] browsers at a time; remove it from an old browser in the tool to free a slot.
- Please don't share your key, resell the tool, or sell or give away the exported STL files as templates or digital downloads. Sell the things you print, not the files.
- Your logos and designs stay yours. Nothing is uploaded.
- One-time purchase. Updates to NFC Studio are included.
```

---

## Receipt email text

```
Thanks for buying NFC Studio [Pro / Commercial].

Your license key:
{license_key}

To unlock:
1. Open NFC Studio: [tool URL]/nfc-studio/app.html
2. Click "Free · Upgrade" at the top.
3. Paste your key and click Unlock.

You need to be online the first time. After that it works offline. Use it in up to [3] browsers; to move it, open the tool in the old browser, click your plan, and choose "Remove from this browser".

Contact us within 14 days if it doesn't work for you, and we'll refund you.

Questions: reply to this email.
— Veer (@getveer)
```

Note: unlocking only works on the hosted tool, not on a downloaded copy of the page opened from disk.

---

## Refund line

Contact us within 14 days if it doesn't work for you.
