# Environment for the tests in tests/subheadings, read instead of local_settings.py (see tests/settings_subheadings.py).
# They run against Navarra's theme, which must be cloned as presupuesto_navarra.
# The database credentials come from the usual libpq variables, so CI can pass its own.
import os

ENV = {
  'THEME': 'presupuesto_navarra',

  # Pytest-django creates and destroys test_dvmi_subheadings_tests
  'DATABASE_NAME': 'dvmi_subheadings_tests',
  'DATABASE_USER': os.environ.get('PGUSER', ''),
  'DATABASE_PASSWORD': os.environ.get('PGPASSWORD', ''),
  'DATABASE_HOST': os.environ.get('PGHOST', 'localhost'),
  'DATABASE_PORT': os.environ.get('PGPORT', ''),
  'SEARCH_CONFIG': 'unaccent_spa',

  # No page cache
  'CACHES': {
    'default': {
      'BACKEND': 'django.core.cache.backends.dummy.DummyCache'
    }
  },
}
