# -*- coding: UTF-8 -*-

import os.path
import logging

from django.core.management.base import BaseCommand
from django.conf import settings
from budget_app.loaders import StatLoader

class Command(BaseCommand):
    logging.disable(logging.ERROR)   # Avoid SQL logging on console

    help = u"Carga las estadísticas oficiales desde fichero, _reemplazando las actuales_"

    def handle(self, *args, **options):
        path = os.path.join(settings.ROOT_PATH, settings.THEME, 'data')
        StatLoader().load(path)
