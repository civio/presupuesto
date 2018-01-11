# -*- coding: UTF-8 -*-

from django.utils.translation import ugettext as _
from budget_app.models import BudgetBreakdown, Investment, GeographicCategory
from helpers import *


def investments(request, render_callback=None):
    c = get_context(request, css_class='body-investments', title=_(u'Inversiones por distrito'))
    entity = get_main_entity(c)
    set_entity(c, entity)

    # Get the investments breakdown
    query = "e.id = %s"
    investments = Investment.objects.each_denormalized(query, [ entity.id ])
    c['area_breakdown'] = BudgetBreakdown(['area'])
    c['no_area_breakdown'] = BudgetBreakdown(['area'])
    for item in investments:
        column_name = year_column_name(item)
        if item.area in ['NN', 'NA']:
            c['no_area_breakdown'].add_item(column_name, item)
        else:
            c['area_breakdown'].add_item(column_name, item)

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

    return render(c, render_callback, 'investments/index.html')


def investments_show(request, id, title, render_callback=None):
    c = get_context(request, css_class='body-investments', title=_(u'Inversiones por distrito'))
    entity = get_main_entity(c)
    set_entity(c, entity)

    # Get area name
    c['area'] = GeographicCategory.objects.filter(  budget__entity=entity,
                                                    code=id)[0]

    # Get the investments breakdown
    query = "gc.code = %s and e.id = %s"
    investments = Investment.objects.each_denormalized(query, [ id, entity.id ])
    c['area_breakdown'] = BudgetBreakdown(['policy', 'description'])
    for item in investments:
        column_name = year_column_name(item)
        c['area_breakdown'].add_item(column_name, item)

    # Get additional information
    populate_stats(c)
    populate_entity_descriptions(c, entity)
    populate_years(c, c['area_breakdown'])
    populate_budget_statuses(c, entity.id)

    # The per-capita format in investment pages is misleading, as it refers to the whole
    # entity population, not the particular districts/neighborhoods/areas, so we hide it.
    c['hide_per_capita_format'] = True

    return render(c, render_callback, 'investments/show.html')
