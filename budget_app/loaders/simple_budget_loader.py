# -*- coding: UTF-8 -*-
from budget_app.loaders import BaseLoader
from budget_app.models import *
import csv
import os
import re

class SimpleBudgetLoader(BaseLoader):
    # List of files to be read, refactored out to allow easy overloading
    def _get_input_filenames(self):
        return ['ingresos.csv', 'gastos.csv', 'ejecucion_ingresos.csv', 'ejecucion_gastos.csv']

    def load(self, entity, year, path, status):
        # Parse the incoming data and keep in memory
        budget_items = []
        for filename in self._get_input_filenames():
            self.parse_budget_data(budget_items, os.path.join(path, filename))

        # Now load the data one budget at a time
        self.load_budget(path, entity, year, status, budget_items)


    # OVERRIDE THIS!
    # I don't think it's worth offering a base implementation, not at this point at least, since
    # every input data we get has a different structure, and there's value in keeping the CSV files
    # as close as possible to the original database, PDF, XLS, whatever.
    def parse_item(self, filename, line):
        return {}


    def parse_budget_data(self, budget_items, filename):
        if os.path.isfile(filename):
            print("Leyendo datos de %s..." % filename)
            reader = csv.reader(open(filename, 'r', encoding=self._get_data_files_encoding()), delimiter=self._get_delimiter())
            for index, line in enumerate(reader):
                if line==[] or re.match("^#", line[0]):     # Ignore comments and empty lines
                    continue

                # Finally, we have useful data
                budget_items.append(self.parse_item(filename, line))


    def load_budget(self, path, entity, year, status, items):
        # Delete previous budget for the given entity/year if it exists
        Budget.objects.filter(entity=entity, year=year).delete()

        # Store the data in the database
        print(u"Cargando presupuesto para entidad '%s' año %s..." % (entity.name, year))
        budget = Budget(entity=entity, year=year, status=status)
        budget.save()

        # Load the economic and functional classification from a manually edited file
        self.load_economic_classification(path, budget)
        self.load_institutional_classification(path, budget)
        self.load_functional_classification(path, budget)
        self.load_geographic_classification(path, budget)

        # Process the budget item
        self.load_budget_items(budget, items)


    # Load the budget items into the database. Do it in bulk to avoid hitting the database.
    def load_budget_items(self, budget, budget_items):
        # Since the incoming data is not fully classified along the four dimensions we defined
        # for the main budget (Aragón, the good one), we are forced to assign the items a
        # catch-all fake category. (Leaving the category blank would be another possibility,
        # but we'd have to modify the DB structure for that, and also our breakdown queries,
        # so I'm going this slightly hackier way first.)
        dummy_fdc = FundingCategory(expense=True,   # True/False doesn't really matter
                                    source='X',
                                    fund_class=None,
                                    fund=None,
                                    description='Desconocido',
                                    budget=budget)
        dummy_fdc.save()

        # Income data is often not classified functionally, but we need every budget item to be classified
        # along all dimensions (at least for now), because of the way we denormalize/join the data in the app.
        # So we create a fake functional category that will contain all the income data.
        dummy_fc = FunctionalCategory(  area='X',
                                        policy='XX',
                                        function='XXX',
                                        programme='XXXX',
                                        subprogramme='XXXX',
                                        description='Ingresos',
                                        budget=budget)
        dummy_fc.save()


        # Store data in the database
        budgeted_income = 0
        budgeted_expense = 0
        budget_item_objects = []
        for item in budget_items:
            # Ignore null entries or entries with no amount
            if item == None or item['amount'] == 0:
                continue

            # Check whether budget income and expense match
            if not item['is_actual']:
                if item['is_expense']:
                    budgeted_expense += item['amount']
                else:
                    budgeted_income += item['amount']

            # Fetch economic category
            ec = self.fetch_economic_category(budget, item['is_expense'], item['ec_code'])
            if not ec:
                print(u"ALERTA: No se encuentra la categoría económica de %s '%s'." % ("gastos" if item['is_expense'] else "ingresos", item['ec_code'], ))
                continue

            # Fetch institutional category.
            # This category is the trickiest to match, the less standard, so we allow the children
            # to specify the institution/section/department triad explicitly. If not, we default
            # to the original breakdown, one character per level.
            if not 'ic_institution' in item:
                item['ic_institution'] = item['ic_code'][0]
                item['ic_section'] = item['ic_code'][0:2] if len(item['ic_code']) >= 2 else None
                item['ic_department'] = item['ic_code'] if len(item['ic_code']) >= 3 else None

            ic = self.fetch_institutional_category(budget, item['ic_institution'], item['ic_section'], item['ic_department'])
            if not ic:
                print(u"ALERTA: No se encuentra la categoría institucional '%s'." % (item['ic_code'], ))
                continue

            # Fetch functional category, only for expense items
            if item['is_expense']:
                fc = self.fetch_functional_category_by_full_code(budget, item['fc_code'])
                if not fc:
                    print(u"ALERTA: No se encuentra la categoría funcional '%s'." % (item['fc_code'], ))
                    continue
            else:
                fc = dummy_fc

            # When there is no description for the budget_item take the one from the parent economic category
            if item['description'] == None or item['description'] == "":
                item['description'] = ec.description

            obj = BudgetItem(institutional_category=ic,
                      functional_category=fc,
                      economic_category=ec,
                      funding_category=dummy_fdc,
                      item_number=item.get('item_number', ''),
                      expense=item['is_expense'],
                      actual=item['is_actual'],
                      amount=item['amount'],
                      description=item['description'],
                      budget=budget)
            budget_item_objects.append(obj)

        # Save the objects in one transaction
        BudgetItem.objects.bulk_create(budget_item_objects)

        if budgeted_income != budgeted_expense:
            print("  Info: los ingresos y gastos del presupuesto no coinciden %0.2f <> %0.2f" % (budgeted_income/100.0, budgeted_expense/100.0))


    # Determine the institutional classification file path
    def get_institutional_classification_path(self, path):
        return os.path.join(path, '..', '..', 'clasificacion_organica.csv')

    # Load the institutional categories
    def load_institutional_classification(self, path, budget):
        filename = self.get_institutional_classification_path(path)
        reader = csv.reader(open(filename, 'r', encoding='utf-8'), delimiter=self._get_delimiter())
        category_objects = []
        for index, line in enumerate(reader):
            if line==[] or re.match("^#", line[0]):  # Ignore comments and empty lines
                continue

            institution = line[0]
            section = line[1]
            department = line[2]
            description = line[3]

            ic = InstitutionalCategory( institution=institution if institution != "" else None,
                                        section=institution+section if section != "" else None,
                                        department=institution+section+department if department != "" else None,
                                        description=description,
                                        budget=budget)
            category_objects.append(ic)
        InstitutionalCategory.objects.bulk_create(category_objects)


    # Determine the economic classification file path
    def get_economic_classification_path(self, path):
        return os.path.join(path, '..', '..', 'clasificacion_economica.csv')

    # Load the economic categories
    def load_economic_classification(self, path, budget):
        filename = self.get_economic_classification_path(path)
        reader = csv.reader(open(filename, 'r', encoding='utf-8'), delimiter=self._get_delimiter())
        category_objects = []
        for index, line in enumerate(reader):
            if line==[] or re.match("^#", line[0]):  # Ignore comments and empty lines
                continue

            is_expense = (line[0] != 'I')
            chapter = line[1]
            article = line[2]
            concept = line[3]
            description = line[4]

            ec = EconomicCategory(  expense=is_expense,
                                    chapter=chapter if chapter != "" else None,
                                    article=chapter+article if article != "" else None,
                                    heading=chapter+article+concept if concept != "" else None,
                                    description=description,
                                    budget=budget)
            category_objects.append(ec)
        EconomicCategory.objects.bulk_create(category_objects)


    # Determine the functional classification file path
    def get_functional_classification_path(self, path):
        return os.path.join(path, '..', '..', 'areas_funcionales.csv')

    # Load the functional categories
    def load_functional_classification(self, path, budget):
        filename = self.get_functional_classification_path(path)
        reader = csv.reader(open(filename, 'r', encoding='utf-8'), delimiter=self._get_delimiter())
        category_objects = []
        for index, line in enumerate(reader):
            if line==[] or re.match("^#", line[0]):     # Ignore comments and empty lines
                continue

            # If we're not using subprogrammes, insert an empty column where they would go.
            # This feels better than forcing everybody to add an empty column.
            if not self._use_subprogrammes():
                line.insert(4, "")

            area = line[0]
            policy = line[1]
            group = line[2]
            programme = line[3]
            subprogramme = line[4]
            description = line[5]

            fc = FunctionalCategory(area=area if area != "" else None,
                                    policy=area+policy if policy != "" else None,
                                    function=area+policy+group if group != "" else None,
                                    programme=area+policy+group+programme if programme != "" else None,
                                    subprogramme=area+policy+group+programme+subprogramme if subprogramme != "" else None,
                                    description=description,
                                    budget=budget)
            category_objects.append(fc)
        FunctionalCategory.objects.bulk_create(category_objects)


    # Determine the functional classification file path
    def get_geographic_classification_path(self, path):
        return os.path.join(path, '..', '..', 'clasificacion_geografica.csv')

    # Load the geographic categories (optional)
    def load_geographic_classification(self, path, budget):
        filename = self.get_geographic_classification_path(path)
        category_objects = []
        if os.path.isfile(filename):
            reader = csv.reader(open(filename, 'r', encoding='utf-8'), delimiter=self._get_delimiter())
            for index, line in enumerate(reader):
                if line==[] or re.match("^#", line[0]):  # Ignore comments and empty lines
                    continue

                code = line[0]
                description = line[1]

                gc = GeographicCategory(code=code,
                                        description=description,
                                        budget=budget)
                category_objects.append(gc)
        GeographicCategory.objects.bulk_create(category_objects)

    # Get the amount for a budget line.
    # This method is here mostly to support easy overloading in child classes
    def _parse_amount(self, amount):
        return self._read_english_number(amount)
