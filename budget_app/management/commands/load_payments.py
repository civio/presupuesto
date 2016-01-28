# -*- coding: UTF-8 -*-
from django.core.management.base import BaseCommand
from django.conf import settings
from budget_app.loaders import *
from budget_app.models import Entity
from optparse import make_option
import os.path
import sys


class Command(BaseCommand):
    option_list = BaseCommand.option_list + (
      make_option('--language',
        action='store',
        dest='language',
        help='Set data language'),
    )

    help = u"Carga los pagos correspondientes al presupuesto del año"

    def handle(self, *args, **options):
        if len(args) < 1:
            print "Por favor indique el año del presupuesto a cargar."
            return

        year = args[0]

        level = settings.MAIN_ENTITY_LEVEL if len(args)<2 else args[1]
        name = settings.MAIN_ENTITY_NAME if len(args)<3 else args[2]
        entity = self._get_entity(level, name, options['language'])

        if options['language']:
            path = os.path.join(settings.ROOT_PATH, settings.THEME, 'data', options['language'], level, year)
        else:
            path = os.path.join(settings.ROOT_PATH, settings.THEME, 'data', level, year)

        # Import the loader dynamically. See http://stackoverflow.com/questions/301134/dynamic-module-import-in-python
        module = __import__(settings.THEME+'.loaders', globals(), locals(), [settings.PAYMENTS_LOADER])
        loader = module.__dict__[settings.PAYMENTS_LOADER]()
        loader.load(entity, year, path)

    def _get_entity(self, level, name, language=None):
        entity = Entity.objects.filter(level=level, name=name, language=language)
        if not entity:
            raise Exception("Entity (%s/%s) not found" % (level, name))
        return entity[0]
