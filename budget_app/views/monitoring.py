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
    monitoring_years = set()
    last_monitoring_year = None
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

        # Keep track of available years, and the latest year with actual content
        monitoring_years.add(year)
        if progress>0:
            last_monitoring_year = max(last_monitoring_year, year)

    # Output data as JSON to print it in the template's Javascript
    c['monitoring_data'] = json.dumps(sorted(monitoring_data.values()))
    c['monitoring_years'] = json.dumps(sorted(monitoring_years))
    c['last_monitoring_year'] = last_monitoring_year

    template = 'monitoring/index_widget.html' if isWidget(request) else 'monitoring/index.html'

    return render(c, render_callback, template)
