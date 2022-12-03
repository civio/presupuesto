# -*- coding: UTF-8 -*-

from budget_app.views.helpers import *
from budget_app.models import Goal

def monitoring(request, render_callback=None):
    c = get_context(request, css_class='body-monitoring', title='')
    entity = get_main_entity(c)
    set_entity(c, entity)

    # if parameter widget defined use policies/widget template instead of policies/show
    template = 'monitoring/index_widget.html' if isWidget(request) else 'monitoring/index.html'

    return render(c, render_callback, template)
