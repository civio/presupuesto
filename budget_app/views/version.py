# -*- coding: UTF-8 -*-

import json
import subprocess
import sys

import django
from django.conf import settings
from django.http import JsonResponse

from project.settings import LANGUAGES, ROOT_PATH
from budget_app.models import InflationStat, PopulationStat, Budget, BudgetItem, Payment
from .helpers import *


# Git details of the deployed code, or None where git can't tell (e.g. no repository)
def git(*args):
    try:
        return subprocess.check_output(['git', *args], cwd=ROOT_PATH, stderr=subprocess.DEVNULL).strip().decode()
    except (OSError, subprocess.CalledProcessError):
        return None


def fix_version(version):
    return '.'.join(
        map(
            lambda x: str(x),
            version[:3]
        )
    )


def version_api(request):
    c = get_context(request)

    git_commit = git('rev-parse', 'HEAD')
    # Falls back to the abbreviated commit if no tag is reachable, as in a shallow clone
    git_tag = git('describe', '--tags', '--always')

    python_version = fix_version(sys.version_info)
    django_version = fix_version(django.VERSION)
    last_inflation = InflationStat.objects.get_last_year()
    last_population = PopulationStat.objects.get_last_year()
    main_entity = get_main_entity(c)
    budget_years = list(Budget.objects.get_years(main_entity))
    budget_statuses = Budget.objects.get_statuses(main_entity)
    execution_years = list(BudgetItem.objects.filter(budget__entity=main_entity, actual=True)
                                             .values_list('budget__year', flat=True)
                                             .distinct()
                                             .order_by('budget__year'))
    payments_years = list(Payment.objects.get_years(main_entity))
    languages = [key for key, value in LANGUAGES]

    return JsonResponse({
        'python_version': python_version,
        'django_version': django_version,
        'tag': git_tag,
        'commit': git_commit,
        'debug': settings.DEBUG,
        'budget_years': budget_years,
        'budget_statuses': budget_statuses,
        'execution_years': execution_years,
        'payments_years': payments_years,
        'last_inflation': last_inflation,
        'last_population': last_population,
        'languages': languages,
    })
