from django.db import connection
from django.db.models import Count, Sum

import pytest

from budget_app.models import Budget, BudgetItem

pytestmark = pytest.mark.django_db


def items(language, expense, actual):
    return BudgetItem.objects.filter(budget__entity__language=language, expense=expense, actual=actual)


def test_loads_the_year_once_per_language():
    assert sorted(Budget.objects.values_list('entity__language', flat=True)) == ['es', 'eu']


def test_known_totals():
    # Navarra's 2025, a closed year, in cents
    assert items('es', expense=True, actual=False).aggregate(total=Sum('amount'))['total'] == 643126494700
    assert items('es', expense=True, actual=True).aggregate(total=Sum('amount'))['total'] == 621389503100
    assert items('es', expense=False, actual=False).aggregate(total=Sum('amount'))['total'] == 643126494700
    assert items('es', expense=False, actual=True).aggregate(total=Sum('amount'))['total'] == 654501192938


def test_known_number_of_lines():
    # Lines get skipped, with an ALERTA, when their categories aren't found
    assert items('es', expense=True, actual=False).count() == 5624
    assert items('es', expense=True, actual=True).count() == 4926
    assert items('es', expense=False, actual=False).count() == 585
    assert items('es', expense=False, actual=True).count() == 501


def test_both_languages_have_the_same_figures():
    def figures(language):
        return list(BudgetItem.objects.filter(budget__entity__language=language)
                    .values('expense', 'actual').annotate(total=Sum('amount'), lines=Count('id'))
                    .order_by('expense', 'actual'))
    assert figures('es') == figures('eu')


def test_every_line_hangs_from_a_subheading():
    # Navarra is the only site that loads economic subheadings
    assert not BudgetItem.objects.filter(economic_category__subheading__isnull=True).exists()


def test_one_description_per_item_number():
    # The web groups lines by economic code and item_number and shows one description for them,
    # so the loader gives each different description its own item_number
    assert not BudgetItem.objects.filter(item_number='').exists()
    with connection.cursor() as cursor:
        cursor.execute(
            "select count(*) from ("
            "  select budget_id, economic_category_id, item_number from budget_items"
            "  group by 1, 2, 3 having count(distinct description) > 1"
            ") clashes")
        assert cursor.fetchone()[0] == 0
