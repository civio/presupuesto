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

        # Remove tracking parameters added by Mailchimp, as they break the cache, i.e.
        # effectively every user gets her own cache, which totally defeats the purpose.
        # We similarly remove FB's or Google Analytics' ones too, just in case.
        # See civio/presupuesto-management#313
        q = request.GET.copy()
        for arg in ['mc_cid', 'mc_eid', 'fbclid', 'fbaid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']:
            q.pop(arg, None)
        request.META['QUERY_STRING'] = q.urlencode()
