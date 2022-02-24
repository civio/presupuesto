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
    main_investments = MainInvestment.objects.each_denormalized("current_year_amount", query, [ entity.id ])
    for item in main_investments:
        column_name = str(getattr(item, 'year'))
        c['area_breakdown'].add_item(column_name, item)
        c['policy_breakdown'].add_item(column_name, item)
        c['department_breakdown'].add_item(column_name, item)

    # All years
    main_investments = MainInvestment.objects.each_denormalized("total_expected_amount", query, [ entity.id ])
    for item in main_investments:
        # I don't like calling the column "actual_", when "total_" or "all_years_" would be
        # more appropriate, but the budget/actual two-column design is baked into other parts
        # of the code. The CSV/XLS generation code, for example. So we do this.
        column_name = "actual_"+str(getattr(item, 'year'))
        c['area_breakdown'].add_item(column_name, item)
        c['policy_breakdown'].add_item(column_name, item)
        c['department_breakdown'].add_item(column_name, item)

    # Get additional information
    populate_entity_descriptions(c, entity)

    return render(c, render_callback, 'main_investments/index.html')
