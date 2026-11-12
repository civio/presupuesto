# Environment for the tests in tests/app, read instead of local_settings.py (see tests/settings.py).
# They run against El Prat's theme, which must be cloned as presupuesto_elprat.
# The database credentials come from the usual libpq variables, so CI can pass its own.
import os

ENV = {
  'THEME': 'presupuesto_elprat',

  # Pytest-django creates and destroys a database called test_dvmi_elprat_tests
  'DATABASE_NAME': 'dvmi_elprat_tests',
  'DATABASE_USER': os.environ.get('PGUSER', ''),
  'DATABASE_PASSWORD': os.environ.get('PGPASSWORD', ''),
  'DATABASE_HOST': os.environ.get('PGHOST', 'localhost'),
  'DATABASE_PORT': os.environ.get('PGPORT', ''),
  'SEARCH_CONFIG': 'unaccent_spa',

  # No page cache, so each test sees what the views return
  'CACHES': {
    'default': {
      'BACKEND': 'django.core.cache.backends.dummy.DummyCache'
    }
  },
}
