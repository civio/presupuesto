from urllib.parse import urlparse

import pytest

from site_helpers import http_credentials, sample_paths, sitemap_paths


def pytest_configure(config):
    if not config.getoption('base_url'):
        raise pytest.UsageError('Pass the site to test with --base-url, e.g. --base-url http://localhost:8000')


def pytest_generate_tests(metafunc):
    # One test per language and kind of page listed in the sitemap, so the same tests
    # work for any theme without having to know its policy or programme codes.
    if 'sample_path' in metafunc.fixturenames:
        samples = sample_paths(sitemap_paths(metafunc.config.getoption('base_url')))
        metafunc.parametrize(
            'sample_path',
            [paths[0] for paths in samples.values()],
            ids=['%s:%s' % key if key[0] else key[1] for key in samples],
        )


@pytest.fixture
def browser_context_args(browser_context_args):
    return {**browser_context_args, 'http_credentials': http_credentials()}


@pytest.fixture
def site_paths(base_url):
    return sitemap_paths(base_url)


@pytest.fixture
def errors(page, base_url):
    """
    Uncaught JavaScript exceptions and failed requests to the site itself. Third-party
    resources (analytics, fonts...) are left out, since we can't do anything about them.
    """
    host = urlparse(base_url).netloc
    found = []
    page.on('pageerror', lambda error: found.append('JavaScript error: %s' % error))
    page.on('requestfailed', lambda request:
            urlparse(request.url).netloc == host and found.append('Failed request: %s' % request.url))
    page.on('response', lambda response:
            urlparse(response.url).netloc == host and response.status >= 400
            and found.append('HTTP %s: %s' % (response.status, response.url)))
    return found
