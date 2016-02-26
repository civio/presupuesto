from coffin.shortcuts import render_to_response
from paginator import DiggPaginator as Paginator
from django.utils.translation import ugettext as _
from budget_app.models import GlossaryTerm
from helpers import *

PAGE_LENGTH = 10

def terms(request):
    c = get_context(request, css_class='body-glossary', title=_('Inicio'))

    c['query'] = request.GET.get('q', '')
    c['query_string'] = "q=%s&" % (c['query'])
    c['page'] = request.GET.get('page', 1)

    results = Paginator(list(GlossaryTerm.objects.search(c['query'], request.LANGUAGE_CODE)), PAGE_LENGTH, body=6, padding=2)
    c['terms'] = results.page(c['page'])

    return render_to_response('terms/index.html', c)
