import pytest

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize('language', ['es', 'ca'])
@pytest.mark.parametrize('path', [
    '',
    'resumen',
    'politicas',
    'politicas/13/seguridad',
    'programas/1320/seguridad',
    'glosario',
    'busqueda?q=impuesto',
    'recibo',
])
def test_page(client, language, path):
    assert client.get('/%s/%s' % (language, path)).status_code == 200


def test_root_redirects_to_a_language(client):
    response = client.get('/')
    assert response.status_code == 302
    assert response['Location'] in ('/es/', '/ca/')


def test_adds_the_slug_to_policy_urls(client):
    # See civio/presupuesto-management#1403
    response = client.get('/es/politicas/13')
    assert response.status_code == 301
    assert response['Location'].startswith('/es/politicas/13/')


def test_listing_without_a_code_redirects_to_policies(client):
    response = client.get('/es/programas')
    assert response.status_code == 301
    assert response['Location'] == '/es/politicas'


@pytest.mark.parametrize('path', ['pagos', 'inversiones', 'inversiones-principales', 'objetivos', 'municipios'])
def test_features_the_theme_does_not_turn_on_are_not_found(client, path):
    # See civio/presupuesto-management#1408
    assert client.get('/es/' + path).status_code == 404


@pytest.mark.parametrize('path, tab', [('resumen', 'page-budgets'), ('politicas/13/seguridad', 'page-policies')])
def test_menu_highlights_the_current_section(client, path, tab):
    assert '%s active' % tab in client.get('/es/' + path).content.decode()
