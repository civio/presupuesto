# -*- coding: UTF-8 -*-
from budget_app.loaders import BaseLoader
from budget_app.models import *
from decimal import *
import csv
import os
import re

# Generic Main investments loader
class MainInvestmentsLoader(BaseLoader):

    def load(self, entity, year, path, status):
        items = []
        self.parse_data(items, os.path.join(path, 'inversiones_principales.csv'))

        # Find the budget the investments relates to
        budget = Budget.objects.filter(entity=entity, year=year)
        if not budget:
            raise Exception("Budget (%s/%s) not found" % (entity.name, year))
        else:
            budget = budget.first()

        # Delete previous investments for the given budget if they exist
        MainInvestment.objects.filter(budget=budget).delete()

        # Store the data in the database
        if len(items) > 0:
            print u"Cargando inversiones principales para entidad '%s' año %s..." % (entity.name, year)
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
        investment_objects = []
        for item in items:
            # Ignore null entries
            if item == None:
                continue

            # Fetch functional category
            fc = FunctionalCategory.objects.filter( area=item.get('fc_area', None),
                                                    policy=item.get('fc_policy', None),
                                                    function=item.get('fc_function', None),
                                                    programme=item.get('fc_programme', None),
                                                    subprogramme=item.get('fc_subprogramme', None),
                                                    budget=budget)
            if not fc:
                print u"ALERTA: No se encuentra la categoría funcional '%s' para '%s'" % (item['fc_code'], item['project_id'])
                continue
            else:
                fc = fc.first()

            # Fetch geographic category
            if item['gc_code'] is not None and item['gc_code'] != '':
                gc = GeographicCategory.objects.filter( code=item['gc_code'],
                                                        budget=budget)
                if not gc:
                    print u"ALERTA: No se encuentra la categoría geográfica '%s' para '%s'" % (item['gc_code'], item['project_id'])
                    continue
                else:
                    gc = gc.first()
            else:
                gc = None

            # Create the main investment record
            obj = MainInvestment( functional_category=fc,
                            geographic_category=gc,
                            project_id=item['project_id'],
                            description=item['description'],
                            image_URL=item['image_URL'],
                            status=item['status'],
                            entity_name=item['entity_name'],
                            section_name=item['section_name'],
                            area_name=item['area_name'],
                            address=item['address'],
                            latitude=item['latitude'],
                            longitude=item['longitude'],
                            start_year=item['start_year'],
                            expected_end_year=item['expected_end_year'],
                            actual_end_year=item['actual_end_year'],
                            total_expected_amount=item['total_expected_amount'],
                            already_spent_amount=item['already_spent_amount'],
                            current_year_amount=item['current_year_amount'],
                            budget=budget)
            investment_objects.append(obj)

        MainInvestment.objects.bulk_create(investment_objects)
