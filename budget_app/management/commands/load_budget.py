# -*- coding: UTF-8 -*-

from django.conf import settings
from budget_app.management.commands import BaseLoadingCommand

class Command(BaseLoadingCommand):

    help = u"Carga el presupuesto del año"

    def handle(self, *args, **options):
        super(Command, self).handle(settings.BUDGET_LOADER, args, options)
