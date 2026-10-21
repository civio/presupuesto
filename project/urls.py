# -*- coding: UTF-8 -*-

from django.conf.urls.i18n import i18n_patterns
from django.urls import include, re_path
from django.conf import settings
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.utils import translation
from django.views.decorators.cache import never_cache
from django.views.generic.base import RedirectView
from django.shortcuts import render

from budget_app.views import *

# Do we have more than one language? If so, localize the URLs and add Django's i18n paths
if len(settings.LANGUAGES) > 1:
    @never_cache
    def redirect_to_default_homepage(request):
        if hasattr(settings, 'DEFAULT_HOMEPAGE_LANGUAGE'):
            translation.activate(settings.DEFAULT_HOMEPAGE_LANGUAGE)
        return HttpResponseRedirect(reverse('welcome'))

    budget_app_urlpatterns = [
        re_path(r'^i18n/', include('django.conf.urls.i18n')),
        re_path(r'^$', redirect_to_default_homepage),
    ]
    add_url_patterns = lambda x: i18n_patterns(*x)
else:
    budget_app_urlpatterns = []
    add_url_patterns = lambda x: list(x)

# Listings without an item code have no page of their own, so send them to the main one.
# See civio/presupuesto-management#1403
to_policies = RedirectView.as_view(pattern_name='policies', permanent=True, query_string=True)

# Add the application paths
budget_app_urlpatterns += add_url_patterns([
    re_path(r'^$', welcome, name='welcome'),

    re_path(r'^resumen$', budgets, name='budgets'),

    re_path(r'^glosario$', terms, name='glossary'),

    re_path(r'^busqueda$', search, name='search'),

    re_path(r'^recibo$', tax_receipt, name='tax_receipt'),

    re_path(r'^visita-guiada$', guided_visit, name='guided_visit'),

    re_path(r'^politica-de-cookies$', pages, name='pages'),

    # Payments
    re_path(r'^pagos$', payments, name='payments'),
    re_path(r'^pagos/search$', payment_search, name='payment_search'),

    # Investments
    re_path(r'^inversiones$', investments, name='investments'),
    re_path(r'^inversiones/(?P<id>[0-9A-Z]+)/(?P<title>.+)$', investments_show, name='investments_show'),

    # Main investments
    re_path(r'^inversiones-principales$', main_investments, name='main_investments'),

    # Monitoring
    re_path(r'^objetivos$', monitoring, name='monitoring'),

    # Policies (top)
    re_path(r'^politicas$', policies, name='policies'),
    re_path(r'^politicas/(?P<id>[0-9]+)$', add_slug_redirect, { 'view_name': 'policies_show', 'descriptions_key': 'functional' }),
    re_path(r'^politicas/(?P<id>[0-9]+)/(?P<title>.+)$', policies_show, name='policies_show'),

    # Programme pages
    re_path(r'^programas$', to_policies, name='programmes'),
    re_path(r'^programas/(?P<id>[0-9A-Z]+)$', add_slug_redirect, { 'view_name': 'programmes_show', 'descriptions_key': 'functional' }),
    re_path(r'^programas/(?P<id>[0-9A-Z]+)/(?P<title>.+)$', programmes_show, name='programmes_show'),

    # Subprogramme pages
    re_path(r'^subprogramas$', to_policies, name='subprogrammes'),
    re_path(r'^subprogramas/(?P<id>[0-9A-Z]+)$', add_slug_redirect, { 'view_name': 'subprogrammes_show', 'descriptions_key': 'functional' }),
    re_path(r'^subprogramas/(?P<id>[0-9A-Z]+)/(?P<title>.+)$', subprogrammes_show, name='subprogrammes_show'),

    # Expense pages (economic breakdown)
    re_path(r'^articulos/g$', to_policies, name='expense_articles'),
    re_path(r'^articulos/g/(?P<id>[0-9]+)$', add_slug_redirect, { 'view_name': 'expense_articles_show', 'descriptions_key': 'expense' }),
    re_path(r'^articulos/g/(?P<id>[0-9]+)/(?P<title>.+)$', expense_articles_show, name='expense_articles_show'),

    # Income pages
    re_path(r'^articulos/i$', to_policies, name='income_articles'),
    re_path(r'^articulos/i/(?P<id>[0-9]+)$', add_slug_redirect, { 'view_name': 'income_articles_show', 'descriptions_key': 'income' }),
    re_path(r'^articulos/i/(?P<id>[0-9]+)/(?P<title>.+)$', income_articles_show, name='income_articles_show'),

    # Sections
    re_path(r'^secciones$', to_policies, name='sections'),
    re_path(r'^secciones/(?P<id>[0-9A-Z]+)/(?P<title>.+)$', sections_show, name='sections_show'),

    # Child entities
    re_path(r'^entidades/(?P<id>[0-9A-Z]+)/politicas$', entities_policies, name='entities_policies'),
    re_path(r'^entidades/(?P<id>[0-9A-Z]+)/politicas/(?P<policy_id>[0-9]+)/(?P<title>.+)$', entities_policies_show, name='entities_policies_show'),
    re_path(r'^entidades/(?P<id>[0-9A-Z]+)/programas$', entities_programmes, name='entities_programmes'),
    re_path(r'^entidades/(?P<id>[0-9A-Z]+)/programas/(?P<programme_id>[0-9A-Z]+)/(?P<title>.+)$', entities_programmes_show, name='entities_programmes_show'),
    re_path(r'^entidades/(?P<id>[0-9A-Z]+)/articulos/i$', entities_income_articles_show, name='entities_income_articles'),
    re_path(r'^entidades/(?P<id>[0-9A-Z]+)/articulos/i/(?P<article_id>[0-9]+)/(?P<title>.+)$', entities_income_articles_show, name='entities_income_articles_show'),
    re_path(r'^entidades/(?P<id>[0-9A-Z]+)/articulos/g$', entities_expense_articles_show, name='entities_expense_articles'),
    re_path(r'^entidades/(?P<id>[0-9A-Z]+)/articulos/g/(?P<article_id>[0-9]+)/(?P<title>.+)$', entities_expense_articles_show, name='entities_expense_articles_show'),
    re_path(r'^entidades/(?P<id>[0-9A-Z]+)/pagos$', entities_payments, name='entities_payments'),
    re_path(r'^entidades/(?P<id>[0-9A-Z]+)/pagos/search$', entities_payments_search, name='entities_payments_search'),

    # Counties
    re_path(r'^comarcas$', counties, name='counties'),
    re_path(r'^comarcas/(?P<county_slug>[a-z\-]+)$', counties_show),
    re_path(r'^comarcas/(?P<county_slug>[a-z\-]+)/ingresos/(?P<id>[0-9]+)$', counties_show_income),
    re_path(r'^comarcas/(?P<county_slug>[a-z\-]+)/gastosf/(?P<id>[0-9]+)$', counties_show_functional),
    re_path(r'^comarcas/(?P<county_slug>[a-z\-]+)/gastos/(?P<id>[0-9]+)$', counties_show_expense),

    # Towns
    re_path(r'^municipios$', towns, name='towns'),
    re_path(r'^municipios/(?P<town_slug>[a-z\-]+)$', towns_show),
    re_path(r'^municipios/(?P<town_slug>[a-z\-]+)/ingresos/(?P<id>[0-9]+)$', towns_show_income),
    re_path(r'^municipios/(?P<town_slug>[a-z\-]+)/gastosf/(?P<id>[0-9]+)$', towns_show_functional),
    re_path(r'^municipios/(?P<town_slug>[a-z\-]+)/gastos/(?P<id>[0-9]+)$', towns_show_expense),

    # Comparison pages
    re_path(r'^comarcas/(?P<county_left_slug>.+)/(?P<county_right_slug>.+)$', counties_compare),
    re_path(r'^municipios/(?P<town_left_slug>.+)/(?P<town_right_slug>.+)$', towns_compare),


    #
    # CSV / XLS downloads
    #

    # Policies
    re_path(r'^politicas/(?P<id>[0-9]+)_functional\.(?P<format>.+)$', functional_policy_breakdown, name='functional_policy_breakdown'),
    re_path(r'^politicas/(?P<id>[0-9]+)_economic\.(?P<format>.+)$', economic_policy_breakdown, name='economic_policy_breakdown'),
    re_path(r'^politicas/(?P<id>[0-9]+)_funding\.(?P<format>.+)$', funding_policy_breakdown, name='funding_policy_breakdown'),
    re_path(r'^politicas/(?P<id>[0-9]+)_institutional\.(?P<format>.+)$', institutional_policy_breakdown, name='institutional_policy_breakdown'),

    # Programmes
    re_path(r'^programas/(?P<id>[0-9A-Z]+)_functional\.(?P<format>.+)$', functional_programme_breakdown, name='functional_programme_breakdown'),
    re_path(r'^programas/(?P<id>[0-9A-Z]+)_economic\.(?P<format>.+)$', economic_programme_breakdown, name='economic_programme_breakdown'),
    re_path(r'^programas/(?P<id>[0-9A-Z]+)_funding\.(?P<format>.+)$', funding_programme_breakdown, name='funding_programme_breakdown'),
    re_path(r'^programas/(?P<id>[0-9A-Z]+)_institutional\.(?P<format>.+)$', institutional_programme_breakdown, name='institutional_programme_breakdown'),

    # Subprogrammes
    re_path(r'^subprogramas/(?P<id>[0-9A-Z]+)_economic\.(?P<format>.+)$', economic_subprogramme_breakdown, name='economic_subprogramme_breakdown'),
    re_path(r'^subprogramas/(?P<id>[0-9A-Z]+)_funding\.(?P<format>.+)$', funding_subprogramme_breakdown, name='funding_subprogramme_breakdown'),
    re_path(r'^subprogramas/(?P<id>[0-9A-Z]+)_institutional\.(?P<format>.+)$', institutional_subprogramme_breakdown, name='institutional_subprogramme_breakdown'),

    # Articles
    re_path(r'^articulos/(?P<id>[0-9]+)_functional\.(?P<format>.+)$', functional_article_expenditures_breakdown, name='functional_article_expenditures_breakdown'),
    re_path(r'^articulos/(?P<id>[0-9]+)_economic_revenues\.(?P<format>.+)$', economic_article_revenues_breakdown, name='economic_article_revenues_breakdown'),
    re_path(r'^articulos/(?P<id>[0-9]+)_economic_expenditures\.(?P<format>.+)$', economic_article_expenditures_breakdown, name='economic_article_expenditures_breakdown'),
    re_path(r'^articulos/(?P<id>[0-9]+)_funding_revenues\.(?P<format>.+)$', funding_article_revenues_breakdown, name='funding_article_revenues_breakdown'),
    re_path(r'^articulos/(?P<id>[0-9]+)_funding_expenditures\.(?P<format>.+)$', funding_article_expenditures_breakdown, name='funding_article_expenditures_breakdown'),
    re_path(r'^articulos/(?P<id>[0-9]+)_institutional_revenues\.(?P<format>.+)$', institutional_article_revenues_breakdown, name='institutional_article_revenues_breakdown'),
    re_path(r'^articulos/(?P<id>[0-9]+)_institutional_expenditures\.(?P<format>.+)$', institutional_article_expenditures_breakdown, name='institutional_article_expenditures_breakdown'),

    # Sections
    re_path(r'^secciones/(?P<id>[0-9A-Z]+)_functional\.(?P<format>.+)$', functional_section_breakdown, name='functional_section_breakdown'),
    re_path(r'^secciones/(?P<id>[0-9A-Z]+)_economic\.(?P<format>.+)$', economic_section_breakdown, name='economic_section_breakdown'),

    # Investments
    re_path(r'^inversiones/(?P<slug>.+)_inversiones\.(?P<format>.+)$', entity_investments_breakdown, name='entity_investments_breakdown'),
    re_path(r'^inversiones/(?P<slug>.+)_inversiones_(?P<id>[0-9A-Z]+)\.(?P<format>.+)$', entity_investment_line_breakdown, name='entity_investment_line_breakdown'),

    # Main investments
    re_path(r'^inversiones-principales/(?P<slug>.+)_inversiones\.(?P<format>.+)$', entity_main_investments_breakdown, name='entity_main_investments_breakdown'),

    # Monitoring
    re_path(r'^politicas/(?P<id>.+)_objetivos\.(?P<format>.+)$', policy_monitoring_breakdown, name='policy_monitoring_breakdown'),
    re_path(r'^programas/(?P<id>.+)_objetivos\.(?P<format>.+)$', programme_monitoring_breakdown, name='programme_monitoring_breakdown'),

    # Entities lists
    re_path(r'^gastos_entidades_(?P<level>.+)\.(?P<format>.+)$', entities_expenses, name='entities_expenses'),
    re_path(r'^ingresos_entidades_(?P<level>.+)\.(?P<format>.+)$', entities_income, name='entities_income'),

    # Entity income/expenses
    re_path(r'^(?P<level>.+)_(?P<slug>.+)_gastos\.(?P<format>.+)$', entity_expenses, name='entity_expenses'),
    re_path(r'^(?P<level>.+)_(?P<slug>.+)_gastosf\.(?P<format>.+)$', entity_functional, name='entity_functional'),
    re_path(r'^(?P<level>.+)_(?P<slug>.+)_gastosi\.(?P<format>.+)$', entity_institutional, name='entity_institutional'),
    re_path(r'^(?P<level>.+)_(?P<slug>.+)_ingresos\.(?P<format>.+)$', entity_income, name='entity_income'),

    re_path(r'^(?P<level>.+)_(?P<slug>.+)_gastosf_(?P<id>[0-9]+)\.(?P<format>.+)$', entity_article_functional, name='entity_article_functional'),
    re_path(r'^(?P<level>.+)_(?P<slug>.+)_gastos_(?P<id>[0-9]+)\.(?P<format>.+)$', entity_article_expenses, name='entity_article_expenses'),
    re_path(r'^(?P<level>.+)_(?P<slug>.+)_ingresos_(?P<id>[0-9]+)\.(?P<format>.+)$', entity_article_income, name='entity_article_income'),

    # Payments
    re_path(r'^(?P<slug>.+)_pagos\.(?P<format>.+)$', entity_payments, name='entity_payments'),
])

# Add extra application paths, not i18n
budget_app_urlpatterns += [
    re_path(r'^version.json$', version_api),
    re_path(r'^sitemap\.xml$', sitemap),
    re_path(r'^robots\.txt$', lambda request: render(request, 'robots.txt', content_type='text/plain')),
]

# Add the theme URL patterns, if they exist, in front of the default app ones.
#
# We define the extra URLs in a separate `urls.py` file in the theme. We initially added them to `settings.py`,
# so we'd have `EXTRA_URLS` without additional imports, as part of the global settings. However, this resulted
# in circular dependencies when we tried to import the view objects that we need to reference during URL creation
# in modern Django versions. I.e. when we stopped passing the view name as a string. (#80)
try:
    import importlib
    theme_urls = importlib.import_module(settings.THEME+'.urls')
    urlpatterns = add_url_patterns(theme_urls.EXTRA_URLS) + budget_app_urlpatterns
except:
    urlpatterns = budget_app_urlpatterns
