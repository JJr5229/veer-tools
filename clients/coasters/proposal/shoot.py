#!/usr/bin/env python3
"""Screenshot ../site into ./shots for the proposal previews.

    pip install playwright && playwright install chromium
    python3 shoot.py

Writes pv-desktop.jpg (1280x800), pv-menu.jpg (the menu section) and
pv-mobile.jpg (390x760 @2x). Then run build.py.
"""
import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
SITE = (HERE.parent / 'site' / 'index.html').as_uri()
OUT = HERE / 'shots'


def main():
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()

        page = b.new_page(viewport={'width': 1280, 'height': 800})
        page.goto(SITE)
        page.wait_for_timeout(1200)
        page.screenshot(path=OUT / 'pv-desktop.jpg', type='jpeg', quality=80)

        page.locator('#menu').scroll_into_view_if_needed()
        page.wait_for_timeout(600)
        page.screenshot(path=OUT / 'pv-menu.jpg', type='jpeg', quality=80)

        m = b.new_page(viewport={'width': 390, 'height': 760},
                       device_scale_factor=2, is_mobile=True)
        m.goto(SITE)
        m.wait_for_timeout(1200)
        m.screenshot(path=OUT / 'pv-mobile.jpg', type='jpeg', quality=78)

        b.close()
    for f in sorted(OUT.glob('pv-*.jpg')):
        print(f'{f.name}  {f.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
