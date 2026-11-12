import pytest
from django.core.management import call_command

# A closed year, with execution, in both of Navarra's languages
YEAR = '2025'


@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
    # Load Navarra's budget once into the test database. It's the only site with economic
    # subheadings, and the one with the most particular loader, so these tests guard it
    # while we move it to SimpleBudgetLoader (civio/presupuesto-management#1423).
    with django_db_blocker.unblock():
        call_command('load_entities')
        call_command('load_budget', YEAR, language='es,eu')
