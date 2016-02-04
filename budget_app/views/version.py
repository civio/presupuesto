# -*- coding: latin-1 -*-

import json
import subprocess
import sys
import os

import django
from django.http import HttpResponse

from project.settings import ROOT_PATH
from local_settings import ENV
from budget_app.models import InflationStat, Budget

def fix_version(version):
    return '.'.join(
        map(
            lambda x: str(x),
            version[:3]
        )
    )

def version_api(request):
    old_path = os.getcwd()
    os.chdir(ROOT_PATH)
    git_commit = subprocess.check_output(['git', 'rev-parse','HEAD']).strip()
    git_tag = subprocess.check_output(['git', 'describe', '--tags']).strip()
    os.chdir(old_path)
    python_version = fix_version(sys.version_info)
    django_version = fix_version(django.VERSION)
    last_inflation = InflationStat.objects.get_last_year()
    years = list(Budget.objects.get_years())

    response = json.dumps(
        {
            'python_version': python_version,
            'django_version': django_version,
            'commit': git_commit,
            'tag': git_tag,
            'debug': ENV.get('DEBUG',False),
            'years': years,
            'last_inflation': last_inflation
        }
    )
    return HttpResponse(response, content_type="text/json")
