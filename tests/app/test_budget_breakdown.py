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


def test_latest_complete_columns():
    # The treemap, the stacked chart and the summary bar pick each year's column with
    # BreakdownHelpers.latestCompleteColumns, in JavaScript. See civio/presupuesto-management#244
    import subprocess
    from pathlib import Path

    breakdown = BudgetBreakdown(['description'])
    for column in ['2014', 'actual_2014', '2015', 'actual_2015', '2016', 'actual_2017']:
        year = int(column[-4:])
        breakdown.add_item(column, SimpleNamespace(year=year, expense=True, amount=100, description='Vigilancia'))
    statuses = {'2014': '', '2015': '3T', '2016': 'PR', '2017': ''}

    helpers = Path(__file__).resolve().parents[2] / 'budget_app/static/javascripts/breakdown_helpers.js'
    script = helpers.read_text() + \
        'console.log(JSON.stringify(BreakdownHelpers.latestCompleteColumns(%s, %s)));' % (breakdown.to_json(), json.dumps(statuses))
    output = subprocess.run(['node', '-e', script], capture_output=True, text=True, check=True).stdout

    assert json.loads(output) == {
        '2014': 'actual_2014',  # The year is over: execution
        '2015': '2015',         # Execution until the third quarter only: budget
        '2016': '2016',         # No execution yet
        '2017': 'actual_2017',  # Execution without a budget
    }
