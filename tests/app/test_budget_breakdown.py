import json
from types import SimpleNamespace

from budget_app.models import BudgetBreakdown


def test_an_empty_value_is_a_child_like_any_other():
    # A payment with an empty description used to be serialized as a JSON string
    # inside the JSON, because its uid ('') was taken for the root's
    breakdown = BudgetBreakdown(['description'])
    for description in ['Vigilancia', '']:
        breakdown.add_item('2022', SimpleNamespace(year=2022, expense=True, amount=100, description=description))

    data = json.loads(breakdown.to_json())
    assert data['sub'][''] == {'expense': {'2022': 100}, 'income': {}}
