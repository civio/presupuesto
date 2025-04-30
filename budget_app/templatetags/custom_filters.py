import re

from urllib import parse as urlparse
from urllib.parse import urlencode
from django_jinja import library

@library.filter
def redirect_url(value, lang):
    result = re.sub(r'^/[^/]+(/.*)$', r'/%s\1' % lang, value)
    return result

@library.filter
def paginate(url, page):
    url_parts = list(urlparse.urlparse(url))
    query = dict(urlparse.parse_qsl(url_parts[4]))
    query.update({'page': page})
    url_parts[4] = urlencode(query)
    return urlparse.urlunparse(url_parts)

@library.filter
def split(s, pattern):
    return s.split(pattern)

@library.filter
# After more than an hour fighting with this, I couldn't set the locale to get Python
# to use the right thousands separator, so I'm doing this. :/
# Oh, and then found out that Madrid is running under Python 2.6, so the `{,d}`
# syntax is not supported. So we'll do it ourselves.
# Adapted from https://www.netnea.com/cms/2013/11/08/thousands-separators-for-numbers-in-python-2-6/
def add_thousands_separator(value, language):
    separator = ',' if language=='en' else '.'
    s = str(value)
    groups = []
    while s and s[-1].isdigit():
        groups.append(s[-3:])
        s = s[:-3]
    return s + separator.join(reversed(groups))
