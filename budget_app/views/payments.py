# -*- coding: UTF-8 -*-

import json

from django.conf import settings
from django.http import HttpResponse
from django.utils.translation import ugettext as _
from coffin.shortcuts import render_to_response
from budget_app.models import BudgetBreakdown, Payment
from helpers import *

# Auxiliary class needed to access arbitrary attributes as objects.
# See http://stackoverflow.com/a/2827664
class MockPayment(object):
    pass

def payments(request, render_callback=None):
    # Get request context
    c = get_context(request, css_class='body-payments', title=_('Inversiones y pagos'))

    # Retrieve the entity to display
    c['entity'] = get_main_entity(c)

    # Retrieve the information needed for the search form: years, areas and payees
    c['years'] = list(Payment.objects.get_years(c['entity']))
    c['first_year'] = c['years'][0]
    c['last_year'] = c['years'][len(c['years'])-1]

    c['payees'] = Payment.objects.get_payees(c['entity'])

    c['areas'] = Payment.objects.get_areas(c['entity'])

    # Get the list of biggest payees
    c['payee_breakdown'] = BudgetBreakdown(['payee'])
    for payee in Payment.objects.get_biggest_payees(c['entity'], 50):
        # Wrap the database result in an object, so it can be handled by BudgetBreakdown
        payment = MockPayment()
        payment.payee = payee[0]
        payment.amount = int(payee[1])
        payment.expense = True
        c['payee_breakdown'].add_item('pagos', payment)

    # Get the area breakdown
    c['area_breakdown'] = BudgetBreakdown(['area'])
    for area in Payment.objects.get_area_breakdown(c['entity']):
        # Wrap the database result in an object, so it can be handled by BudgetBreakdown
        payment = MockPayment()
        payment.area = area[0]
        payment.amount = int(area[1])
        payment.expense = True
        c['area_breakdown'].add_item('pagos', payment)

    # Needed for the footnote on inflation
    populate_stats(c)

    return render_to_response('payments/index.html', c)


def payment_search(request, render_callback=None):
    # Get search parameters
    area = request.GET.get('area', '')
    payee = request.GET.get('payee', '')
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

    if ( payee != '' ):
        query += " AND p.payee = %s"
        query_arguments.append(payee)

    if ( years != '' ):
        from_year, to_year = years.split(',')
        if from_year > to_year:     # Sometimes the slider turns around. Cope with it
            to_year, from_year = from_year, to_year
        query += " AND b.year >= %s AND b.year <= %s"
        query_arguments.extend([from_year, to_year])

    if ( description != '' ):
        query += " AND to_tsvector('"+settings.SEARCH_CONFIG+"',p.description) @@ plainto_tsquery('"+settings.SEARCH_CONFIG+"',%s)"
        query_arguments.append(description)

    c['payments'] = Payment.objects.each_denormalized(query, query_arguments)

    if render_callback:
        return render(c, render_callback, '')
    else:
        __populate_breakdowns(c)
        return render_to_response('payments/search.json', c, content_type="application/json")


def __populate_breakdowns(c):
    breakdown_by_payee_criteria = ['payee', 'area', 'description']
    if hasattr(settings, 'PAYMENTS_BREAKDOWN_BY_PAYEE'):
        breakdown_by_payee_criteria = settings.PAYMENTS_BREAKDOWN_BY_PAYEE
    c['payee_breakdown'] = BudgetBreakdown(breakdown_by_payee_criteria)

    breakdown_by_area_criteria = ['area', 'payee', 'description']
    if hasattr(settings, 'PAYMENTS_BREAKDOWN_BY_AREA'):
        breakdown_by_area_criteria = settings.PAYMENTS_BREAKDOWN_BY_AREA
    c['area_breakdown'] = BudgetBreakdown(breakdown_by_area_criteria)

    payments_count = 0
    for item in c['payments']:
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
    c['total_amount'] = c['payee_breakdown'].total_expense['pagos'] if payments_count > 0 else 0
