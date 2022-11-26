# -*- coding: UTF-8 -*-
from budget_app.loaders import BaseLoader
from budget_app.models import *
from decimal import *
import csv
import os
import re

# Generic Monitoring loader
class MonitoringLoader(BaseLoader):

    def load(self, entity, year, path):
        print u"Cargando objetivos e indicadores para entidad '%s' año %s..." % (entity.name, year)
