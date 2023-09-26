# -*- coding: UTF-8 -*-

import os.path
import logging

from django.core.management.base import BaseCommand
from django.conf import settings
from budget_app.models import Entity, Budget

class Command(BaseCommand):
    logging.disable(logging.ERROR)   # Avoid SQL logging on console

    def add_arguments(self, parser):
        parser.add_argument('years')

        parser.add_argument('--language',
            action='store',
            dest='language',
            default=settings.LANGUAGE_CODE,
            help='Set data language'),

        parser.add_argument('--level',
            action='store',
            dest='level',
            default=settings.MAIN_ENTITY_LEVEL,
            help='Set entity level'),

        parser.add_argument('--name',
            action='store',
            dest='name',
            default=settings.MAIN_ENTITY_NAME,
            help='Set entiy name'),

    help = u"Elimina el presupuesto del año"

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
        years = self._parse_number_range(options['years'])
        languages = self._parse_languages(options['language'])
        level = options['level']
        name = options['name']

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

                # Delete previous budget for the given entity/year if it exists
                print u"Eliminando presupuesto para entidad '%s' año %s..." % (entity.name, year)
                Budget.objects.filter(entity=entity, year=year).delete()

    def _get_entity(self, level, name, language=None):
        entity = Entity.objects.filter(level=level, name=name, language=language)
        if not entity:
            raise Exception("Entity (%s/%s) not found" % (level, name))
        return entity.first()
