from coffin.shortcuts import render_to_response
from django.conf import settings
from django.utils.translation import ugettext as _
from budget_app.models import Budget, Entity, FunctionalCategory, BudgetBreakdown, BudgetItem
from helpers import *
from random import sample


def welcome(request):
    c = get_context(request, css_class='body-welcome', title=_('Inicio'))
    c['formatter'] = add_thousands_separator

    # Retrieve setting for number of examples to display in homepage
    c['number_of_featured_programmes'] = 3
    if hasattr(settings, 'NUMBER_OF_FEATURED_PROGRAMMES'):
        c['number_of_featured_programmes'] = settings.NUMBER_OF_FEATURED_PROGRAMMES

    # Retrieve front page examples
    populate_latest_budget(c)
    # TODO: Can we get rid of this?
    c['featured_programmes'] = list(FunctionalCategory.objects
                                .filter(budget=c['latest_budget'])
                                .filter(programme__in=settings.FEATURED_PROGRAMMES)
                                .filter(subprogramme=None))

    # Decide whether we're going to show budget or execution figures
    use_actual = (BudgetItem.objects
                    .filter(budget=c['latest_budget'])
                    .filter(budget__status='')  # Don't use partially executed budgets
                    .filter(actual=True).count() > 0)

    # Calculate subtotals for the selected programmes
    c['breakdown'] = BudgetBreakdown(['programme'])
    items = BudgetItem.objects \
                        .filter(budget=c['latest_budget']) \
                        .filter(functional_category__programme__in=settings.FEATURED_PROGRAMMES) \
                        .filter(actual=use_actual)
    for item in items:
        c['breakdown'].add_item(c['latest_budget'].year, item)

    return render_to_response('welcome/index.html', c)
