# -*- coding: UTF-8 -*-
import os.path
import logging

from django.core.management.base import BaseCommand
from django.conf import settings
from budget_app.loaders import GlossaryLoader
from optparse import make_option
import project.settings

PATH_TO_DEFAULT = os.path.join(settings.ROOT_PATH, 'budget_app', 'static')

class Command(BaseCommand):
    logging.disable(logging.ERROR)   # Avoid SQL logging on console

    option_list = BaseCommand.option_list + (
        make_option(
            '--language',
            action='store',
            dest='language',
            default=settings.LANGUAGE_CODE,
            help='Set data language'),
        make_option(
            '--extend',
            action='store_true',
            dest='extend',
            help='Extend default glossary with theme one'),
    )

    help = u"Carga los términos del glosario desde un fichero, _reemplazando el actual_"

    @staticmethod
    def _parse_languages(languages):
        try:
            result = languages.split(',')
        except:
            result = [None]
        return result

    def handle(self, *args, **options):
        # Allow overriding the data path from command line
        glossary_loader = GlossaryLoader()

        if len(args) < 1:
            # Default: theme data folder
            path = os.path.join(settings.ROOT_PATH, settings.THEME, 'data')
        else:
            path = args[0]

        languages = self._parse_languages(options['language'])

        for language in languages:
            filename = "glosario_%s.csv" % (language, )
            default_filename = "glosario_default_%s.csv" % (language)
            glossary_loader.delete_all(language)
            if options.get('extend', False):
                glossary_loader.load(
                    os.path.join(PATH_TO_DEFAULT, default_filename),
                    options['language']
                )
                glossary_loader.load(os.path.join(path, filename), language)
            else:
                try:
                    glossary_loader.load(os.path.join(path, filename), language)
                except IOError:
                    print('Fichero no encontrado. Se va a cargar el glosario por defecto.')
                    glossary_loader.load(
                        os.path.join(PATH_TO_DEFAULT, default_filename),
                        language
                    )

