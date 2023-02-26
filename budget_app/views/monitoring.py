# -*- coding: UTF-8 -*-

from budget_app.views.helpers import *
from budget_app.models import GoalIndicator

def monitoring(request, render_callback=None):
    c = get_context(request, css_class='body-monitoring', title='')
    entity = get_main_entity(c)
    set_entity(c, entity)

    populate_entity_descriptions(c, entity)
    populate_latest_budget(c)

    # Consolidate monitoring information.
    # We prepare it in the format the visualization expects it, which is arguably a bit
    # weird. We could adapt the visualization itself to the query results, but this is fine.
    monitoring_data = {}
    for summary in GoalIndicator.objects.get_indicators_summary_by_policy(entity.id):
        year = str(summary[0])
        policy_id = summary[1]
        indicators = summary[3]
        progress = summary[2] / indicators * 100.0

        if not policy_id in monitoring_data:
            monitoring_data[policy_id] = {
                'code': policy_id,
                'label': c['descriptions']['functional'][policy_id]
            }

        monitoring_data[policy_id]['value_'+year] = progress
        monitoring_data[policy_id]['objectives_'+year] = 1234   # FIXME
        monitoring_data[policy_id]['total_'+year] = indicators

    # Output data as JSON to print it in the template's Javascript
    c['monitoring_data'] = json.dumps(monitoring_data.values())

    template = 'monitoring/index_widget.html' if isWidget(request) else 'monitoring/index.html'

    return render(c, render_callback, template)
