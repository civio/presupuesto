# -*- coding: UTF-8 -*-
from budget_app.loaders import BaseLoader
from budget_app.models import *
from decimal import *
import datetime
import csv
import os
import re


# Generic payments loader
class PaymentsLoader(BaseLoader):

    def load(self, entity, year, path, status):
        items = self.parse_data(os.path.join(path, 'pagos.csv'))

        # Find the budget the payments relates to
        budget = Budget.objects.filter(entity=entity, year=year)
        if not budget:
            raise Exception("Budget (%s/%s) not found" % (entity.name, year))
        else:
            budget = budget.first()

        # Delete previous payments for the given budget if they exist
        Payment.objects.filter(budget=budget).delete()

        # Store the data in the database
        if len(items) > 0:
            print("Cargando pagos para entidad '%s' año %s..." % (entity.name, year))
            self.load_items(budget, items)

    def parse_data(self, filename):
        items = []
        if os.path.isfile(filename):
            print("Leyendo datos de %s..." % filename)
            reader = csv.reader(open(filename, 'rb'))
            for index, line in enumerate(reader):
                if re.match("^#", line[0]):         # Ignore comments
                    continue

                if re.match("^ +$", line[0]):       # Ignore empty lines
                    continue

                # Finally, we have useful data
                items.append(line)
        else:
            print("No se encontró el fichero %s" % filename)

        return items

    # Parse an input line into fields
    # Note: we're ignoring some fields, not really relevant or not populated often enough to
    # be useful: period, NIF and source filename.
    def parse_item(self, budget, line):
        # The date is not always available
        try:
            date = datetime.datetime.strptime(line[4], "%Y-%m-%d")
        except ValueError:
            date = None

        return {
            'area': line[0].strip(),
            'fc_code': line[1].strip(),
            'ec_code': line[2].strip(),
            'ic_code': None,
            'payee': self._titlecase(line[6].strip()),
            'anonymized': False,
            'date': date,
            'description': self._spanish_titlecase(line[8].strip()),
            'amount': self._get_amount(line)
        }

    # Load payment data into the database. Do it in bulk to avoid network overhead.
    #
    # Note that the payment data may not be fully classified along the functional or economic
    # categories. When loading budget data for small entities we fill this up using dummy categories,
    # since we have complex queries in the application that expect a number of different tables
    # to match perfectly (and they were built when the data was always fine, for historical reasons).
    # But for payments we're going to leave the fields null in the database, should be cleaner.
    def load_items(self, budget, items):
        payment_objects = []
        for item in items:
            fields = self.parse_item(budget, item)

            # Ignore null entries or entries with no amount
            if fields is None or fields['amount'] == 0:
                continue

            # Fetch economic category, if available
            ec_code = fields.get('ec_code', None)
            if ec_code is not None and ec_code != '':
                ec = self.fetch_economic_category(budget, True, ec_code)
                if not ec:
                    print("ALERTA: No se encuentra la categoría económica '%s' para '%s': %s€" % (ec_code, fields['description'].decode("utf8"), fields['amount']/100))
                    continue
            else:
                ec = None

            # Fetch functional category, if available
            fc_code = fields.get('fc_code', None)
            if fc_code is not None and fc_code != '':
                fc = self.fetch_functional_category_by_full_code(budget, fc_code)
                if not fc:
                    print("ALERTA: No se encuentra la categoría funcional '%s' para '%s': %s€" % (fc_code, fields['description'].decode("utf8"), fields['amount']/100))
                    continue
            else:
                fc = None

            # Fetch institutional category, if available
            ic_code = fields.get('ic_code', None)
            if ic_code is not None and ic_code != '':
                ic = self.fetch_institutional_category(budget, ic_code[0], ic_code[0:2], ic_code)
                if not ic:
                    print("ALERTA: No se encuentra la categoría institutional '%s' para '%s': %s€" % (ic_code, fields['description'].decode("utf8"), fields['amount']/100))
                    continue
            else:
                ic = None

            # XXX: We've recently added a new field to payments: 'programme'
            # In order not to break existing loaders we're going to use null
            # as default value in case the attribute is not found, at least for now.
            # It'd probably make sense to treat all text fields like this, although
            # there's a certain value in forcing child loaders to explicitely set
            # fields to None if that's what they want.
            programme = fields.get('programme', None)
            # Same with 'anonymized' and 'payee_fiscal_id', added in a later stage
            anonymized = fields.get('anonymized', False)
            payee_fiscal_id = fields.get('payee_fiscal_id', '')

            # Create the payment object
            obj = Payment(area=fields['area'],
                    programme=programme,
                    functional_category=fc,
                    economic_category=ec,
                    institutional_category=ic,
                    date=fields['date'],
                    payee=fields['payee'],
                    payee_fiscal_id=payee_fiscal_id,
                    anonymized=anonymized,
                    expense=True,
                    amount=fields['amount'],
                    description=fields['description'],
                    budget=budget)
            payment_objects.append(obj)

        Payment.objects.bulk_create(payment_objects)

    # Get the amount for a budget line
    def _get_amount(self, item):
        return self._read_english_number(item[9])
