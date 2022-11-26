# -*- coding: UTF-8 -*-

from django.conf import settings
from budget_app.management.commands import BaseLoadingCommand

class Command(BaseLoadingCommand):

    help = u"Carga los objetivos, indicadores y actividades del año"

    def handle(self, *args, **options):
        super(Command, self).handle(settings.MONITORING_LOADER, args, options)
