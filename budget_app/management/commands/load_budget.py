# -*- coding: UTF-8 -*-
from django.core.management.base import BaseCommand
from django.conf import settings
from budget_app.models import Entity
from optparse import make_option
import os.path


class Command(BaseCommand):
    option_list = BaseCommand.option_list + (
        make_option(
            '--language',
            action='store',
            dest='language',
            help='Set data language'
        ),
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

    def handle(self, *args, **options):
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
                if language:
                    path = os.path.join(
                        settings.ROOT_PATH,
                        settings.THEME,
                        'data',
                        language,
                        level,
                        year
                    )
                else:
                    path = os.path.join(settings.ROOT_PATH, settings.THEME, 'data', level, year)

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
                    [settings.BUDGET_LOADER]
                )
                loader = module.__dict__[settings.BUDGET_LOADER]()
                loader.load(entity, year, path, status)

    def _get_entity(self, level, name, language=None):
        entity = Entity.objects.filter(level=level, name=name, language=language)
        if not entity:
            raise Exception("Entity (%s/%s) not found" % (level, name))
        return entity[0]
