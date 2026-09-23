"""
Browser tests that run against a live site, local or deployed:

    pytest tests/e2e --base-url http://localhost:8000
    pytest tests/e2e --base-url https://presupuesto.navarra.es

The pages to visit come from the site's sitemap, one of each kind per language.
"""

import re

from playwright.sync_api import expect

from site_helpers import page_type, sample_paths

# Pages with a treemap and a table breaking down the budget
BREAKDOWN_PAGES = {'politicas', 'politicas/*', 'programas/*', 'subprogramas/*', 'articulos/g/*', 'articulos/i/*'}


def test_page(page, errors, sample_path):
    response = page.goto(sample_path, wait_until='networkidle')
    assert response.ok, 'HTTP %s' % response.status

    if page_type(sample_path)[1] in BREAKDOWN_PAGES:
        expect(page.locator('#myGrid tbody tr').first).to_be_visible()
    if page_type(sample_path)[1] == 'politicas':
        expect(page.locator('#budget-treemap .node').first).to_be_visible()

    assert errors == []


def test_policies_tabs(page, errors, site_paths):
    policies = [path for path in site_paths if page_type(path)[1] == 'politicas']
    page.goto(policies[0], wait_until='networkidle')

    for tab in page.locator('#tabs a').all():
        view = tab.get_attribute('href').lstrip('#')
        tab.click()
        expect(page).to_have_url(re.compile('view=%s' % view))
        expect(page.locator('#budget-treemap .node').first).to_be_visible()
        expect(page.locator('#myGrid tbody tr').first).to_be_visible()
        expect(page.locator('.panel-downloads p:visible a').first).to_be_visible()

    assert errors == []


def test_downloads(page, sample_path):
    page.goto(sample_path)
    links = page.locator('.panel-downloads a[href]').evaluate_all('links => links.map(link => link.href)')

    for link in links:
        response = page.request.get(link)
        assert response.ok, 'HTTP %s: %s' % (response.status, link)
        if link.endswith('.csv'):
            assert response.headers['content-type'].startswith('text/csv'), 'Not a CSV file: %s' % link
        elif link.endswith('.xlsx'):
            assert response.body().startswith(b'PK'), 'Not an Excel file: %s' % link


def test_search(page, errors, site_paths):
    # Search, in each language, for the name of the first policy, which is sure to be found
    for (language, kind), paths in sample_paths(site_paths).items():
        if kind != 'politicas/*':
            continue
        term = paths[0].rstrip('/').split('/')[-1].split('-')[0]
        page.goto('/%s/' % language if language else '/')
        page.locator('form[action$="/busqueda"] input[name=q]').fill(term)
        page.locator('form[action$="/busqueda"] [type=submit]').click()
        expect(page.locator('.search-content .panel').first).to_be_visible()

    assert errors == []


def test_text_files(page):
    for path in ['/robots.txt', '/version.json']:
        response = page.request.get(path)
        assert response.ok, 'HTTP %s: %s' % (response.status, path)
