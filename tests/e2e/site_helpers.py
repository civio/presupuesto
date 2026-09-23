"""
Helpers shared by the browser tests and the snapshot script. They only talk to the
site over HTTP, so they work the same against a local dev server or a deployed site.
"""

import base64
import os
import re
import urllib.request
from collections import defaultdict
from urllib.parse import urlparse
from xml.etree import ElementTree

# Optional basic auth, as 'user:password', for sites that sit behind it (e.g. staging)
BASIC_AUTH = os.environ.get('BASIC_AUTH')


def http_credentials():
    if not BASIC_AUTH:
        return None
    username, password = BASIC_AUTH.split(':', 1)
    return {'username': username, 'password': password}


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'presupuesto-e2e'})
    if BASIC_AUTH:
        request.add_header('Authorization', 'Basic ' + base64.b64encode(BASIC_AUTH.encode()).decode())
    with urllib.request.urlopen(request) as response:
        return response.status, response.headers, response.read()


def sitemap_paths(base_url):
    # The sitemap uses the host the request came in with, so we keep just the paths
    _, _, body = fetch(base_url.rstrip('/') + '/sitemap.xml')
    locations = ElementTree.fromstring(body).findall('.//{*}loc')
    return sorted(set(urlparse(loc.text).path for loc in locations))


def page_type(path):
    """
    Group a path by language and kind of page, e.g. ('eu', 'programas/*') for
    '/eu/programas/1112/direccion-y-servicios-generales-de-justicia'.
    """
    segments = [s for s in path.split('/') if s]
    language = segments.pop(0) if segments and re.fullmatch(r'[a-z]{2}', segments[0]) else ''
    if not segments:
        return language, 'welcome'
    if len(segments) == 1:
        return language, segments[0]
    if segments[0] == 'articulos':
        return language, 'articulos/%s/*' % segments[1]
    return language, segments[0] + '/*'


def sample_paths(paths, per_type=1):
    """
    Up to `per_type` paths of each language and kind of page, evenly spread and always the
    same ones. The first ones in the list tend to be odd cases, like internal transfers.
    """
    groups = defaultdict(list)
    for path in paths:
        groups[page_type(path)].append(path)
    samples = {}
    for key in sorted(groups):
        group, n = groups[key], min(per_type, len(groups[key]))
        samples[key] = [group[(2 * i + 1) * len(group) // (2 * n)] for i in range(n)]
    return samples
