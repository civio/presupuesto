# -*- coding: UTF-8 -*-

from django.utils.translation import ugettext as _
from budget_app.models import BudgetBreakdown, Investment
from helpers import *


def investments(request):
    c = get_context(request, css_class='body-investments', title=_(u'Inversiones por distrito'))

    entity = get_main_entity(c)

    c['districts'] = [
        {
        'path': 'arganzuela',
        'name': 'Arganzuela'
        },
        {
        'path': 'barajas',
        'name': 'Barajas'
        },
        {
        'path': 'carabanchel',
        'name': 'Carabanchel'
        },
        {
        'path': 'centro',
        'name': 'Centro'
        },
        {
        'path': 'chamartin',
        'name': 'Chamart&iacute;n'
        },
        {
        'path': 'chamberi',
        'name': 'Chamber&iacute;'
        },
        {
        'path': 'ciudad-lineal',
        'name': 'Ciudad Lineal'
        },
        {
        'path': 'fuencarral-el-pardo',
        'name': 'Fuencarral-El Pardo'
        },
        {
        'path': 'hortaleza',
        'name': 'Hortaleza'
        },
        {
        'path': 'latina',
        'name': 'Latina'
        },
        {
        'path': 'moncloa-aravaca',
        'name': 'Moncloa-Aravaca'
        },
        {
        'path': 'moratalaz',
        'name': 'Moratalaz'
        },
        {
        'path': 'puente-de-vallecas',
        'name': 'Puente de Vallecas'
        },
        {
        'path': 'retiro',
        'name': 'Retiro'
        },
        {
        'path': 'salamanca',
        'name': 'Salamanca'
        },
        {
        'path': 'san-blas-canillejas',
        'name': 'San Blas-Canillejas'
        },
        {
        'path': 'tetuan',
        'name': 'Tetu&aacute;n'
        },
        {
        'path': 'usera',
        'name': 'Usera'
        },
        {
        'path': 'vicalvaro',
        'name': 'Vic&aacute;lvaro'
        },
        {
        'path': 'villa de vallecas',
        'name': 'Villa de Vallecas'
        },
        {
        'path': 'villaverde',
        'name': 'Villaverde'
        }
    ]

    # Get the investments breakdown
    investments = Investment.objects.each_denormalized()
    c['area_breakdown'] = BudgetBreakdown(['area'])
    for item in investments:
        column_name = year_column_name(item)
        c['area_breakdown'].add_item(column_name, item)

    populate_years(c, c['area_breakdown'])
    populate_entity_descriptions(c, entity)

    return render_response('investments/index.html', c)

def investments_show(request, id, title, render_callback=None):
    c = get_context(request, css_class='body-investments', title=title)
    c['name'] = title;
    return render_response('investments/show.html', c)