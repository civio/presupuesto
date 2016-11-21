# -*- coding: UTF-8 -*-
# See #372 for further info.

import os.path
import logging

from django.core.management.base import BaseCommand
from django.db import models, connection, transaction

class Command(BaseCommand):
    logging.disable(logging.ERROR)   # Avoid SQL logging on console

    help = u"Borra categorías funcionales no utilizadas de la base de datos, en caso de que sea necesario."

    def handle(self, *args, **options):
        sql = "DELETE " \
              "FROM functional_categories " \
              "WHERE functional_categories.id in (" \
                "select fc.id " \
                "from " \
                  "functional_categories fc " \
                  "left join budget_items bi " \
                  "on fc.id = bi.functional_category_id " \
                "where " \
                  "programme is not null and " \
                  "bi.id is null" \
                ")"

        print "Borrando categorías funcionales no utilizadas..."

        # We apparently need to explicitely call a transaction. Otherwise, Django seems to be
        # waiting for something to happen via 'the normal channels' and our raw query doesn't
        # get commited to the database.
        # Transaction handling has changed much in Django 1.6+. The following is the old
        # behaviour. See http://django-chinese-docs.readthedocs.io/en/latest/topics/db/transactions.html
        with transaction.commit_on_success():
          cursor = connection.cursor()
          try:
            cursor.execute(sql)
            print cursor.rowcount
          finally:
            cursor.close()
