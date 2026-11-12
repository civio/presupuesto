import os

import pytest
from django.core.management import call_command
from django.db import connection

# A closed year with execution, and the one before, so pages can compare years
YEARS = '2024-2025'


@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
    # Load El Prat's data once into the test database, as we would for a new site.
    with django_db_blocker.unblock():
        with open(os.path.join(os.path.dirname(__file__), '..', 'search_config.sql')) as f:
            with connection.cursor() as cursor:
                cursor.execute(f.read())
        call_command('load_entities')
        call_command('load_stats')
        call_command('load_glossary', language='es,ca')
        call_command('load_budget', YEARS, language='es,ca')
