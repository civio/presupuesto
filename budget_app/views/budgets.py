# -*- coding: UTF-8 -*-

from django.conf import settings
from django.utils.translation import ugettext as _
from budget_app.models import Budget, BudgetBreakdown, BudgetItem
from helpers import *


def budgets(request, render_callback=None):
    # Get request context
    c = get_context(request, css_class='body-summary', title=_(u'Visión global'))

    # Retrieve the entity to display
    main_entity = get_main_entity(c)

    # Income/expense breakdown
    c['breakdowns'] = {
        'functional': BudgetBreakdown(['policy', 'programme']),
        'economic': BudgetBreakdown(['article', 'heading']),
        'chapter': BudgetBreakdown(['chapter']) # Used for indicators
    }
    for item in BudgetItem.objects.each_denormalized("e.id = %s", [main_entity.id]):
        column_name = year_column_name(item)
        c['breakdowns']['chapter'].add_item(column_name, item)
        if c['include_financial_chapters'] or not item.is_financial():
            c['breakdowns']['functional'].add_item(column_name, item)
            c['breakdowns']['economic'].add_item(column_name, item)

    # Additional data needed by the view
    populate_stats(c)
    populate_descriptions(c)
    populate_budget_statuses(c, main_entity)
    populate_years(c, c['breakdowns']['functional'])

    # The percentage format in the Overview page is redundant for the Sankey and gets very
    # confusing when comparing budget vs actual figures, so we hide it.
    c['hide_percentage_format'] = True
    # XXX: Now, the per capita format may make sense, but since we're adding the format
    # controller late in the game (#602), we'll start just with nominal vs. real. Once the
    # infrastructure is in place it really wouldn't be that hard to add a third format.
    c['hide_per_capita_format'] = True


    c['income_nodes'] = json.dumps(settings.OVERVIEW_INCOME_NODES)
    c['expense_nodes'] = json.dumps(settings.OVERVIEW_EXPENSE_NODES)

    if hasattr(settings, 'OVERVIEW_RELAX_FACTOR'):
        c['relax_factor'] = settings.OVERVIEW_RELAX_FACTOR
    if hasattr(settings, 'OVERVIEW_NODE_PADDING'):
        c['overview_node_padding'] = settings.OVERVIEW_NODE_PADDING
    if hasattr(settings, 'OVERVIEW_FORCE_ORDER'):
        c['overview_force_order'] = settings.OVERVIEW_FORCE_ORDER

    if hasattr(settings, 'OVERVIEW_LABELS_MIN_SIZE'):
        c['overview_labels_min_size'] = settings.OVERVIEW_LABELS_MIN_SIZE
    if hasattr(settings, 'OVERVIEW_LABELS_FONT_SIZE_MIN'):
        c['overview_labels_font_size_min'] = settings.OVERVIEW_LABELS_FONT_SIZE_MIN
    if hasattr(settings, 'OVERVIEW_LABELS_FONT_SIZE_MAX'):
        c['overview_labels_font_size_max'] = settings.OVERVIEW_LABELS_FONT_SIZE_MAX

    c['show_overview_subtotals'] = False
    if hasattr(settings, 'SHOW_OVERVIEW_SUBTOTALS'):
        c['show_overview_subtotals'] = settings.SHOW_OVERVIEW_SUBTOTALS

    c['calculate_budget_indicators'] = True
    if hasattr(settings, 'CALCULATE_BUDGET_INDICATORS'):
        c['calculate_budget_indicators'] = settings.CALCULATE_BUDGET_INDICATORS

     # if parameter widget defined use widget template instead of standard one
    template = 'budgets/index_widget.html' if isWidget(request) else 'budgets/index.html'

    return render(c, render_callback, template)
