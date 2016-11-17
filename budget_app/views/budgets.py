# -*- coding: UTF-8 -*-

from coffin.shortcuts import render_to_response
from django.conf import settings
from budget_app.models import Budget, BudgetBreakdown, BudgetItem
from helpers import *


def budgets(request):
    # Get request context
    c = get_context(request, css_class='body-summary', title='')

    # Retrieve the entity to display
    main_entity = get_main_entity(c)

    # Income/expense breakdown
    c['functional_breakdown'] = BudgetBreakdown(['policy', 'programme'])
    c['economic_breakdown'] = BudgetBreakdown(['article', 'heading'])
    c['chapter_breakdown'] = BudgetBreakdown(['chapter']) # Used for indicators
    for item in BudgetItem.objects.each_denormalized("e.id = %s", [main_entity.id]):
        column_name = year_column_name(item)
        c['chapter_breakdown'].add_item(column_name, item)
        if c['include_financial_chapters'] or not item.is_financial():
            c['functional_breakdown'].add_item(column_name, item)
            c['economic_breakdown'].add_item(column_name, item)

    # Additional data needed by the view
    populate_stats(c)
    populate_descriptions(c)
    populate_budget_statuses(c, main_entity)
    populate_years(c, 'functional_breakdown')

    c['income_nodes'] = json.dumps(settings.OVERVIEW_INCOME_NODES)
    c['expense_nodes'] = json.dumps(settings.OVERVIEW_EXPENSE_NODES)

    if hasattr(settings, 'OVERVIEW_RELAX_FACTOR'):
        c['relax_factor'] = settings.OVERVIEW_RELAX_FACTOR
    if hasattr(settings, 'OVERVIEW_NODE_PADDING'):
        c['node_padding'] = settings.OVERVIEW_NODE_PADDING

    c['adjust_inflation_in_overview'] = True
    if hasattr(settings, 'ADJUST_INFLATION_IN_OVERVIEW'):
        c['adjust_inflation_in_overview'] = settings.ADJUST_INFLATION_IN_OVERVIEW

    c['show_overview_subtotals'] = False
    if hasattr(settings, 'SHOW_OVERVIEW_SUBTOTALS'):
        c['show_overview_subtotals'] = settings.SHOW_OVERVIEW_SUBTOTALS

    c['calculate_budget_indicators'] = True
    if hasattr(settings, 'CALCULATE_BUDGET_INDICATORS'):
        c['calculate_budget_indicators'] = settings.CALCULATE_BUDGET_INDICATORS

    return render_to_response('budgets/index.html', c)
