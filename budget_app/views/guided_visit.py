# -*- coding: UTF-8 -*-

from budget_app.views.helpers import *

def guided_visit(request, render_callback=None):
    c = get_context(request, css_class='body-entities', title='')

    return render_response('guided_visit/index.html', c)
