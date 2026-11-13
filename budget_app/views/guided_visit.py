# -*- coding: UTF-8 -*-

from django.utils.translation import gettext as _

from budget_app.views.helpers import *

@requires_setting('SHOW_GUIDED_VISIT')
def guided_visit(request, render_callback=None):
    c = get_context(request, css_class='body-entities', title=_('Visita guiada'))

    return render_response('guided_visit/index.html', c)
