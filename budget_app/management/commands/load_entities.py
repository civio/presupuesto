# -*- coding: UTF-8 -*-

import os.path
import logging

from django.core.management.base import BaseCommand
from django.conf import settings
from budget_app.loaders import EntityLoader

class Command(BaseCommand):
    logging.disable(logging.ERROR)   # Avoid SQL logging on console

    help = u"Carga la lista de entidades públicas, _reemplazando el actual_"

    def handle(self, *args, **options):
        path = os.path.join(settings.ROOT_PATH, settings.THEME, 'data')
        EntityLoader().load(os.path.join(path, 'entidades.csv'))
