from urllib.parse import urlparse

import pytest

from site_helpers import http_credentials, sample_paths, sitemap_paths


def pytest_addoption(parser):
    parser.addoption('--origin-url', help='where to read sitemap.xml, robots.txt and version.json from, '
                     'if not from --base-url (e.g. for a site behind a partner\'s proxy)')
    parser.addoption('--user-agent', help='browser user agent, for proxies that block headless browsers')


def origin_url(config):
    return config.getoption('origin_url') or config.getoption('base_url')


def pytest_configure(config):
    if not config.getoption('base_url'):
        raise pytest.UsageError('Pass the site to test with --base-url, e.g. --base-url http://localhost:8000')


def pytest_generate_tests(metafunc):
    # One test per language and kind of page listed in the sitemap, so the same tests
    # work for any theme without having to know its policy or programme codes.
    if 'sample_path' in metafunc.fixturenames:
        samples = sample_paths(sitemap_paths(origin_url(metafunc.config)))
        metafunc.parametrize(
            'sample_path',
            [paths[0] for paths in samples.values()],
            ids=['%s:%s' % key if key[0] else key[1] for key in samples],
        )


@pytest.fixture
def browser_context_args(browser_context_args, pytestconfig):
    args = {**browser_context_args, 'http_credentials': http_credentials()}
    if pytestconfig.getoption('user_agent'):
        args['user_agent'] = pytestconfig.getoption('user_agent')
    return args


@pytest.fixture
def origin(pytestconfig):
    return origin_url(pytestconfig).rstrip('/')


@pytest.fixture
def site_paths(origin):
    return sitemap_paths(origin)


@pytest.fixture
def errors(page, base_url):
    """
    Uncaught JavaScript exceptions and failed requests to the site itself. Third-party
    resources (analytics, fonts...) are left out, since we can't do anything about them.
    """
    host = urlparse(base_url).netloc

    def ours(url):
        # Cloudflare's bot detection script is injected into the HTML, and fails when the site
        # is seen through a partner's proxy, but visitors don't notice. We do check the rest of
        # /cdn-cgi/, since email obfuscation there broke links on the page.
        url = urlparse(url)
        return url.netloc == host and not url.path.startswith('/cdn-cgi/challenge-platform/')

    found = []
    page.on('pageerror', lambda error: found.append('JavaScript error: %s' % error))
    page.on('requestfailed', lambda request:
            ours(request.url) and found.append('Failed request: %s' % request.url))
    page.on('response', lambda response:
            ours(response.url) and response.status >= 400
            and found.append('HTTP %s: %s' % (response.status, response.url)))
    return found
