from django.db.models import Sum

import pytest

from budget_app.models import Budget, BudgetItem

pytestmark = pytest.mark.django_db


def total(year, expense, actual):
    # Each year is loaded once per language, as a separate budget, so we add up only one of them
    budget = Budget.objects.filter(year=year).order_by('id').first()
    items = BudgetItem.objects.filter(budget=budget, expense=expense, actual=actual)
    return items.aggregate(total=Sum('amount'))['total']


def test_loads_each_year_once_per_language():
    assert sorted(Budget.objects.values_list('year', flat=True)) == [2024, 2024, 2025, 2025]


def test_known_totals():
    # El Prat's 2025, a closed year, in cents
    assert total(2025, expense=True, actual=False) == 13996716794
    assert total(2025, expense=True, actual=True) == 12936768788
    assert total(2025, expense=False, actual=False) == 13996716794
    assert total(2025, expense=False, actual=True) == 14260037105


def test_both_languages_have_the_same_figures():
    budgets = Budget.objects.filter(year=2025).order_by('id')
    totals = [BudgetItem.objects.filter(budget=b).aggregate(total=Sum('amount'))['total'] for b in budgets]
    assert totals[0] == totals[1]
