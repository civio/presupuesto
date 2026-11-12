import pytest
from django.core.management import call_command
from django.db import connection

# A closed year with execution, and the one before, so pages can compare years
YEARS = '2024-2025'


@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
    # Load El Prat's data once into the test database, as we would for a new site.
    with django_db_blocker.unblock():
        with connection.cursor() as cursor:
            cursor.execute("""
                CREATE EXTENSION IF NOT EXISTS unaccent;
                DROP TEXT SEARCH CONFIGURATION IF EXISTS unaccent_spa;
                CREATE TEXT SEARCH CONFIGURATION unaccent_spa ( COPY = pg_catalog.spanish );
                ALTER TEXT SEARCH CONFIGURATION unaccent_spa
                    ALTER MAPPING FOR hword, hword_part, word WITH unaccent, spanish_stem;
            """)
        call_command('load_entities')
        call_command('load_stats')
        call_command('load_glossary', language='es,ca')
        call_command('load_budget', YEARS, language='es,ca')
