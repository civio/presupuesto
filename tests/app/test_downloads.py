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


def test_programme_download_lists_concepts_and_item_codes(client):
    # The last level used to show the internal id (000/2025/120/04). See civio/presupuesto-management#1422
    response = client.get('/es/programas/1532_economic.csv')
    rows = list(csv.reader(io.StringIO(response.content.decode())))
    assert rows[0][5:9] == ['Id Concepto', 'Nombre Concepto', 'Id Partida', 'Nombre Partida']
    items = [row for row in rows[1:] if row[7]]
    assert items and all('/' not in row[7] and row[7].startswith(row[5]) for row in items)
    concepts = {row[5] for row in rows[1:] if row[5] and not row[7]}
    assert {row[5] for row in items} <= concepts


def test_downloads_for_missing_programmes_are_not_found(client):
    assert client.get('/es/programas/9999_economic.csv').status_code == 404


def test_item_code():
    from budget_app.views.csv_xls import _item_code
    assert _item_code('000/2025/120/04') == '12004'
    assert _item_code('2025/2269/17') == '226917'
    # PGE headings carry the managing centre
    assert _item_code('19101/2023/420/07001/3') == '420/070013'
