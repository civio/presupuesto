# -*- coding: UTF-8 -*-

from django.core.exceptions import ObjectDoesNotExist

from budget_app.models import GlossaryTerm
import csv
import re


class GlossaryLoader(object):
    def load(self, filename, language):

        print("Cargando glosario de %s..." % filename)
        reader = csv.reader(open(filename, 'rb'))
        for index, line in enumerate(reader):
            if re.match("^#", line[0]):  # Ignore comments
                continue

            print("  Cargando término %s..." % line[0])
            try:
                term = GlossaryTerm.objects.get(title=line[0], language=language)
                term.description = line[1]
            except ObjectDoesNotExist:
                term = GlossaryTerm(title=line[0], description=line[1], language=language)
            term.save()

    def delete_all(self, language):
        GlossaryTerm.objects.filter(language=language).delete()
