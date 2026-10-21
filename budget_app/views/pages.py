# -*- coding: UTF-8 -*-

from django.utils.translation import gettext as _
from .helpers import *

def pages(request):
    c = get_context(request, css_class='body-cookies', title=_(u'Política de Cookies'))
    return render_response('pages/cookies.html', c)
