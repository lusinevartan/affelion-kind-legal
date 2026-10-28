"""Package the built site so it can live inside a Lovable project.

Lovable cannot import a zip or an existing repository. It can sync code that is
pushed to the GitHub repository it creates for a project. Lovable projects are
either React + Vite (older) or TanStack Start (from May 2026). Both serve the
`public/` folder as plain static files, so the site ships there unchanged:

    public/home.html, public/services.html, ... public/404.html
    public/site-assets/...      (styles, script, images, icons)

The only change Lovable has to make is to send `/` to `/home.html`, and unknown
routes to `/404.html`. LOVABLE_PROMPT.md holds the exact request to paste into
Lovable's chat, and README.md has the code for both project types.

Run after `python3 src/build.py`:

    python3 src/export_lovable.py [output_dir]
"""
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(ROOT, 'lovable-export')
PAGES = ['index', 'services', 'membership', 'kids', 'events', 'team', 'careers', 'partners', 'contact', '404']
ASSETS = 'site-assets'  # not `assets`: Vite writes its own build output to /assets


def page_file(name):
    return 'home.html' if name == 'index' else f'{name}.html'


def rewrite(html):
    # internal page links become absolute, so they work from any route
    for name in PAGES:
        target = '/' if name == 'index' else f'/{page_file(name)}'
        html = re.sub(rf'(href=")({name}\.html)(#[^"]*)?"', lambda m: f'{m.group(1)}{target}{m.group(3) or ""}"', html)
    # every local asset reference (src, href, inline style url) points at /site-assets
    html = re.sub(r'(["\'(])assets/', rf'\1/{ASSETS}/', html)
    return html


def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    pub = os.path.join(OUT, 'public')
    os.makedirs(pub)
    for name in PAGES:
        src = os.path.join(ROOT, f'{name}.html')
        html = rewrite(open(src, encoding='utf-8').read())
        assert not re.search(r'["\'(]assets/', html), f'unrewritten asset path in {name}'
        open(os.path.join(pub, page_file(name)), 'w', encoding='utf-8').write(html)
    shutil.copytree(os.path.join(ROOT, 'assets'), os.path.join(pub, ASSETS))
    here = os.path.dirname(os.path.abspath(__file__))
    for doc in ('LOVABLE_README.md', 'LOVABLE_PROMPT.md'):
        shutil.copy(os.path.join(here, doc), os.path.join(OUT, doc.replace('LOVABLE_', '') if doc == 'LOVABLE_README.md' else doc))
    n = sum(len(fs) for _, _, fs in os.walk(OUT))
    print(f'wrote {OUT} ({n} files)')


if __name__ == '__main__':
    main()
