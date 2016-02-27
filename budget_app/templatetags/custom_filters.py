import re
import urlparse
from urllib import urlencode

from django import template

register = template.Library()


@register.filter()
def redirect_url(value, lang):
    result = re.sub(r'^/[^/]+(/.*)$', r'/%s\1' % lang, value)
    return result

@register.filter
def paginate(url, page):
    url_parts = list(urlparse.urlparse(url))
    query = dict(urlparse.parse_qsl(url_parts[4]))
    query.update({'page': page})
    url_parts[4] = urlencode(query)
    return urlparse.urlunparse(url_parts)

