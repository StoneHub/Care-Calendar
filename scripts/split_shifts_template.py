#!/usr/bin/env python
"""Split the large shifts.html template into external CSS and JS files (Phase 1).

Moves (not rewrites) the first <style>...</style> block to backend/static/css/shifts.css
and the large inline <script>...</script> block (after data JSON scripts) to
backend/static/js/shifts.js. Idempotent; use --force to re-run.

Usage:
  python scripts/split_shifts_template.py --dry-run
  python scripts/split_shifts_template.py --version 2

Exit codes: 0 success / no-op, 1 error.
"""
from __future__ import annotations
import argparse
import re
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "backend" / "templates" / "shifts.html"
CSS_OUT = ROOT / "backend" / "static" / "css" / "shifts.css"
JS_OUT = ROOT / "backend" / "static" / "js" / "shifts.js"

CSS_SENTINEL = "<!-- shifts-split-css -->"
JS_SENTINEL = "<!-- shifts-split-js -->"

STYLE_RE = re.compile(r"<style>(?P<css>.*?)</style>", re.DOTALL | re.IGNORECASE)
# We'll search for the first inline <script> AFTER the employees-data script tag that has no id= / src=
SCRIPT_RE = re.compile(r"<script>(?P<js>.*?</script>)", re.DOTALL | re.IGNORECASE)


def find_inline_js(html: str) -> tuple[int, int, str] | None:
    # anchor after employees-data script end tag
    anchor_idx = html.find('id="employees-data"')
    if anchor_idx == -1:
        return None
    # move to end of that script tag
    close_tag = html.find('</script>', anchor_idx)
    if close_tag == -1:
        return None
    search_start = close_tag + len('</script>')
    remainder = html[search_start:]
    # iterate over script tags
    script_open_re = re.compile(r"<script(.*?)>", re.IGNORECASE | re.DOTALL)
    pos_offset = search_start
    for m in script_open_re.finditer(remainder):
        attrs = m.group(1)
        if 'src=' in attrs or 'id=' in attrs:  # skip external or data scripts
            continue
        # this is candidate plain script
        start = pos_offset + m.start()
        end_close = html.find('</script>', start)
        if end_close == -1:
            continue
        js_body = html[start + m.end() - m.start(): end_close]
        return start, end_close + len('</script>'), js_body
    return None


def already_split(html: str) -> bool:
    return CSS_SENTINEL in html and JS_SENTINEL in html


def main():
    ap = argparse.ArgumentParser(description="Split shifts.html into external CSS & JS.")
    ap.add_argument('--dry-run', action='store_true', help='Show actions without writing files')
    ap.add_argument('--force', action='store_true', help='Force re-split even if markers present')
    ap.add_argument('--version', type=str, default='1', help='Cache-bust version query param (default 1)')
    args = ap.parse_args()

    if not TEMPLATE.exists():
        print(f"ERROR: Template not found: {TEMPLATE}", file=sys.stderr)
        return 1
    html = TEMPLATE.read_text(encoding='utf-8')

    if already_split(html) and not args.force:
        print("No-op: split markers already present. Use --force to redo.")
        return 0

    m_style = STYLE_RE.search(html)
    if not m_style:
        print("ERROR: Could not locate <style> block.", file=sys.stderr)
        return 1
    css_block = m_style.group('css')
    style_start, style_end = m_style.span()

    js_match = find_inline_js(html)
    if not js_match:
        print("ERROR: Could not locate target inline <script> block after data scripts.", file=sys.stderr)
        return 1
    js_start, js_end, js_body = js_match

    # Extract raw JS without trailing </script>
    # js_body currently excludes closing tag by slice logic above.

    actions = {
        'css_bytes': len(css_block.encode('utf-8')),
        'js_bytes': len(js_body.encode('utf-8')),
        'css_out': str(CSS_OUT),
        'js_out': str(JS_OUT),
    }

    if args.dry_run:
        print("DRY-RUN actions:")
        for k,v in actions.items():
            print(f"  {k}: {v}")
        print("Would create backup and write external files, then inject link & script tags with sentinels.")
        return 0

    # Create backup
    timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    backup_path = TEMPLATE.with_suffix(f'.html.bak.{timestamp}')
    backup_path.write_text(html, encoding='utf-8')

    # Prepare new HTML
    link_tag = f"{CSS_SENTINEL}\n<link rel=\"stylesheet\" href=\"{{{{ url_for('static', filename='css/shifts.css') }}}}?v={args.version}\">"
    script_tag = f"{JS_SENTINEL}\n<script src=\"{{{{ url_for('static', filename='js/shifts.js') }}}}?v={args.version}\"></script>"

    new_html = html[:style_start] + link_tag + html[style_end:js_start] + script_tag + html[js_end:]

    # Write files & updated template
    CSS_OUT.parent.mkdir(parents=True, exist_ok=True)
    JS_OUT.parent.mkdir(parents=True, exist_ok=True)
    CSS_OUT.write_text(css_block.strip() + '\n', encoding='utf-8')
    JS_OUT.write_text(js_body.strip() + '\n', encoding='utf-8')
    TEMPLATE.write_text(new_html, encoding='utf-8')

    # Basic validation
    post_html = TEMPLATE.read_text(encoding='utf-8')
    if CSS_SENTINEL not in post_html or JS_SENTINEL not in post_html:
        print("ERROR: Sentinels missing after write; aborting.", file=sys.stderr)
        return 1

    print("Split complete.")
    print(f"Backup: {backup_path.name}")
    print(f"CSS: {CSS_OUT} ({actions['css_bytes']} bytes) -> linked with ?v={args.version}")
    print(f"JS:  {JS_OUT} ({actions['js_bytes']} bytes) -> linked with ?v={args.version}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
