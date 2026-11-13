import pytest

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize('language', ['es', 'ca'])
@pytest.mark.parametrize('path', [
    '',
    'resumen',
    'politicas',
    'politicas/13/seguridad',
    'programas/1320/seguridad',
    'articulos/g/12/retribuciones',
    'articulos/i/11/impuestos',
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


@pytest.mark.parametrize('path', ['pagos', 'inversiones', 'inversiones-principales', 'objetivos', 'municipios',
                                  'entidades/1/pagos', 'entidades/1/pagos/search'])
def test_features_the_theme_does_not_turn_on_are_not_found(client, path):
    # See civio/presupuesto-management#1408
    assert client.get('/es/' + path).status_code == 404


@pytest.mark.parametrize('path, tab', [
    ('resumen', 'page-budgets'),
    ('politicas/13/seguridad', 'page-policies'),
    ('programas/1320/seguridad', 'page-policies'),
    ('articulos/g/12/retribuciones', 'page-policies'),
    ('articulos/i/11/impuestos', 'page-policies'),
    ('recibo', 'page-tax-receipt'),
    ('glosario', 'page-glossary'),
])
def test_menu_highlights_the_current_section(client, path, tab):
    assert '%s active' % tab in client.get('/es/' + path).content.decode()


@pytest.mark.parametrize('path', [
    'politicas/99/nada',
    'programas/9999/nada',
    'subprogramas/99999/nada',
    'articulos/g/99/nada',
    'articulos/i/99/nada',
    'politicas/99_economic.csv',
])
def test_unknown_codes_are_not_found(client, path):
    assert client.get('/es/' + path).status_code == 404


@pytest.mark.parametrize('path', [
    'programas/XXXX/ingresos',
    'programas/XXXX_economic.csv',
    'subprogramas/XXXX/ingresos',
    'subprogramas/XXXX_economic.csv',
])
def test_the_fake_income_programme_is_not_found(client, path):
    # Income hangs from a fake functional category, whose pages used to fail with a 500.
    # (El Prat doesn't use subprogrammes either, so those pages aren't found anyway.)
    assert client.get('/es/' + path).status_code == 404


def test_not_found_page_uses_the_site_template(client, settings):
    # See civio/presupuesto-management#263
    settings.DEBUG = False
    response = client.get('/es/no-existe')
    assert response.status_code == 404
    page = response.content.decode()
    assert 'No encontramos esta página' in page and '<header' in page


def test_server_error_page_renders_without_context(rf):
    # Django renders it with no context, so it can't depend on the request or the context processors
    from django.views.defaults import server_error
    response = server_error(rf.get('/'))
    assert response.status_code == 500
    assert 'Algo ha fallado' in response.content.decode()
