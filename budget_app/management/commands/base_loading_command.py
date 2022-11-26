# -*- coding: UTF-8 -*-

import os.path
import sys
import logging

from django.core.management.base import BaseCommand
from django.conf import settings
from budget_app.loaders import *
from budget_app.models import Entity
from optparse import make_option

class BaseLoadingCommand(BaseCommand):
    logging.disable(logging.ERROR)   # Avoid SQL logging on console

    option_list = BaseCommand.option_list + (
        make_option('--language',
            action='store',
            dest='language',
            default=settings.LANGUAGE_CODE,
            help='Set data language'),
    )

    help = u"Carga el presupuesto del año"

    @staticmethod
    def _parse_languages(languages):
        try:
            result = languages.split(',')
        except:
            result = [None]
        return result

    @staticmethod
    def _parse_number_range(years):
        result = []
        for part in years.split(','):
            if '-' in part:
                year_start, year_end = part.split('-')
                year_start, year_end = int(year_start), int(year_end)
                result.extend(range(year_start, year_end + 1))
            else:
                year = int(part)
                result.append(year)
        result = map(str, result)
        return result

    def handle(self, loader_name, args, options):
        if len(args) < 1:
            print("Por favor indique el año del presupuesto a cargar.")
            return

        years = self._parse_number_range(args[0])
        languages = self._parse_languages(options['language'])

        level = settings.MAIN_ENTITY_LEVEL if len(args) < 2 else args[1]
        name = settings.MAIN_ENTITY_NAME if len(args) < 3 else args[2]

        for language in languages:
            entity = self._get_entity(level, name, language)
            for year in years:
                path = os.path.join(
                    settings.ROOT_PATH,
                    settings.THEME,
                    'data',
                    language,
                    level,
                    # XXX: It would make sense to include always the entity name,
                    # but we weren't doing it in the past, so we'd need to change
                    # all the themes. So we'll live with this ugly patch:
                    # append the entity name only if given in the command line.
                    '' if len(args) < 3 else args[2],
                    year
                )

                # Read the budget status. It's only needed when we load a budget,
                # but it's more consistent to do it always anyway.
                try:
                    with open(os.path.join(path, '.budget_status'), 'r') as quarter:
                        status = quarter.readlines()[0].strip()
                except (IOError, IndexError):
                    status = ''

                # Import the loader dynamically.
                # See http://stackoverflow.com/questions/301134/dynamic-module-import-in-python
                module = __import__(
                    settings.THEME+'.loaders',
                    globals(),
                    locals(),
                    [loader_name]
                )
                loader = module.__dict__[loader_name]()
                loader.load(entity, year, path, status)

    def _get_entity(self, level, name, language=None):
        entity = Entity.objects.filter(level=level, name=name, language=language)
        if not entity:
            raise Exception("Entity (%s/%s) not found" % (level, name))
        return entity[0]
