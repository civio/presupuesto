# -*- coding: UTF-8 -*-
from django.core.management.base import BaseCommand
from django.conf import settings
from budget_app.loaders import GlossaryLoader
from optparse import make_option
import os.path
import project.settings

PATH_TO_DEFAULT = os.path.join(settings.ROOT_PATH, 'budget_app', 'static', 'glosario_default.csv')

class Command(BaseCommand):
    option_list = BaseCommand.option_list + (
      make_option('--language',
        action='store',
        dest='language',
        help='Set data language'),
      make_option('--extend',
        action='store_false',
        dest='extend',
        help='Extend default glossary with theme one'),
    )

    help = u"Carga los términos del glosario desde un fichero, _reemplazando el actual_"

    def handle(self, *args, **options):
        # Allow overriding the data path from command line

        if len(args) < 1:
          path = os.path.join(settings.ROOT_PATH, settings.THEME, 'data') # Default: theme data folder
        else:
          path = args[0]

        if options['language']:
          filename = "glosario_%s.csv" % (options['language'], )
        else:
          filename = 'glosario.csv'

        if not options.get('extend', False):
            GlossaryLoader().load(os.path.join(path, filename), options['language'])
            GlossaryLoader().load(PATH_TO_DEFAULT, 'es-es')
        else:
            try:
                GlossaryLoader().load(os.path.join(path, filename), options['language'])
            except IOError as e:
                print('Fichero no encontrado. Se va a cargar el glosario por defecto.')
                GlossaryLoader().load(PATH_TO_DEFAULT, 'es-es' )

