# -*- coding: UTF-8 -*-

from django.utils.translation import ugettext as _
from budget_app.models import BudgetBreakdown, Investment, GeographicCategory
from .helpers import *


def investments(request, render_callback=None):
    c = get_context(request, css_class='body-investments', title=_(u'Inversiones por distritos'))
    entity = get_main_entity(c)
    set_entity(c, entity)

    # Get the investments breakdown
    query = "e.id = %s"
    investments = Investment.objects.each_denormalized(query, [ entity.id ])
    c['area_breakdown'] = BudgetBreakdown(['area'])
    c['special_investments_area_breakdown'] = BudgetBreakdown(['area'])
    c['no_area_breakdown'] = BudgetBreakdown(['area'])
    c['special_investments_no_area_breakdown'] = BudgetBreakdown(['area'])
    for item in investments:
        column_name = year_column_name(item)
        if item.area == 'NA':
            c['no_area_breakdown'].add_item(column_name, item)
            if _is_special_investment(item):
                c['special_investments_no_area_breakdown'].add_item(column_name, item)
        else:
            c['area_breakdown'].add_item(column_name, item)
            if _is_special_investment(item):
                c['special_investments_area_breakdown'].add_item(column_name, item)

    # Get list of investment areas
    c['areas'] = GeographicCategory.objects.categories(entity)

    # Get additional information
    populate_stats(c)
    populate_entity_descriptions(c, entity)
    populate_years(c, c['area_breakdown'])
    populate_budget_statuses(c, entity.id)

    # The per-capita format in investment pages is misleading, as it refers to the whole
    # entity population, not the particular districts/neighborhoods/areas, so we hide it.
    c['hide_per_capita_format'] = True

    # if parameter widget defined use policies/widget template instead of policies/show
    template = 'investments/index_widget.html' if isWidget(request) else 'investments/index.html'

    return render(c, render_callback, template)


def investments_show(request, id, title, render_callback=None):
    c = get_context(request, css_class='body-investments', title=_(u'Inversiones por distrito'))
    entity = get_main_entity(c)
    set_entity(c, entity)

    # Get area name
    c['area'] = GeographicCategory.objects.filter(  budget__entity=entity,
                                                    code=id).first()

    # Get the investments breakdown
    query = "gc.code = %s and e.id = %s"
    investments = Investment.objects.each_denormalized(query, [ id, entity.id ])
    c['area_breakdown'] = BudgetBreakdown(['policy', 'description'])
    c['special_investments_area_breakdown'] = BudgetBreakdown(['policy', 'description'])
    for item in investments:
        column_name = year_column_name(item)
        c['area_breakdown'].add_item(column_name, item)
        if _is_special_investment(item):
            c['special_investments_area_breakdown'].add_item(column_name, item)

    # Get additional information
    populate_stats(c)
    populate_entity_descriptions(c, entity)
    populate_years(c, c['area_breakdown'])
    populate_budget_statuses(c, entity.id)

    # The per-capita format in investment pages is misleading, as it refers to the whole
    # entity population, not the particular districts/neighborhoods/areas, so we hide it.
    c['hide_per_capita_format'] = True

     # if parameter widget defined use policies/widget template instead of policies/show
    template = 'investments/show_widget.html' if isWidget(request) else 'investments/show.html'

    return render(c, render_callback, template)

# XXX: This is hardcoded at the moment as the requirements are evolving.
# But it would make complete sense to add a flag to the database and set it
# in the loader. We'll do once things settle and/or we reuse it somewhere else.
def _is_special_investment(item):
    return item.description[0:3] == 'IFS'
