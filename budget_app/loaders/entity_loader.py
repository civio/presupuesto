# -*- coding: UTF-8 -*-
from budget_app.models import Entity
import csv
import re


class EntityLoader(object):
    def load(self, filename):
        self._delete_all()

        print("Cargando lista de organismos de %s..." % filename)
        reader = csv.reader(open(filename, 'r', encoding='utf-8'))
        for index, line in enumerate(reader):
            if re.match("^#", line[0]):  # Ignore comments
                continue

            entity = Entity(code=line[0], level=line[1], name=line[2], language=line[3])
            entity.save()

    def _delete_all(self):
        Entity.objects.all().delete()
