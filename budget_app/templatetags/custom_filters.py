import re
import urlparse
from urllib import urlencode

from django import template
from django.template.defaultfilters import slugify

register = template.Library()

@register.filter()
def redirect_url(value, lang):
    result = re.sub(r'^/[^/]+(/.*)$', r'/%s\1' % lang, value)
    return result

@register.filter
def paginate(url, page):
    url_parts = list(urlparse.urlparse(url))
    # Why the ASCII encoding? See http://stackoverflow.com/a/16614758
    # via http://www.lexev.org/en/2013/parse-url-which-chontains-unicode-query-using-urlp/
    query = dict(urlparse.parse_qsl(url_parts[4].encode('ascii')))
    query.update({'page': page})
    url_parts[4] = urlencode(query)
    return urlparse.urlunparse(url_parts)

@register.filter()
def slug(s):
    return slugify(s)

@register.filter()
def split(s, pattern):
    return s.split(pattern)

@register.filter()
def add_thousands_separator(value, language):
    formatted = '{:,d}'.format(value)
    # After more than an hour fighting with this, I couldn't set the locale to get Python
    # to use the right thousands separator, so I'm doing this. :/
    if language!='en':
        formatted = formatted.replace(',', '.')
    return formatted
