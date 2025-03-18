# -*- coding: UTF-8 -*-

from django.utils.translation import ugettext as _
from budget_app.models import Budget, BudgetBreakdown, BudgetItem, Entity
from .helpers import *


def tax_receipt(request):
    c = get_context(request, css_class='body-tax-receipt', title=_(u'Lo que tú aportas'))

    # Get latest budget data
    populate_latest_budget(c)
    populate_stats(c)
    populate_descriptions(c)
    c['default_income'] = 30000

    # Get the budget breakdown
    c['breakdown'] = BudgetBreakdown(['policy', 'programme'])
    for item in BudgetItem.objects.each_denormalized("b.id = %s", [c['latest_budget'].id]):
        if c['include_financial_chapters'] or not item.is_financial():
            c['breakdown'].add_item(c['latest_budget'].name(), item)

    return render_response('tax_receipt/index.html', c)
