# -*- coding: UTF-8 -*-

from django.utils.translation import ugettext as _
from budget_app.models import GlossaryTerm
from .paginator import DiggPaginator as Paginator
from .helpers import *
import project.settings as settings

PAGE_LENGTH = 10 if not hasattr(settings, 'TERMS_PAGE_LENGTH') else settings.TERMS_PAGE_LENGTH

def terms(request):
    c = get_context(request, css_class='body-glossary', title=_(u'¿Qué significa?'))

    c['query'] = request.GET.get('q', '')
    c['query_string'] = "q=%s&" % (c['query'])
    c['page'] = request.GET.get('page', 1)

    results = Paginator(list(GlossaryTerm.objects.search(c['query'], c['LANGUAGE_CODE'])), PAGE_LENGTH, body=6, padding=2)
    c['terms'] = results.page(c['page'])
    c['results_size'] = results.count

    return render_response('terms/index.html', c)
