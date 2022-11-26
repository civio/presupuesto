# -*- coding: UTF-8 -*-

from django.conf import settings
from budget_app.management.commands import BaseLoadingCommand

class Command(BaseLoadingCommand):

    help = u"Carga las principales inversiones correspondientes al presupuesto del año"

    def handle(self, *args, **options):
        super(Command, self).handle(settings.MAIN_INVESTMENTS_LOADER, args, options)
