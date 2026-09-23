"""
Save a sample of a site's pages and downloads, to compare them before and after a change,
typically a dependency upgrade:

    python tests/e2e/snapshot.py http://localhost:8000 /tmp/before
    ... upgrade ...
    python tests/e2e/snapshot.py http://localhost:8000 /tmp/after
    diff -r /tmp/before /tmp/after

Excel files are saved as text, so they can be compared too. Only compare snapshots of the
same site in the same environment: a dev server renders assets differently than production.
"""

import argparse
import io
import os
import re
import sys
import urllib.error

import openpyxl

from site_helpers import fetch, sample_paths, sitemap_paths


def xlsx_to_text(body):
    workbook = openpyxl.load_workbook(io.BytesIO(body), read_only=True)
    lines = []
    for sheet in workbook.worksheets:
        lines.append('# %s' % sheet.title)
        lines.extend('\t'.join('' if cell is None else str(cell) for cell in row) for row in sheet.iter_rows(values_only=True))
    return '\n'.join(lines).encode('utf-8')


def save(base_url, path, output_dir):
    try:
        status, headers, body = fetch(base_url + path)
    except urllib.error.HTTPError as error:
        status, headers, body = error.code, error.headers, b''
    if path.endswith('.xlsx') and status == 200:
        body = xlsx_to_text(body)

    filename = path.strip('/') or 'index'
    if path.endswith('/') and path != '/':
        filename += '/index'
    if path.endswith('.xlsx'):
        filename += '.txt'
    elif '.' not in os.path.basename(filename):
        filename += '.html'
    filename = os.path.join(output_dir, filename)
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(('HTTP %s\n\n' % status).encode() + body)

    print(status, path, file=sys.stderr)
    return body.decode('utf-8', errors='replace') if headers.get_content_type() == 'text/html' else ''


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('base_url')
    parser.add_argument('output_dir')
    parser.add_argument('--per-type', type=int, default=3, help='pages of each kind to save, per language')
    args = parser.parse_args()
    base_url = args.base_url.rstrip('/')

    paths = ['/robots.txt', '/version.json', '/sitemap.xml']
    for sample in sample_paths(sitemap_paths(base_url), args.per_type).values():
        paths.extend(sample)

    downloads = set()
    for path in paths:
        html = save(base_url, path, args.output_dir)
        downloads.update(re.findall(r'href="([^"]+\.(?:csv|xlsx))"', html))
    for path in sorted(downloads):
        save(base_url, path, args.output_dir)


if __name__ == '__main__':
    main()
