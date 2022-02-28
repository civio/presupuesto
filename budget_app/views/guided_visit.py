# -*- coding: UTF-8 -*-
from coffin.shortcuts import render_to_response
from budget_app.views.helpers import *


def guided_visit(request, render_callback=None):
    # Get request context
    c = get_context(request, css_class='body-entities', title='')

    return render_to_response('guided_visit/index.html', c)
