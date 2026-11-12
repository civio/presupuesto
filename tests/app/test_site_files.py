import json
import xml.etree.ElementTree as ElementTree

import pytest

pytestmark = pytest.mark.django_db


def test_robots_keeps_crawlers_away_from_downloads(client):
    # See civio/presupuesto-management#1328 and #1412
    robots = client.get('/robots.txt').content.decode()
    assert 'Disallow: /*.csv' in robots
    assert 'Disallow: /*.xlsx' in robots
    assert 'Sitemap: http://testserver/sitemap.xml' in robots


def test_sitemap(client):
    # Uses the standard http:// namespace. See civio/presupuesto-management#1407
    root = ElementTree.fromstring(client.get('/sitemap.xml').content)
    namespace = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
    assert root.tag == namespace + 'urlset'
    urls = [loc.text for loc in root.iter(namespace + 'loc')]
    assert any('/es/politicas/13/' in url for url in urls)
    assert not any(url.endswith(('.csv', '.xlsx')) for url in urls)


def test_version(client):
    version = json.loads(client.get('/version.json').content)
    assert version['budget_years'] == [2024, 2025]
    assert version['execution_years'] == [2024, 2025]
    assert version['languages'] == ['ca', 'es']
    assert version['debug'] is False


def test_version_without_git(client, monkeypatch):
    # A copy of the code without its repository still answers, with no git details
    import budget_app.views.version as version_view
    monkeypatch.setattr(version_view, 'ROOT_PATH', '/')
    version = json.loads(client.get('/version.json').content)
    assert version['commit'] is None
    assert version['tag'] is None
    assert version['budget_years'] == [2024, 2025]
