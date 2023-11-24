# -*- coding: UTF-8 -*-

import json
import subprocess
import sys

import django
from django.http import JsonResponse

from local_settings import ENV
from project.settings import LANGUAGES
from budget_app.models import InflationStat, PopulationStat, Budget, Payment
from helpers import *


@contextmanager
def fix_cwd():
    old_dir = os.getcwd()
    os.chdir(ROOT_PATH)
    yield
    os.chdir(old_dir)


def fix_version(version):
    return '.'.join(
        map(
            lambda x: str(x),
            version[:3]
        )
    )


def version_api(request):
    c = get_context(request)

    with fix_cwd():
        git_commit = subprocess.check_output(['git', 'rev-parse', 'HEAD']).strip()
        git_tag = subprocess.check_output(['git', 'describe', '--tags']).strip()

    python_version = fix_version(sys.version_info)
    django_version = fix_version(django.VERSION)
    last_inflation = InflationStat.objects.get_last_year()
    last_population = PopulationStat.objects.get_last_year()
    budget_years = list(Budget.objects.get_years(get_main_entity(c)))
    payments_years = list(Payment.objects.get_years(get_main_entity(c)))
    languages = [key for key, value in LANGUAGES]

    return JsonResponse({
        'python_version': python_version,
        'django_version': django_version,
        'tag': git_tag,
        'commit': git_commit,
        'debug': ENV.get('DEBUG', False),
        'budget_years': budget_years,
        'payments_years': payments_years,
        'last_inflation': last_inflation,
        'last_population': last_population,
        'languages': languages,
    })
