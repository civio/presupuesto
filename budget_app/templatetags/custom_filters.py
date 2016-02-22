import re

from django import template

register = template.Library()


@register.filter()
def redirect_url(value, lang):
    result = re.sub(r'^/[^/]+(/.*)$', r'/%s\1' % lang, value)
    return result

