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
    # Retrieve the information needed for the search form: years, areas, departments and payees
    __set_year_range(c, entity)
    c['payees'] = Payment.objects.get_payees(entity)
    c['areas'] = Payment.objects.get_areas(entity)
    c['departments'] = Payment.objects.get_departments(entity)

    # Calculate overall stats and summary
    __populate_summary_breakdowns(c, entity, c['first_year'], c['last_year'])

    # Additional information: to populate drop-downs and for the inflation footnote
    populate_descriptions(c)
    populate_stats(c)

    return render_response('payments/index.html', c)


def payment_search(request, render_callback=None):
    c = get_context(request)
    main_entity = get_main_entity(c)
    return payment_search_helper(request, c, main_entity, render_callback)

def payment_search_helper(request, c, entity, render_callback=None):
    set_entity(c, entity)

    # Get search parameters
    area = request.GET.get('area', '')
    department = request.GET.get('department', '')
    payee = request.GET.get('payee', '')
    description = request.GET.get('description', '')
    amount = request.GET.get('amount', '')
    years = request.GET.get('date', '')

    # Get year range
    if ( years != '' ):
        from_year, to_year = __parse_range_argument(years)
    else:
        __set_year_range(c, entity)
        from_year, to_year = c['first_year'], c['last_year']

    # Create basic query...
    query = "b.entity_id = %s"
    query_arguments = [c['entity'].id]
    active_filters = []

    # ...and add criteria as needed
    if ( area != '' ):
        query += " AND p.area = %s"
        query_arguments.append(area)
        active_filters.append('area')

    if ( department != '' ):
        query += " AND department = %s"
        query_arguments.append(department)
        active_filters.append('department')

    if ( amount != '' ):
        from_amount, to_amount = __parse_range_argument(amount)
        query += " AND p.amount >= %s AND p.amount <= %s"
        query_arguments.extend([from_amount, to_amount])
        active_filters.append('amount')

    if ( payee != '' ):
        query += " AND p.payee = %s"
        query_arguments.append(payee)
        active_filters.append('payee')

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
            __populate_detailed_breakdowns(c, active_filters)

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
        payment.amount = int(payee[2])

        c['payee_breakdown'].add_item('pagos', payment)

    # Get the area breakdown
    c['area_breakdown'] = BudgetBreakdown(['area'])
    for area in Payment.objects.get_area_breakdown(entity, from_year, to_year):
        # Wrap the database result in an object, so it can be handled by BudgetBreakdown
        payment = MockPayment()
        payment.area = area[0]
        payment.expense = True
        payment.amount = int(area[2])

        # We calculate the overall stats using the area breakdown. The payee one
        # doesn't include anonymised data.
        total_amount += payment.amount
        payments_count += int(area[1])

        c['area_breakdown'].add_item('pagos', payment)

    # Get the biggest payment, used to set up the amount slider
    biggest_payment = Payment.objects.find_biggest_payment(entity, from_year, to_year)[0]

    # Get basic stats for the overall dataset
    c['payments_count'] = payments_count
    c['total_amount'] = total_amount
    c['max_amount'] = biggest_payment.amount
    c['is_summary'] = True


def __populate_detailed_breakdowns(c, active_filters):
    # Read settings on how to structure the search results...
    breakdown_by_payee_criteria = ['payee', 'area', 'description']
    if hasattr(settings, 'PAYMENTS_BREAKDOWN_BY_PAYEE'):
        breakdown_by_payee_criteria = settings.PAYMENTS_BREAKDOWN_BY_PAYEE

    breakdown_by_area_criteria = ['area', 'payee', 'description']
    if hasattr(settings, 'PAYMENTS_BREAKDOWN_BY_AREA'):
        breakdown_by_area_criteria = settings.PAYMENTS_BREAKDOWN_BY_AREA

    # But, before moving forward, remove from the search results those criteria
    # that are being used to filter, as they are redundant.
    for filter in active_filters:
        if filter in breakdown_by_area_criteria:
            breakdown_by_area_criteria.remove(filter)
        if filter in breakdown_by_payee_criteria:
            breakdown_by_payee_criteria.remove(filter)

    # We're ready to create the breakdowns and move forward.
    c['payee_breakdown'] = BudgetBreakdown(breakdown_by_payee_criteria)
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
    # Are we working with year ranges, or just one at a time?
    c['payments_year_range'] = True
    if hasattr(settings, 'PAYMENTS_YEAR_RANGE'):
        c['payments_year_range'] = settings.PAYMENTS_YEAR_RANGE

    c['years'] = list(Payment.objects.get_years(entity))
    c['last_year'] = c['years'][len(c['years'])-1]
    c['first_year'] = c['years'][0] if c['payments_year_range'] else c['last_year']

def __parse_range_argument(range):
    if ( range != '' ):
        from_value, to_value = range.split(',')
        if int(from_value) > int(to_value):     # Sometimes the slider turns around. Cope with it
            to_value, from_value = from_value, to_value
        return from_value, to_value

    else:
        return '', ''