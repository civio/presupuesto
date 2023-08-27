# -*- coding: UTF-8 -*-

from django.core.urlresolvers import reverse
from django.utils import translation

from project.settings import LANGUAGES

from budget_app.models import FunctionalCategory, EconomicCategory
from helpers import *

def add_sitemap_entry(c, location, priority=0.5):
  absolute_uri = c['request'].build_absolute_uri(location)
  c['urlset'].append({ 'location': absolute_uri, 'priority': priority })

def sitemap(request):
  c = get_context(request)
  c['urlset'] = []

  # Add site root. This may not be necessary, but just in case
  add_sitemap_entry(c, '/', 0.8)

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
    add_sitemap_entry(c, reverse('welcome'), 0.8)
    add_sitemap_entry(c, reverse('budgets'), 0.8)
    add_sitemap_entry(c, reverse('policies'), 0.8)
    add_sitemap_entry(c, reverse('glossary'), 0.8)
    if c['show_tax_receipt']:
      add_sitemap_entry(c, reverse('tax-receipt'), 0.8)
    if c['show_payments']:
      add_sitemap_entry(c, reverse('payments'), 0.8)

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
        add_sitemap_entry(c, reverse(view_name, kwargs={ 'id': fc.uid(), 'title': fc.slug() }))

    # Add economic pages for articles
    # We do so only for the ones in the latest budget, which is good enough and way simpler.
    economic_categories = EconomicCategory.objects.filter(budget_id=latest_budget.id, article__isnull=False, heading__isnull=True)
    for ec in economic_categories:
      if ec.expense:
        view_name = 'expense_articles_show'
      else:
        view_name = 'income_articles_show'

      add_sitemap_entry(c, reverse(view_name, kwargs={ 'id': ec.uid(), 'title': ec.slug() }))

  return render_to_response('sitemap.xml', c, content_type='text/xml')
