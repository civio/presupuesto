import pytest

pytestmark = pytest.mark.django_db


def test_ignores_accents(client):
    # The unaccent_spa search configuration matches 'TRACCIÓ' when searching 'traccio'
    response = client.get('/ca/busqueda', {'q': 'traccio', 'year': '2025'})
    assert response.status_code == 200
    assert 'TRACCIÓ' in response.content.decode()


def test_finds_glossary_terms(client):
    response = client.get('/es/busqueda', {'q': 'clasificacion'})
    assert 'Clasificación orgánica del presupuesto de gasto' in response.content.decode()


@pytest.mark.parametrize('year', ['all', '2024', 'nonsense', "2025'; --"])
def test_any_year_parameter_works(client, year):
    # Invalid years fall back to the latest one instead of failing. See civio/presupuesto-management#1404
    assert client.get('/es/busqueda', {'q': 'impuesto', 'year': year}).status_code == 200
