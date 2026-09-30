#!/usr/bin/env python3
"""Build proposal/index.html from proposal.tpl.html.

Inlines the Veer mark, today's date, the DM Sans webfont and three screenshots
of ../site so the finished page survives being emailed, printed or shared.

    python3 build.py                 # screenshots from ./shots
    python3 build.py ../../shots     # screenshots from somewhere else

Screenshots expected in the shots dir: pv-desktop.jpg, pv-menu.jpg, pv-mobile.jpg
Produce them with shoot.py, or drop your own in with those names.
"""
import base64, datetime, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
SHOTS = pathlib.Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else HERE / 'shots'
FONT = HERE.parent / 'site' / 'fonts' / 'dmsans-latin.woff2'

SHOT_NAMES = {'__PVDESKTOP__': 'pv-desktop.jpg',
              '__PVMENU__': 'pv-menu.jpg',
              '__PVMOBILE__': 'pv-mobile.jpg'}

MARK = ('<svg viewBox="0 0 79.9 66.6" width="30" height="25" role="img" aria-label="Veer" style="flex:none">'
 '<g transform="translate(-100.447,-44.954)">'
 '<path transform="matrix(1,0,0,-1,125.672,87.0075)" d="M0 0-25.225 42.053H-4.347L12.208 14.454C6.144 11.892 1.523 6.522 0 0" fill="#ffffff"/>'
 '<path transform="matrix(1,0,0,-1,145.9093,70.930309)" d="M0 0H1.884V3.96L10.637-1.095 16.258-4.341 34.443 25.976H13.564L-2.078-.103C-1.395-.035-.701 0 0 0" fill="#ffffff"/>'
 '<path transform="matrix(1,0,0,-1,156.546,82.131008)" d="M0 0-8.753-5.054V-1.033H-10.637C-12.896-1.033-15.034-1.928-16.658-3.551-18.283-5.177-19.178-7.314-19.178-9.574V-16.618H-23.83L-16.146-29.428 2.305 1.331Z" fill="#ffffff"/>'
 '</g></svg>')


def data_uri(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()


def main():
    missing = [n for n in SHOT_NAMES.values() if not (SHOTS / n).exists()]
    if missing:
        sys.exit(f"missing screenshots in {SHOTS}: {', '.join(missing)}\n"
                 f"run:  python3 shoot.py")
    if not FONT.exists():
        sys.exit(f"missing font: {FONT}")

    s = (HERE / 'proposal.tpl.html').read_text(encoding='utf-8')
    fontcss = ('<style>@font-face{font-family:"DM Sans";font-style:normal;font-weight:100 1000;'
               'font-display:swap;src:url(' + data_uri(FONT, 'font/woff2') + ') format("woff2");}</style>')
    s = s.replace('__FONTCSS__', fontcss)
    s = s.replace('__VEERMARK__', MARK)
    # %-d is not portable to Windows; build the day number by hand
    today = datetime.date.today()
    s = s.replace('__DATE__', f'{today:%B} {today.day}, {today.year}')
    for token, name in SHOT_NAMES.items():
        s = s.replace(token, data_uri(SHOTS / name, 'image/jpeg'))

    leftover = [t for t in list(SHOT_NAMES) + ['__FONTCSS__', '__VEERMARK__', '__DATE__'] if t in s]
    if leftover:
        sys.exit(f"unreplaced placeholders: {leftover}")

    out = HERE / 'index.html'
    out.write_text(s, encoding='utf-8')
    print(f'wrote {out} ({len(s)//1024} KB)')


if __name__ == '__main__':
    main()
