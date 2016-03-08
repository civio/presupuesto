# -*- coding: UTF-8 -*-

import json

from django.conf import settings
from coffin.shortcuts import render_to_response
from budget_app.models import BudgetBreakdown, Payment
from helpers import *

def payments(request, render_callback=None):
    # Get request context
    c = get_context(request, css_class='body-payments', title='Inversiones y pagos')

    # Retrieve the entity to display
    main_entity = get_main_entity(c)

    # Retrieve the information needed for the search form: years, areas and payees
    c['years'] = list(Budget.objects.get_years(main_entity))
    c['first_year'] = c['years'][0]
    c['last_year'] = c['years'][len(c['years'])-1]

    c['payees'] = json.dumps(list(Payment.objects.get_payees(main_entity)))

    c['areas'] = json.dumps(list(Payment.objects.get_areas(main_entity)))

    # Get basic stats for the overall dataset
    c['payments_count'] = Payment.objects.get_count(main_entity)
    c['total_amount'] = Payment.objects.get_total_amount(main_entity)

    # Payments breakdown
    # breakdown_by_payee_criteria = ['payee', 'area', 'description']
    # if hasattr(settings, 'PAYMENTS_BREAKDOWN_BY_PAYEE'):
    #     breakdown_by_payee_criteria = settings.PAYMENTS_BREAKDOWN_BY_PAYEE
    # c['payee_breakdown'] = BudgetBreakdown(breakdown_by_payee_criteria)

    # breakdown_by_area_criteria = ['area', 'payee', 'description']
    # if hasattr(settings, 'PAYMENTS_BREAKDOWN_BY_AREA'):
    #     breakdown_by_area_criteria = settings.PAYMENTS_BREAKDOWN_BY_AREA
    # c['area_breakdown'] = BudgetBreakdown(breakdown_by_area_criteria)

    # for item in Payment.objects.each_denormalized("b.entity_id = %s", [main_entity.id]):
    #     # We add the date to the description, if it exists:
    #     # TODO: I wanted the date to be in a separate column, but it's complicated right
    #     # now the way BudgetBreakdown works. Need to think about it
    #     if item.date:
    #         item.description = item.description + ' (' + str(item.date) + ')'

    #     c['payee_breakdown'].add_item(item.year, item)
    #     c['area_breakdown'].add_item(item.year, item)

    # # Additional data needed by the view
    # populate_stats(c)
    # populate_years(c, 'area_breakdown')

    return render_to_response('payments/index.html', {'entity': main_entity}, c)
