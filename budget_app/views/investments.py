# -*- coding: UTF-8 -*-

from django.utils.translation import ugettext as _
from budget_app.models import BudgetBreakdown, Investment, GeographicCategory
from helpers import *


def investments(request):
    c = get_context(request, css_class='body-investments', title=_(u'Inversiones por distrito'))
    entity = get_main_entity(c)

    # Get the investments breakdown
    investments = Investment.objects.each_denormalized()
    c['area_breakdown'] = BudgetBreakdown(['area'])
    for item in investments:
        column_name = year_column_name(item)
        c['area_breakdown'].add_item(column_name, item)

    # Get list of investment areas
    c['districts'] = GeographicCategory.objects.categories(entity)

    # Get additional information
    populate_years(c, c['area_breakdown'])
    populate_entity_descriptions(c, entity)

    return render_response('investments/index.html', c)

def investments_show(request, id, title, render_callback=None):
    c = get_context(request, css_class='body-investments', title=_(u'Inversiones por distrito'))
    entity = get_main_entity(c)

    c['area'] = GeographicCategory.objects.filter(  budget__entity=entity,
                                                    code=id)[0]

    return render_response('investments/show.html', c)