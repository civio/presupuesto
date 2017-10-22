# -*- coding: UTF-8 -*-

import json

from django.conf import settings
from django.http import HttpResponse
from django.utils.translation import ugettext as _
from budget_app.models import BudgetBreakdown, Payment
from helpers import *

# Auxiliary class needed to access arbitrary attributes as objects.
# See http://stackoverflow.com/a/2827664
class MockPayment(object):
    pass

def payments(request, render_callback=None):
    c = get_context(request, css_class='body-payments', title=_('Inversiones y pagos'))
    main_entity = get_main_entity(c)
    set_entity(c, main_entity)
    return payments_helper(request, c, main_entity, render_callback)

def payments_helper(request, c, entity, render_callback=None):
    # Retrieve the information needed for the search form: years, areas and payees
    __set_year_range(c, entity)
    c['payees'] = Payment.objects.get_payees(entity)
    c['areas'] = Payment.objects.get_areas(entity)

    __populate_summary_breakdowns(c, entity, c['first_year'], c['last_year'])

    # Needed for the footnote on inflation
    populate_stats(c)

    c['payments_year_range'] = True
    if hasattr(settings, 'PAYMENTS_YEAR_RANGE'):
        c['payments_year_range'] = settings.PAYMENTS_YEAR_RANGE

    return render_response('payments/index.html', c)


def payment_search(request, render_callback=None):
    c = get_context(request)
    main_entity = get_main_entity(c)
    return payment_search_helper(request, c, main_entity, render_callback)

def payment_search_helper(request, c, entity, render_callback=None):
    set_entity(c, entity)

    # Get search parameters
    area = request.GET.get('area', '')
    payee = request.GET.get('payee', '')
    description = request.GET.get('description', '')
    years = request.GET.get('date', '')

    # Get year range
    if ( years != '' ):
        from_year, to_year = __parse_year_arguments(years)
    else:
        __set_year_range(c, entity)
        from_year, to_year = c['first_year'], c['last_year']

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

    if ( description != '' ):
        query += " AND to_tsvector('"+settings.SEARCH_CONFIG+"',p.description) @@ plainto_tsquery('"+settings.SEARCH_CONFIG+"',%s)"
        query_arguments.append(description)

    # At this point we check whether there's actually any search criteria. If not, displaying
    # the whole list is unmanageable, so we only display to the summary stats.
    # XXX: There's one exception to this: if we're generating a CSV or XLS file we do need
    # to have the whole list. Maybe we shouldn't offer those full-blown files in the UI,
    # but at the moment we do, so we deal with it.
    if len(query_arguments) == 1 and not render_callback:
        __populate_summary_breakdowns(c, c['entity'], from_year, to_year)

    else:
        # We add the year range criteria...
        if ( years != '' ):
            query += " AND b.year >= %s AND b.year <= %s"
            query_arguments.extend([from_year, to_year])

        # ...and query the database, finally.
        c['payments'] = Payment.objects.each_denormalized(query, query_arguments)

        # Populate the breakdowns, unless we're rendering CSV/Excels, not needed then
        if not render_callback:
            __populate_detailed_breakdowns(c)

    # XXX: We can't use render() as it is now because we need to set the content_type.
    # Also because of the content type, note we're not using our render_response() wrapper,
    # which sets meta, although it's not needed for the JSON response.
    if render_callback:
        return render(c, render_callback, '')
    else:
        return render_to_response('payments/search.json', c, content_type="application/json")


def __populate_summary_breakdowns(c, entity, from_year, to_year):
    payments_count = 0
    total_amount = 0

    # Get the list of biggest payees
    c['payee_breakdown'] = BudgetBreakdown(['payee'])
    for payee in Payment.objects.get_biggest_payees(entity, from_year, to_year, 50):
        # Wrap the database result in an object, so it can be handled by BudgetBreakdown
        payment = MockPayment()
        payment.payee = payee[0]
        payment.expense = True

        amount = int(payee[2])
        payment.amount = amount

        c['payee_breakdown'].add_item('pagos', payment)

    # Get the area breakdown
    c['area_breakdown'] = BudgetBreakdown(['area'])
    for area in Payment.objects.get_area_breakdown(entity, from_year, to_year):
        # Wrap the database result in an object, so it can be handled by BudgetBreakdown
        payment = MockPayment()
        payment.area = area[0]
        payment.expense = True

        amount = int(area[2])
        payment.amount = amount

        # We calculate the overall stats using the area breakdown. The payee one
        # doesn't include anonymised data.
        total_amount += amount
        payments_count += int(area[1])

        c['area_breakdown'].add_item('pagos', payment)

    # Get basic stats for the overall dataset
    c['payments_count'] = payments_count
    c['total_amount'] = total_amount
    c['is_summary'] = True


def __populate_detailed_breakdowns(c):
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
    c['is_summary'] = False

def __set_year_range(c, entity):
    c['years'] = list(Payment.objects.get_years(entity))
    c['first_year'] = c['years'][0]
    c['last_year'] = c['years'][len(c['years'])-1]

def __parse_year_arguments(years):
    if ( years != '' ):
        from_year, to_year = years.split(',')
        if from_year > to_year:     # Sometimes the slider turns around. Cope with it
            to_year, from_year = from_year, to_year
        return from_year, to_year

    else:
        return '', ''