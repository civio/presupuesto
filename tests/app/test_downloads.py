import csv
import io

import pytest
from openpyxl import load_workbook

from budget_app.views.csv_xls import worksheetWrapper

pytestmark = pytest.mark.django_db


def test_csv(client):
    response = client.get('/es/politicas/13_economic.csv')
    assert response.status_code == 200
    rows = list(csv.reader(io.StringIO(response.content.decode())))
    assert len(rows) > 1


def test_xlsx(client):
    response = client.get('/es/politicas/13_economic.xlsx')
    assert response.status_code == 200
    workbook = load_workbook(io.BytesIO(response.content))
    assert workbook.active.max_row > 1


def test_head_requests_are_refused(client):
    # See civio/presupuesto-management#1328
    assert client.head('/es/politicas/13_economic.csv').status_code == 405


def test_institutional_download_is_not_found_without_institutional_breakdown(client):
    # El Prat turns off the institutional tab. See civio/presupuesto-management#1406
    assert client.get('/es/politicas/13_institutional.csv').status_code == 404


def test_excel_drops_control_characters():
    # Vitoria-Gasteiz has payments with a \x1a in their description, which openpyxl refuses
    from openpyxl import Workbook
    workbook = Workbook()
    worksheetWrapper(workbook.active).writerow(['Pago\x1a a proveedor', 12])
    assert workbook.active['A1'].value == 'Pago a proveedor'
