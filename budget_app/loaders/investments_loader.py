# -*- coding: UTF-8 -*-
from budget_app.loaders import BaseLoader
from budget_app.models import *
from decimal import *
import csv
import os
import re

# Generic investments loader
class InvestmentsLoader(BaseLoader):

    def load(self, entity, year, path, status):
        items = []
        self.parse_data(items, os.path.join(path, 'inversiones.csv'))
        self.parse_data(items, os.path.join(path, 'ejecucion_inversiones.csv'))

        # Find the budget the investments relates to
        budget = Budget.objects.filter(entity=entity, year=year)
        if not budget:
            raise Exception("Budget (%s/%s) not found" % (entity.name, year))
        else:
            budget = budget.first()

        # Delete previous investments for the given budget if they exist
        Investment.objects.filter(budget=budget).delete()

        # Store the data in the database
        if len(items) > 0:
            print("Cargando inversiones para entidad '%s' año %s..." % (entity.name, year))
            self.load_items(budget, items)


    def parse_data(self, items, filename):
        if os.path.isfile(filename):
            print("Leyendo datos de %s..." % filename)
            reader = csv.reader(open(filename, 'r', encoding='utf-8'), delimiter=self._get_delimiter())
            for index, line in enumerate(reader):
                if re.match("^#", line[0]):         # Ignore comments
                    continue

                if re.match("^ +$", line[0]):       # Ignore empty lines
                    continue

                # Finally, we have useful data
                items.append(self.parse_item(filename, line))
        else:
            print("No se encontró el fichero %s" % filename)

        return items


    # OVERRIDE THIS!
    # I don't think it's worth offering a base implementation, not at this point at least, since
    # every input data we get has a different structure, and there's value in keeping the CSV files
    # as close as possible to the original database, PDF, XLS, whatever.
    def parse_item(self, filename, line):
        return {}


    # Load investment data into the database. Do it in bulk to avoid network overhead.
    def load_items(self, budget, items):
        investment_objects = []
        for item in items:
            # Ignore null entries or entries with no amount
            if item == None or item['amount'] == 0:
                continue

            # Fetch functional category
            fc = self.fetch_functional_category(budget,
                                                item.get('fc_area', None),
                                                item.get('fc_policy', None),
                                                item.get('fc_function', None),
                                                item.get('fc_programme', None),
                                                item.get('fc_subprogramme', None))
            if not fc:
                print("ALERTA: No se encuentra la categoría funcional '%s' para '%s': %s€" % (item['fc_code'], item['description'].decode("utf-8"), item['amount']/100))
                continue

            # Fetch geographic category
            gc = self.fetch_geographical_category(budget, item['gc_code'])
            if not gc:
                print("ALERTA: No se encuentra la categoría geográfica '%s' para '%s': %s€" % (item['gc_code'], item['description'].decode("utf-8"), item['amount']/100))
                continue

            # Create the payment object
            obj = Investment( functional_category=fc,
                        geographic_category=gc,
                        actual=item['is_actual'],
                        amount=item['amount'],
                        project_id=item['project_id'],
                        description=item['description'],
                        budget=budget)
            investment_objects.append(obj)

        Investment.objects.bulk_create(investment_objects)
