# -*- coding: UTF-8 -*-
from decimal import *
from budget_app.models import *

# Generic utilities for loaders
class BaseLoader(object):
    def __init__(self):
        self.goal_cache = {}
        self.economic_category_cache = {}
        self.institutional_category_cache = {}
        self.functional_category_cache = {}

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

    # Print safely, whatever the damn encoding
    # See https://stackoverflow.com/a/46434294
    def _remove_unicode(self, s):
        try: return str(s)
        except UnicodeEncodeError:
            return s.encode('ascii', 'ignore').decode('ascii')

    # Are we using subprogrammes? (Default: false)
    def _use_subprogrammes(self):
        return hasattr(settings, 'USE_SUBPROGRAMMES') and settings.USE_SUBPROGRAMMES



    # Get a functional category from the database, with caching!
    def fetch_functional_category(self, budget, fc_code):
        key = (budget, fc_code)
        if key not in self.functional_category_cache:
            fc = FunctionalCategory.objects.filter( area=fc_code[0:1],
                                                    policy=fc_code[0:2],
                                                    function=fc_code[0:3],
                                                    programme=fc_code[0:4] if self._use_subprogrammes() else fc_code,
                                                    subprogramme=fc_code if self._use_subprogrammes() else None,
                                                    budget=budget)
            self.functional_category_cache[key] = fc.first() if fc else None
        return self.functional_category_cache[key]

    # Get an economic category from the database, with caching!
    def fetch_economic_category(self, budget, is_expense, ec_code):
        key = (budget, is_expense, ec_code)
        if key not in self.economic_category_cache:
            ec = EconomicCategory.objects.filter(expense=is_expense,
                                                chapter=ec_code[0],
                                                article=ec_code[0:2] if len(ec_code) >= 2 else None,
                                                heading=ec_code[0:3] if len(ec_code) >= 3 else None,
                                                subheading = None,
                                                budget=budget)
            self.economic_category_cache[key] = ec.first() if ec else None
        return self.economic_category_cache[key]

    # Get an institutional category from the database, with caching!
    def fetch_institutional_category(self, budget, ic_institution, ic_section, ic_department):
        key = (budget, ic_institution, ic_section, ic_department)
        if key not in self.institutional_category_cache:
            ic = InstitutionalCategory.objects.filter(  institution=ic_institution,
                                                        section=ic_section,
                                                        department=ic_department,
                                                        budget=budget)
            self.institutional_category_cache[key] = ic.first() if ic else None
        return self.institutional_category_cache[key]

    # Get a from the database, with caching!
    def fetch_goal(self, budget, goal_uid):
        key = (budget, goal_uid)
        if key not in self.goal_cache:
            goal = Goal.objects.filter(budget=budget, uid=goal_uid)
            self.goal_cache[key] = goal.first() if goal else None
        return self.goal_cache[key]
