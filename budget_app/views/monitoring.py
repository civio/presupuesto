# -*- coding: UTF-8 -*-

from budget_app.views.helpers import *
from budget_app.models import GoalIndicator

def monitoring(request, render_callback=None):
    c = get_context(request, css_class='body-monitoring', title='')
    entity = get_main_entity(c)
    set_entity(c, entity)

    # Add monitoring information
    c['monitoring_policies'] = GoalIndicator.objects.get_indicators_summary_by_policy(entity.id)

    # FIXME: We're dumping the info as CSV here temporarily
    populate_entity_descriptions(c, entity)
    # for p in c['monitoring_policies']:
    #     print('%s,%s,"%s",%s,%s' % (p[0], p[1], c['descriptions']['functional'][p[1]], p[2], p[3]))

    populate_latest_budget(c)

    template = 'monitoring/index_widget.html' if isWidget(request) else 'monitoring/index.html'

    return render(c, render_callback, template)
