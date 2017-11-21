# -*- coding: UTF-8 -*-
from budget_app.models import *
from decimal import *
import csv
import os
import re

# Generic investments loader
class InvestmentsLoader:

    def load(self, entity, year, path):
        items = self.parse_data(os.path.join(path, 'inversiones.csv'))

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


    def parse_data(self, filename):
        items = []
        if os.path.isfile(filename):
            print "Leyendo datos de %s..." % filename
            reader = csv.reader(open(filename, 'rb'), delimiter=self._get_delimiter())
            for index, line in enumerate(reader):
                if re.match("^#", line[0]):         # Ignore comments
                    continue

                if re.match("^ +$", line[0]):       # Ignore empty lines
                    continue

                # Finally, we have useful data
                items.append(line)
        else:
            print "No se encontró el fichero %s" % filename

        return items


    # Parse an input line into fields
    def parse_item(self, budget, line):
        return {
            'gc_code': line[0].strip(),
            'description': self._spanish_titlecase(line[1].strip()),
            'amount': self._read_english_number(line[2])
        }


    def load_items(self, budget, items):
        for item in items:
            fields = self.parse_item(budget, item)

            # Ignore null entries or entries with no amount
            if fields == None or fields['amount'] == 0:
                continue

            # Fetch economic category
            gc = GeographicCategory.objects.filter( code=fields['gc_code'],
                                                    budget=budget)
            if not gc:
                print u"ALERTA: No se encuentra la categoría geográfica '%s' para '%s': %s€" % (fields['gc_code'], fields['description'], fields['amount']/100)
                continue
            else:
                gc = gc[0]


            # Create the payment record
            Investment(geographic_category=gc,
                    expense=True,
                    amount=fields['amount'],
                    description=fields['description'],
                    budget=budget).save()


    # TODO: These below are probably useful enough to move to some base/utils class.
    # They are needed sometimes by the SimpleBudgetLoader.
    # (It may be worth checking also what other loaders are doing regarding Unicode, since it's always
    # a tricky business.)

    # Make input file delimiter configurable by children
    def _get_delimiter(self):
        return ','

    # Read number in Spanish format (123.456,78), and return as number of cents
    def _read_spanish_number(self, s):
        if (s.strip()==""):
            return 0

        return int(Decimal(s.replace('.', '').replace(',', '.'))*100)

    # Read number in English format (123,456.78), and return as number of cents
    def _read_english_number(self, s):
        if (s.strip()==""):
            return 0

        return int(Decimal(s.replace(',', ''))*100)

    # If the given string is all uppercase, convert to titlecase
    def _titlecase(self, s):
        if s.isupper():
          # We need to do the casing operation on an Unicode string so it handles accented characters correctly
          return unicode(s, encoding='utf8').title()
        else:
          return s

    # If the given string is all uppercase, convert to 'spanish titlecase', i.e. only first letter is upper
    def _spanish_titlecase(self, s):
        if s.isupper():
          # We need to do the casing operation on an Unicode string so it handles accented characters correctly
          s = unicode(s, encoding='utf8')
          return s.capitalize()
        else:
          return s
