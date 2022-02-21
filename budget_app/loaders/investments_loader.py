# -*- coding: UTF-8 -*-
from budget_app.loaders import BaseLoader
from budget_app.models import *
from decimal import *
import csv
import os
import re

# Generic investments loader
class InvestmentsLoader(BaseLoader):

    def load(self, entity, year, path):
        items = []
        self.parse_data(items, os.path.join(path, 'inversiones.csv'))
        self.parse_data(items, os.path.join(path, 'ejecucion_inversiones.csv'))

        # Find the budget the investments relates to
        budget = Budget.objects.filter(entity=entity, year=year)
        if not budget:
            raise Exception("Budget (%s/%s) not found" % (entity.name, year))
        else:
            budget = budget[0]

        # Delete previous investments for the given budget if they exist
        Investment.objects.filter(budget=budget).delete()

        # Store the data in the database
        if len(items) > 0:
            print u"Cargando inversiones para entidad '%s' año %s..." % (entity.name, year)
            self.load_items(budget, items)


    def parse_data(self, items, filename):
        if os.path.isfile(filename):
            print "Leyendo datos de %s..." % filename
            reader = csv.reader(open(filename, 'rb'), delimiter=self._get_delimiter())
            for index, line in enumerate(reader):
                if re.match("^#", line[0]):         # Ignore comments
                    continue

                if re.match("^ +$", line[0]):       # Ignore empty lines
                    continue

                # Finally, we have useful data
                items.append(self.parse_item(filename, line))
        else:
            print "No se encontró el fichero %s" % filename

        return items


    # OVERRIDE THIS!
    # I don't think it's worth offering a base implementation, not at this point at least, since
    # every input data we get has a different structure, and there's value in keeping the CSV files
    # as close as possible to the original database, PDF, XLS, whatever.
    def parse_item(self, filename, line):
        return {}


    def load_items(self, budget, items):
        for item in items:
            # Ignore null entries or entries with no amount
            if item == None or item['amount'] == 0:
                continue

            # Fetch functional category
            fc = FunctionalCategory.objects.filter( area=item.get('fc_area', None),
                                                    policy=item.get('fc_policy', None),
                                                    function=item.get('fc_function', None),
                                                    programme=item.get('fc_programme', None),
                                                    subprogramme=item.get('fc_subprogramme', None),
                                                    budget=budget)
            if not fc:
                print u"ALERTA: No se encuentra la categoría funcional '%s' para '%s': %s€" % (item['fc_code'], item['description'].decode("utf-8"), item['amount']/100)
                continue
            else:
                fc = fc[0]

            # Fetch geographic category
            gc = GeographicCategory.objects.filter( code=item['gc_code'],
                                                    budget=budget)
            if not gc:
                print u"ALERTA: No se encuentra la categoría geográfica '%s' para '%s': %s€" % (item['gc_code'], item['description'].decode("utf-8"), item['amount']/100)
                continue
            else:
                gc = gc[0]

            # Create the payment record
            Investment( functional_category=fc,
                        geographic_category=gc,
                        actual=item['is_actual'],
                        amount=item['amount'],
                        project_id=item['project_id'],
                        description=item['description'],
                        budget=budget).save()
