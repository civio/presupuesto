from django.middleware.cache import UpdateCacheMiddleware

import re

class SmartUpdateCacheMiddleware(UpdateCacheMiddleware):
    STRIP_RE = re.compile(r'\b(_[^=]+=.+?(?:; |$))')

    def process_request(self, request):
        # We need to remove Google Analytics cookies or they'll break the cache
        # as soon as there's a "Vary: Cookie" header, which is our case.
        # See https://github.com/aragonopendata/presupuesto/issues/12 for more info.
        cookie = self.STRIP_RE.sub('', request.META.get('HTTP_COOKIE', ''))
        request.META['HTTP_COOKIE'] = cookie

        # And we're going a step further here: since we don't do language negotiation,
        # (i.e. we never try to guess what's the user preferred language, we always
        # default to the same one on the homepage, and every other URL is prefixed
        # with the locale, so there's no ambiguity) we can remove the Accept-Language
        # request header.
        # Copied from https://djangosnippets.org/snippets/218/ (although different goal)
        if request.META.has_key('HTTP_ACCEPT_LANGUAGE'):
            del request.META['HTTP_ACCEPT_LANGUAGE']
