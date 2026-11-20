#!/usr/bin/env python3
"""Builds docs/store/web/{privacy,terms,support}.html from the Markdown in docs/store.

Run from affelion-aura/: python3 scripts/policy-pages.py
The pages are plain, mobile-friendly HTML to paste into affelion.com/halo/privacy, /terms and /support.
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'docs' / 'store'
PAGES = [('privacy-policy.md', 'privacy.html', 'Affelion Halo Privacy Policy'),
         ('terms.md', 'terms.html', 'Affelion Halo Terms of Use'),
         ('support.md', 'support.html', 'Affelion Halo Support')]
STYLE = """body{margin:0;background:#F3F2F2;color:#201E1D;font:17px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Archivo,sans-serif}
main{max-width:720px;margin:0 auto;padding:56px 20px 80px}
h1{font-size:34px;line-height:1.15;letter-spacing:-.02em;margin:0 0 24px}
h2{font-size:21px;margin:36px 0 8px}
a{color:#7E4BD6;overflow-wrap:anywhere} ul{padding-left:22px} li{margin:6px 0} h1,h2{text-wrap:balance} p,li{text-wrap:pretty}"""


def inline(t: str) -> str:
    t = html.escape(t, quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)', r'<em>\1</em>', t)
    t = re.sub(r'(https?://[^\s<)]+[^\s<).,])', r'<a href="\1">\1</a>', t)
    t = re.sub(r'([\w.]+@affelion\.com)', r'<a href="mailto:\1">\1</a>', t)
    return t


def convert(md: str, title: str) -> str:
    out, para, inlist = [], [], False

    def flush():
        nonlocal para
        if para:
            out.append('<p>' + inline(' '.join(para)) + '</p>')
            para = []

    for ln in md.splitlines():
        if ln.startswith('*To publish') or ln.startswith('*Draft written'):
            continue
        if ln.startswith('# ') or ln.startswith('## '):
            flush()
            if inlist:
                out.append('</ul>'); inlist = False
            tag = 'h1' if ln.startswith('# ') else 'h2'
            out.append(f'<{tag}>' + inline(ln.split(' ', 1)[1]) + f'</{tag}>')
            continue
        if ln.startswith('- '):
            flush()
            if not inlist:
                out.append('<ul>'); inlist = True
            out.append('<li>' + inline(ln[2:]) + '</li>')
            continue
        if ln.startswith('  ') and inlist and out[-1].startswith('<li>'):
            out[-1] = out[-1][:-5] + ' ' + inline(ln.strip()) + '</li>'
            continue
        if inlist:
            out.append('</ul>'); inlist = False
        if not ln.strip():
            flush()
            continue
        para.append(ln.strip())
    flush()
    if inlist:
        out.append('</ul>')
    body = '\n'.join(out)
    return (f'<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>{title}</title>\n'
            f'<style>\n{STYLE}\n</style></head><body><main>\n{body}\n</main></body></html>\n')


if __name__ == '__main__':
    (ROOT / 'web').mkdir(exist_ok=True)
    for src, dst, title in PAGES:
        (ROOT / 'web' / dst).write_text(convert((ROOT / src).read_text(), title))
    print('wrote', ', '.join(d for _, d, _ in PAGES))
