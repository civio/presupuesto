import re

from django import template

register = template.Library()


def redirect_url(value, lang):
    result = re.sub(r'^/[^/]+(/.+)$', r'/%s\1' % lang, value)
    return result


register.filter('redirect_url', redirect_url)
