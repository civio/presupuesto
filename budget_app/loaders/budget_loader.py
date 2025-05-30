# -*- coding: UTF-8 -*-

from budget_app.loaders import BaseLoader
from budget_app.models import *
from decimal import *
import csv
import os.path


class BudgetLoader(BaseLoader):
    def load(self, entity, year, path, status):
        # Delete the existing budget if needed
        budget = Budget.objects.filter(entity=entity, year=year)
        if budget:
            budget.delete()

        print("Cargando presupuesto de %s..." % path)
        budget = Budget(entity=entity, year=year, status=status)
        budget.save()
        self.load_institutional_hierarchy(budget, path)
        self.load_economic_hierarchy(budget, path)
        self.load_functional_hierarchy(budget, path)
        self.load_funding_hierarchy(budget, path)
        self.load_data_files(budget, path)

        print("Cargando ejecución presupuestaria de %s..." % path)
        self.load_execution_data_files(budget, path)

    def get_default_institutional_categories(self):
        return []

    def add_institutional_category(self, items, line):
        description = line[2] if len(line)<=3 or line[3] == "" else line[3]
        description = description

        items.append({
                'institution': line[1][0:2],
                'section': (line[1][0:4] if len(line[1]) > 2 else None),
                'department': (line[1] if len(line[1]) > 4 else None),
                'description': description
            })

    def load_institutional_hierarchy(self, budget, path):
        institutional_categories = self.get_default_institutional_categories()
        institutions_filename = os.path.join(path, 'estructura_organica.csv')
        print("Cargando lista de secciones de %s..." % institutions_filename)
        reader = csv.reader(open(institutions_filename, 'r', encoding='utf-8'), delimiter=self._get_delimiter())
        for line in reader:
            # Ignore header, empty lines and comments
            if not line or line[0]=="" or line[0][0]=="#" or line[0] == 'EJERCICIO':
                continue

            if budget.year != line[0]:
                raise Exception("Years should match (%s <> %s)" % (budget.year, line[0]))

            self.add_institutional_category(institutional_categories, line)

        for item in institutional_categories:
            InstitutionalCategory(budget=budget, **item).save()


    def get_default_economic_categories(self):
        return []

    def add_economic_category(self, items, line):
        description = line[7]
        description = description

        items.append({
                'expense': (line[1].upper() == 'G'),
                'chapter': (line[2] if line[2] != "" else None),
                'article': (line[3] if line[3] != "" else None),
                'heading': (line[4] if line[4] != "" else None),
                'subheading': (line[5] if line[5] != "" else None),
                'description': description
            })

    def load_economic_hierarchy(self, budget, path):
        economic_categories = self.get_default_economic_categories()
        filename = os.path.join(path, 'estructura_economica.csv')
        print("Cargando jerarquía económica de %s..." % filename)
        reader = csv.reader(open(filename, 'r', encoding='utf-8'), delimiter=self._get_delimiter())
        for line in reader:
            # Ignore header, empty lines and comments
            if not line or line[0]=="" or line[0][0]=="#" or line[0] == 'EJERCICIO':
                continue

            if budget.year != line[0]:
                raise Exception("Years should match (%s <> %s)" % (budget.year, line[0]))

            self.add_economic_category(economic_categories, line)

        for item in economic_categories:
            EconomicCategory(budget=budget, **item).save()


    def get_default_funding_categories(self):
        return []

    def add_funding_category(self, items, line):
        # Prefer the long description if it exists, otherwise the short one
        description = line[6] if (line[6] != "") else line[5]
        description = description

        items.append({
                'expense': (line[1].upper() == 'G'),
                'source': (line[2] if line[2] != "" else None),
                'fund_class': (line[3] if line[3] != "" else None),
                'fund': (line[4] if line[4] != "" else None),
                'description': description.title()
            })

    # This is a quite particular classification, only seen in Aragón for now,
    # so we treat it as optional: if the file doesn't exist, continue
    def load_funding_hierarchy(self, budget, path):
        funding_categories = self.get_default_funding_categories()
        filename = os.path.join(path, 'estructura_financiacion.csv')
        if os.path.isfile(filename):
            print("Cargando jerarquía de financiación de %s..." % filename)
            reader = csv.reader(open(filename, 'r', encoding='utf-8'), delimiter=self._get_delimiter())
            for line in reader:
                # Ignore header, empty lines and comments
                if not line or line[0]=="" or line[0][0]=="#" or line[0] == 'EJERCICIO':
                    continue

                if budget.year != line[0]:
                    raise Exception("Years should match (%s <> %s)" % (budget.year, line[0]))

                self.add_funding_category(funding_categories, line)

        for item in funding_categories:
            FundingCategory(budget=budget, **item).save()


    def get_default_functional_categories(self):
        # Income data is often not classified functionally, but we need every budget item to be classified
        # along all dimensions (at least for now), because of the way we denormalize/join the data in the app.
        # So we create a fake functional category that will contain all the income data.
        categories = []
        categories.append({ 'area':'X',
                            'policy': 'XX',
                            'function': 'XXX',
                            'programme': 'XXXX',
                            'subprogramme': 'XXXXX' if self._use_subprogrammes() else None,
                            'description': 'Ingresos'})
        return categories

    def add_functional_category(self, items, line):
        description = line[6]

        # If we're not using subprogrammes, insert an empty column where they would go.
        # This feels better than forcing everybody to add an empty column.
        if not self._use_subprogrammes():
            line.insert(5, "")

        items.append({
                'area': line[1],
                'policy': (line[2] if line[2] != "" else None),
                'function': (line[3] if line[3] != "" else None),
                'programme': (line[4] if line[4] != "" else None),
                'subprogramme': (line[5] if line[5] != "" else None),
                'description': description
            })

    def load_functional_hierarchy(self, budget, path):
        functional_categories = self.get_default_functional_categories()
        filename = os.path.join(path, 'estructura_funcional.csv')
        print("Cargando jerarquía funcional de %s..." % filename)
        reader = csv.reader(open(filename, 'r', encoding='utf-8'), delimiter=self._get_delimiter())
        for line in reader:
            # Ignore header, empty lines and comments
            if not line or line[0]=="" or line[0][0]=="#" or line[0] == 'EJERCICIO':
                continue

            if budget.year != line[0]:
                raise Exception("Years should match (%s <> %s)" % (budget.year, line[0]))

            self.add_functional_category(functional_categories, line)

        for item in functional_categories:
            FunctionalCategory(budget=budget, **item).save()


    def load_data_files(self, budget, path):
        filename = os.path.join(path, 'gastos.csv')
        print("Cargando gastos de %s..." % filename)
        self.load_data_file(budget, filename, True, False)

        filename = os.path.join(path, 'ingresos.csv')
        print("Cargando ingresos de %s..." % filename)
        self.load_data_file(budget, filename, False, False)

    def load_execution_data_files(self, budget, path):
        filename = os.path.join(path, 'ejecucion_gastos.csv')
        if os.path.isfile(filename):
            print("Cargando ejecución de gastos de %s..." % filename)
            self.load_data_file(budget, filename, True, True)

        filename = os.path.join(path, 'ejecucion_ingresos.csv')
        if os.path.isfile(filename):
            print("Cargando ejecución de ingresos de %s..." % filename)
            self.load_data_file(budget, filename, False, True)

    # We first load all data lines, and then we process them. This became necessary at
    # some point when had to deal with subtotals in incoming files, for example.
    def load_data_file(self, budget, filename, is_expense, is_actual):
        reader = csv.reader(open(filename, 'r', encoding=self._get_data_files_encoding()), delimiter=self._get_delimiter())
        items = []
        for line in reader:
            if not line or line[0] == "" or line[0].upper() == 'EJERCICIO':  # Ignore header or empty lines
                continue

            if str(budget.year) != line[0]:
                if not is_actual:  # Be strict with budget data files
                    raise Exception(u"Los años no coinciden (%s <> %s)" % (budget.year, line[0]))
                else:
                    # Para la información de ejecución usamos el año del fichero, diga lo que diga
                    # la primera columna, pero informamos de ello por pantalla
                    print("INFO: Usando el año %s para la línea [%s]" % (budget.year, line))

            self.add_data_item(items, line, is_expense, is_actual)

        # Splitting this part allows for easier customization through child classes
        self.process_data_items(budget, items, is_expense, is_actual)

    # Get all the relevant bits from an input line, and put them all into a dictionary
    # TODO: Actually, not used anymore, it's been overloaded by both children. Is it worth
    # leaving it here as a default-ish implementation?
    def add_data_item(self, items, line, is_expense, is_actual):
        # Get the amount. For execution data, pick "Obligaciones/Créditos reconocidas/os"
        if is_actual:
            amount = line[10 if is_expense else 9]
        else:
            amount = line[6]

        # We treat the functional and economic codes a bit differently, we pass it on split into
        # its elements, while we pass other codes in one chunk. The only reason is that some
        # child loaders needed to do some manipulation and it's cleaner to override this
        # function, and not the actual loading. We could treat the other categories the same way.
        if is_expense:
            fc_area = line[2][0:1]
            fc_policy = line[2][0:2]
            fc_function = line[2][0:3]
            fc_programme = line[2][0:4] if self._use_subprogrammes() else line[2]
            fc_subprogramme = line[2] if self._use_subprogrammes() else None
        else:
            # Income data is often not classified functionally, so we use the fake category we
            # created before.
            fc_area = 'X'
            fc_policy = 'XX'
            fc_function = 'XXX'
            fc_programme = 'XXXX'
            fc_subprogramme = 'XXXXX' if self._use_subprogrammes() else None

        # Gather all the relevant bits and store them to be processed
        items.append({
                'ic_institution': line[1][0:2],
                'ic_section': line[1][0:4],
                'ic_department': line[1],
                'fc_area': fc_area,
                'fc_policy': fc_policy,
                'fc_function': fc_function,
                'fc_programme': fc_programme,
                'fc_subprogramme': fc_subprogramme,
                'ec_chapter': line[3][0],
                'ec_article': (line[3][0:2] if len(line[3])>=2 else None),
                'ec_heading': (line[3][0:3] if len(line[3])>=3 else None),
                'ec_subheading': (line[3] if len(line[3])>=4 else None),
                'ec_code': line[3], # Redundant, but convenient
                'fdc_code': line[4],
                'item_number': '',
                'description': line[5],
                'amount': self._read_spanish_number(amount)
            })

    def process_data_items(self, budget, items, is_expense, is_actual):
        for item in items:
            # Ignore null entries or entries with no amount
            if item == None or item['amount'] == 0:
                continue

            # Match budget item data to existing categories
            ic = InstitutionalCategory.objects.filter(budget=budget,
                                            institution=item['ic_institution'],
                                            section=item['ic_section'],
                                            department=item['ic_department'])
            if not ic:
                print("ALERTA: No se encuentra la institución '%s' para '%s': %s€" % (item['ic_code'], item['description'], item['amount']))
                continue
            else:
                ic = ic.first()

            fc = FunctionalCategory.objects.filter(budget=budget,
                                                area=item['fc_area'],
                                                policy=item['fc_policy'],
                                                function=item['fc_function'],
                                                programme=item['fc_programme'],
                                                subprogramme=item['fc_subprogramme'] if self._use_subprogrammes() else None)
            if not fc:
                code = item['fc_subprogramme'] if self._use_subprogrammes() else item['fc_programme']
                print("ALERTA: No se encuentra la categoría funcional '%s' para '%s': %s€" % (code, item['description'], item['amount']))
                continue
            else:
                fc = fc.first()

            ec = EconomicCategory.objects.filter(budget=budget,
                                                expense=is_expense,
                                                chapter=item['ec_chapter'],
                                                article=item['ec_article'],
                                                heading=item['ec_heading'],
                                                subheading=item['ec_subheading'])
            if not ec:
                print("ALERTA: No se encuentra la categoría económica '%s' para '%s': %s€" % (item['ec_code'], item['description'], item['amount']))
                continue
            else:
                ec = ec.first()

            fdc = FundingCategory.objects.filter(budget=budget,
                                                expense=is_expense,
                                                source=item['fdc_code'][0],
                                                fund_class=item['fdc_code'][0:2],
                                                fund=item['fdc_code'])
            if not fdc:
                print("ALERTA: No se encuentra la categoría de financiación '%s' para '%s': %s€" % (item['fdc_code'], item['description'], item['amount']))
                continue
            else:
                fdc = fdc.first()

            # When there is no description for the budget_item take the one from the parent economic category
            if item['description'] == None or item['description'] == "":
                item['description'] = ec.description

            # Create the budget item
            if item['amount'] != "":
                BudgetItem(institutional_category=ic,
                          functional_category=fc,
                          economic_category=ec,
                          funding_category=fdc,
                          expense=is_expense,
                          actual=is_actual,
                          item_number=item['item_number'],
                          amount=item['amount'],
                          description=item['description'][0:512],
                          budget=budget).save()

    # Are we using subprogrammes? (Default: false)
    def _use_subprogrammes(self):
        return hasattr(settings, 'USE_SUBPROGRAMMES') and settings.USE_SUBPROGRAMMES
