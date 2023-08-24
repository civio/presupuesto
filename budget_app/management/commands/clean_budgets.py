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
        self._clean_unused_functional_categories()
        self._clean_unused_economic_categories()

    # XXX: This assumes subheadings are not used, i.e. the SimpleBudgetLoader was used. See #495.
    def _clean_unused_economic_categories(self):
        # Clean unused headings, i.e. those without related budget items
        self._clean_unused_headings('true')
        self._clean_unused_headings('false')

        # Clean unused articles, i.e. those without children headings (after those were cleaned)
        self._clean_unused_articles('true')
        self._clean_unused_articles('false')

    def _clean_unused_headings(self, is_expense):
        sql = "DELETE " \
              "FROM economic_categories " \
              "WHERE economic_categories.id in (" \
                "select ec.id " \
                "from " \
                  "economic_categories ec " \
                  "left join budget_items bi " \
                  "on ec.id = bi.economic_category_id " \
                "where " \
                  "heading is not null and " \
                  "ec.expense="+is_expense+" and " \
                  "bi.id is null" \
                ")"
        print "Borrando conceptos (expense="+is_expense+") no utilizados..."
        self._execute_transaction(sql)

    def _clean_unused_articles(self, is_expense):
        sql = "DELETE " \
              "FROM economic_categories " \
              "WHERE " \
                "heading is null and " \
                "expense="+is_expense+" and " \
                "economic_categories.article not in (" \
                  "select article " \
                  "from economic_categories " \
                  "where " \
                    "heading is not null and " \
                    "expense="+is_expense+ \
                  ")"
        print "Borrando artículos (expense="+is_expense+") no utilizados..."
        self._execute_transaction(sql)

    # XXX: This may not work correctly when subprogrammes are enabled. See #495
    def _clean_unused_functional_categories(self):
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
        self._execute_transaction(sql)

    def _execute_transaction(self, sql):
        # We apparently need to explicitely call a transaction. Otherwise, Django seems to be
        # waiting for something to happen via 'the normal channels' and our raw query doesn't
        # get commited to the database.
        # Transaction handling has changed much in Django 1.6+. The following is the old
        # behaviour. See http://django-chinese-docs.readthedocs.io/en/latest/topics/db/transactions.html
        with transaction.commit_on_success():
          with connection.cursor() as cursor:
            cursor.execute(sql)
            print cursor.rowcount
