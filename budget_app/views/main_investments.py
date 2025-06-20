# -*- coding: UTF-8 -*-

from django.utils.translation import ugettext as _
from budget_app.views.helpers import *
from budget_app.models import MainInvestment

def main_investments(request, render_callback=None):
    c = get_context(request, css_class='body-entities', title='')
    entity = get_main_entity(c)
    set_entity(c, entity)

    # Get the investments breakdown
    query = "e.id = %s"
    c['area_breakdown'] = BudgetBreakdown(['area_name', 'description'])
    c['policy_breakdown'] = BudgetBreakdown(['policy', 'description'])
    c['department_breakdown'] = BudgetBreakdown(['entity_name', 'section_name', 'description'])

    # Current year
    main_investments = MainInvestment.objects.each_denormalized("total_expected_amount", query, [ entity.id ])
    for item in main_investments:
        column_name = str(getattr(item, 'year'))
        c['area_breakdown'].add_item(column_name, item)
        c['policy_breakdown'].add_item(column_name, item)
        c['department_breakdown'].add_item(column_name, item)

    # All years
    main_investments = MainInvestment.objects.each_denormalized("already_spent_amount+current_year_spent_amount", query, [ entity.id ])
    for item in main_investments:
        column_name = "actual_"+str(getattr(item, 'year'))
        c['area_breakdown'].add_item(column_name, item)
        c['policy_breakdown'].add_item(column_name, item)
        c['department_breakdown'].add_item(column_name, item)

    # Retrieve the full table for the map
    c['all_main_investments'] = MainInvestment.objects.all_main_investments(entity)

    # Get additional information
    populate_entity_descriptions(c, entity)
    populate_years(c, c['area_breakdown'])

    # The helper method to populate the starting year can't handle year ranges, so we do it ourselves
    years = sorted(list(set(c['area_breakdown'].years.values())))
    c['starting_year'] = [years[0], years[-1]]

    # if parameter widget defined use policies/widget template instead of policies/show
    template = 'main_investments/index_widget.html' if isWidget(request) else 'main_investments/index.html'

    return render(c, render_callback, template)
