# -*- coding: UTF-8 -*-

import json

from django.conf import settings
from django.http import HttpResponse
from coffin.shortcuts import render_to_response
from budget_app.models import BudgetBreakdown, Payment
from helpers import *

def payments(request, render_callback=None):
    # Get request context
    c = get_context(request, css_class='body-payments', title='Inversiones y pagos')

    # Retrieve the entity to display
    c['entity'] = get_main_entity(c)

    # Retrieve the information needed for the search form: years, areas and payees
    c['years'] = list(Budget.objects.get_years(c['entity']))
    c['first_year'] = c['years'][0]
    c['last_year'] = c['years'][len(c['years'])-1]

    c['payees'] = json.dumps(list(Payment.objects.get_payees(c['entity'])))

    c['areas'] = json.dumps(list(Payment.objects.get_areas(c['entity'])))

    # Retrieve biggest payees
    # FIXME: Not really, we're just returning something to unblock front-end dev
    __populate_breakdowns(c, "b.entity_id = %s and amount > 100000000", [c['entity'].id])

    return render_to_response('payments/index.html', c)


def payment_search(request, render_callback=None):
    # Get search parameters
    area = request.GET.get('area', '')
    years = request.GET.get('date', '')
    description = request.GET.get('description', '')

    # Get request context
    c = get_context(request)

    # Retrieve the entity to display
    c['entity'] = get_main_entity(c)

    # Create basic query...
    query = "b.entity_id = %s"
    query_arguments = [c['entity'].id]

    # ...and add criteria as needed
    if ( area != '' ):
        query += " AND p.area = %s"
        query_arguments.append(area)

    # Payments breakdown
    __populate_breakdowns(c, query, query_arguments)

    return render_to_response('payments/search.json', c, content_type="application/json")


def __populate_breakdowns(c, query, query_arguments):
    breakdown_by_payee_criteria = ['payee', 'area', 'description']
    if hasattr(settings, 'PAYMENTS_BREAKDOWN_BY_PAYEE'):
        breakdown_by_payee_criteria = settings.PAYMENTS_BREAKDOWN_BY_PAYEE
    c['payee_breakdown'] = BudgetBreakdown(breakdown_by_payee_criteria)

    breakdown_by_area_criteria = ['area', 'payee', 'description']
    if hasattr(settings, 'PAYMENTS_BREAKDOWN_BY_AREA'):
        breakdown_by_area_criteria = settings.PAYMENTS_BREAKDOWN_BY_AREA
    c['area_breakdown'] = BudgetBreakdown(breakdown_by_area_criteria)

    payments_count = 0
    for item in Payment.objects.each_denormalized(query, query_arguments):
        # We add the date to the description, if it exists:
        # TODO: I wanted the date to be in a separate column, but it's complicated right
        # now the way BudgetBreakdown works. Need to think about it
        if item.date:
            item.description = item.description + ' (' + str(item.date) + ')'

        c['payee_breakdown'].add_item('pagos', item)
        c['area_breakdown'].add_item('pagos', item)
        payments_count += 1

    # Get basic stats for the overall dataset
    c['payments_count'] = payments_count
    c['total_amount'] = c['payee_breakdown'].total_expense['pagos']
