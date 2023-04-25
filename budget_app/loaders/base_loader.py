# -*- coding: UTF-8 -*-
from decimal import *

# Generic utilities for loaders
class BaseLoader(object):

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
