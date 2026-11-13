# -*- coding: UTF-8 -*-
from budget_app.loaders import BaseLoader
from budget_app.models import *
import csv
import os

class SimpleBudgetLoader(BaseLoader):
    # List of files to be read, refactored out to allow easy overloading
    def _get_input_filenames(self):
        return ['ingresos.csv', 'gastos.csv', 'ejecucion_ingresos.csv', 'ejecucion_gastos.csv']

    def load(self, entity, year, path, status):
        # Don't touch the database if there's no data for the year: an empty budget
        # would become the latest one, and the home page would show nothing
        filenames = [os.path.join(path, filename) for filename in self._get_input_filenames()]
        if not any(os.path.isfile(filename) for filename in filenames):
            print("No hay datos en %s, no se carga el presupuesto de %s." % (path, year))
            return

        # Parse the incoming data and keep in memory
        budget_items = []
        for filename in filenames:
            self.parse_budget_data(budget_items, filename)

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
                line = self._strip_fields(line)
                if not self._is_data_line(line):
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
            if 'ic_institution' not in item:
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


    # Classifications can change from one year to the next, so look first in the year's folder,
    # and then in the entity's, where most sites keep a single one for all years
    def _find_classification_file(self, path, filename):
        year_filename = os.path.join(path, filename)
        if os.path.isfile(year_filename):
            return year_filename
        return os.path.join(path, '..', '..', filename)

    # Classification files give each level of a code in its own column, with only the digits
    # it adds to its parent ('1', '2', '0' for chapter 1, article 12 and heading 120), and leave
    # the column empty when the line is for a higher level. Turn those into whole codes, or None.
    # (The PGE's are the exception: they have the whole code in each column.)
    def _join_codes(self, *parts):
        codes = []
        code = ''
        for part in parts:
            code += part
            codes.append(code if part else None)
        return codes

    # Some sources pad their fields with spaces, ordinary or not ('\xa0'), or put a space
    # in empty ones (Navarra's, see civio/presupuesto-management#410), so we strip them
    def _strip_fields(self, line):
        return [field.strip() for field in line]

    # Skip empty lines, comments, and the header row of the files that have one
    # (the PGE's, written by scraper-pge, start with 'EJERCICIO')
    def _is_data_line(self, line):
        return line != [] and not line[0].startswith('#') and line[0].upper() != 'EJERCICIO'

    # Read a classification file, skipping comments, empty lines and headers
    def _read_classification_file(self, filename):
        reader = csv.reader(open(filename, 'r', encoding='utf-8'), delimiter=self._get_delimiter())
        for line in reader:
            line = self._strip_fields(line)
            if self._is_data_line(line):
                yield line


    # Determine the institutional classification file path
    def get_institutional_classification_path(self, path):
        return self._find_classification_file(path, 'clasificacion_organica.csv')

    # Turn a line of the institutional classification into the fields of a category, or None to skip it.
    # Themes whose files have a different format override this.
    def parse_institutional_category(self, line):
        institution, section, department, description = line[:4]
        institution, section, department = self._join_codes(institution, section, department)
        return {
            'institution': institution,
            'section': section,
            'department': department,
            'description': description
        }

    # Load the institutional categories
    def load_institutional_classification(self, path, budget):
        filename = self.get_institutional_classification_path(path)
        category_objects = []
        for line in self._read_classification_file(filename):
            category = self.parse_institutional_category(line)
            if category:
                category_objects.append(InstitutionalCategory(budget=budget, **category))
        InstitutionalCategory.objects.bulk_create(category_objects)


    # Determine the economic classification file path
    def get_economic_classification_path(self, path):
        return self._find_classification_file(path, 'clasificacion_economica.csv')

    # Turn a line of the economic classification into the fields of a category, or None to skip it.
    # Themes whose files have a different format, or subheadings, override this.
    def parse_economic_category(self, line):
        income_or_expense, chapter, article, heading, description = line[:5]
        chapter, article, heading = self._join_codes(chapter, article, heading)
        return {
            'expense': income_or_expense != 'I',
            'chapter': chapter,
            'article': article,
            'heading': heading,
            'description': description
        }

    # Load the economic categories
    def load_economic_classification(self, path, budget):
        filename = self.get_economic_classification_path(path)
        category_objects = []
        for line in self._read_classification_file(filename):
            category = self.parse_economic_category(line)
            if category:
                category_objects.append(EconomicCategory(budget=budget, **category))
        EconomicCategory.objects.bulk_create(category_objects)


    # Determine the functional classification file path
    def get_functional_classification_path(self, path):
        return self._find_classification_file(path, 'areas_funcionales.csv')

    # Turn a line of the functional classification into the fields of a category, or None to skip it.
    # Themes whose files have a different format override this.
    def parse_functional_category(self, line):
        # The subprogramme column is only there for sites that use them
        if self._use_subprogrammes():
            area, policy, group, programme, subprogramme, description = line[:6]
        else:
            area, policy, group, programme, description = line[:5]
            subprogramme = ''
        area, policy, group, programme, subprogramme = self._join_codes(area, policy, group, programme, subprogramme)
        return {
            'area': area,
            'policy': policy,
            'function': group,
            'programme': programme,
            'subprogramme': subprogramme,
            'description': description
        }

    # Load the functional categories
    def load_functional_classification(self, path, budget):
        filename = self.get_functional_classification_path(path)
        category_objects = []
        for line in self._read_classification_file(filename):
            category = self.parse_functional_category(line)
            if category:
                category_objects.append(FunctionalCategory(budget=budget, **category))
        FunctionalCategory.objects.bulk_create(category_objects)


    # Determine the functional classification file path
    def get_geographic_classification_path(self, path):
        return self._find_classification_file(path, 'clasificacion_geografica.csv')

    # Load the geographic categories (optional)
    def load_geographic_classification(self, path, budget):
        filename = self.get_geographic_classification_path(path)
        category_objects = []
        if os.path.isfile(filename):
            for line in self._read_classification_file(filename):
                code, description = line[:2]
                category_objects.append(GeographicCategory(code=code, description=description, budget=budget))
        GeographicCategory.objects.bulk_create(category_objects)

    # Get the amount for a budget line.
    # This method is here mostly to support easy overloading in child classes
    def _parse_amount(self, amount):
        return self._read_english_number(amount)
