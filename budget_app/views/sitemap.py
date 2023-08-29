# -*- coding: UTF-8 -*-

from django.urls import reverse
from django.utils import translation

from project.settings import LANGUAGES

from budget_app.models import FunctionalCategory, EconomicCategory
from budget_app.context_processors import show_options_processor
from helpers import *

def add_sitemap_entry(request, c, location, priority=0.5):
  absolute_uri = request.build_absolute_uri(location)
  c['urlset'].append({ 'location': absolute_uri, 'priority': priority })

def sitemap(request):
  c = get_context(request)
  c['urlset'] = []

  # Add site root. This may not be necessary, but just in case
  add_sitemap_entry(request, c, '/', 0.8)

  # We need some settings read by the context processors, but in Django 1.8+,
  # using django-jinja, context processors are run AFAIK **after** the view is done,
  # so we call the one we need explicitely, an OK-ish workaround.
  c.update(show_options_processor(request))

  # Add all the URLs for all available languages
  for language in LANGUAGES:
    # Set the language so generated absolute URIs have the right language prefix.
    # See https://stackoverflow.com/a/17351858
    translation.activate(language[0])

    # Retrieve the latest budget for the main entity for the current language
    c['LANGUAGE_CODE'] = language[0]
    latest_budget = populate_latest_budget(c)

    # Add static pages.
    # We add a higher priority because it sounds right to give them higher weight.
    add_sitemap_entry(request, c, reverse('welcome'), 0.8)
    add_sitemap_entry(request, c, reverse('budgets'), 0.8)
    add_sitemap_entry(request, c, reverse('policies'), 0.8)
    add_sitemap_entry(request, c, reverse('glossary'), 0.8)
    if c['show_tax_receipt']:
      add_sitemap_entry(request, c, reverse('tax-receipt'), 0.8)
    if c['show_payments']:
      add_sitemap_entry(request, c, reverse('payments'), 0.8)

    # Add functional pages for policies, programmes and subprogrammes.
    # We do so only for the ones in the latest budget, which is good enough and way simpler.
    functional_categories = FunctionalCategory.objects.filter(budget_id=latest_budget.id).exclude(area='X')
    for fc in functional_categories:
      if fc.subprogramme!=None:
        view_name = 'subprogrammes_show'
      elif fc.programme!=None:
        view_name = 'programmes_show'
      elif (fc.function==None and fc.policy!=None):
        view_name = 'policies_show'
      else:
        view_name = None

      if view_name != None:
        add_sitemap_entry(request, c, reverse(view_name, kwargs={ 'id': fc.uid(), 'title': fc.slug() }))

    # Add economic pages for articles
    # We do so only for the ones in the latest budget, which is good enough and way simpler.
    economic_categories = EconomicCategory.objects.filter(budget_id=latest_budget.id, article__isnull=False, heading__isnull=True)
    for ec in economic_categories:
      if ec.expense:
        view_name = 'expense_articles_show'
      else:
        view_name = 'income_articles_show'

      add_sitemap_entry(request, c, reverse(view_name, kwargs={ 'id': ec.uid(), 'title': ec.slug() }))

  return render_response('sitemap.xml', c, content_type='application/xml; charset=utf-8')
