# -*- coding: UTF-8 -*-
# Small utility functions shared by all views

import json
import os
import re

from contextlib import contextmanager
from coffin.shortcuts import render_to_response
from django.template import RequestContext
from django.conf import settings
from django.core import urlresolvers
from django.utils.translation import ugettext as _

from project.settings import ROOT_PATH

from budget_app.models import Budget, BudgetBreakdown, BudgetItem, InflationStat, PopulationStat, Entity

TABS = {
    'general': r'^budgets.*',
    'policies': r'^policies.*',
    'payments': r'^payments.*',
    'calculator': r'^tax-receipt.*',
    'glossary': r'^glossary.*'
}

#
# FILLING REQUEST CONTEXT
#

def get_context(request, css_class='', title=''):
    c = RequestContext(request)
    c['page_css_class'] = css_class
    c['title_prefix'] = title

    # Global settings
    c['show_institutional_tab'] = not hasattr(settings, 'SHOW_INSTITUTIONAL_TAB') or settings.SHOW_INSTITUTIONAL_TAB
    c['show_global_institutional_treemap'] = hasattr(settings, 'SHOW_GLOBAL_INSTITUTIONAL_TREEMAP') and settings.SHOW_GLOBAL_INSTITUTIONAL_TREEMAP
    c['show_funding_tab'] = hasattr(settings, 'SHOW_FUNDING_TAB') and settings.SHOW_FUNDING_TAB
    c['show_actual'] = not hasattr(settings, 'SHOW_ACTUAL') or settings.SHOW_ACTUAL
    c['show_breadcrumbs'] = hasattr(settings, 'SHOW_BREADCRUMBS') and settings.SHOW_BREADCRUMBS
    c['use_subprogrammes'] = hasattr(settings, 'USE_SUBPROGRAMMES') and settings.USE_SUBPROGRAMMES
    c['include_financial_chapters'] = hasattr(settings, 'INCLUDE_FINANCIAL_CHAPTERS_IN_BREAKDOWNS') and settings.INCLUDE_FINANCIAL_CHAPTERS_IN_BREAKDOWNS
    c['add_economic_categories_prefix'] = hasattr(settings, 'ADD_ECONOMIC_CATEGORIES_PREFIX') and settings.ADD_ECONOMIC_CATEGORIES_PREFIX

    c['color_scale'] = getattr(settings, 'COLOR_SCALE', [])

    c['treemap_labels_min_size'] = 30
    if hasattr(settings, 'TREEMAP_LABELS_MIN_SIZE'):
        c['treemap_labels_min_size'] = settings.TREEMAP_LABELS_MIN_SIZE

    c['treemap_labels_font_size_min'] = 11
    if hasattr(settings, 'TREEMAP_LABELS_FONT_SIZE_MIN'):
        c['treemap_labels_font_size_min'] = settings.TREEMAP_LABELS_FONT_SIZE_MIN

    c['treemap_global_max_value'] = not hasattr(settings, 'TREEMAP_GLOBAL_MAX_VALUE') or settings.TREEMAP_GLOBAL_MAX_VALUE

    try:
        c['active_tab'] = filter(
            lambda k: current_url_equals(c, TABS[k]),
            TABS.keys()
        )[0]
    except:
        c['active_tab'] = None

    return c


def current_url_equals(context, url_name_pattern, **kwargs):
    try:
        resolved = urlresolvers.resolve(context.get('request').path)
    except:
        resolved = None
    matches = resolved and re.match(url_name_pattern, resolved.url_name)
    if matches and kwargs:
        for key in kwargs:
            kwarg = kwargs.get(key)
            resolved_kwarg = resolved.kwargs.get(key)
            if not resolved_kwarg or kwarg != resolved_kwarg:
                return False
    return matches

def set_title(c, title):
    c['title_prefix'] = title

# This assumes there is only one of the MAIN_ENTITY_LEVEL, which is good enough for now
def get_main_entity(c):
    return Entity.objects.filter(level=settings.MAIN_ENTITY_LEVEL, language=c['LANGUAGE_CODE'])[0]

def populate_stats(c):  # Convenience: assume it's top level entity
    populate_entity_stats(c, get_main_entity(c))

def populate_entity_stats(c, entity, stats_name='stats'):
    c[stats_name] = json.dumps({
        'inflation': InflationStat.objects.get_table(),
        'population': PopulationStat.objects.get_entity_table(entity)
    })
    c['last_inflation_year'] = InflationStat.objects.get_last_year()

def populate_level_stats(c, level):
    c['stats'] = json.dumps({
        'inflation': InflationStat.objects.get_table(),
        'population': PopulationStat.objects.get_level_table(level)
    })
    c['last_inflation_year'] = InflationStat.objects.get_last_year()

# Assumes we're dealing with the top-level entity here
# TODO: Don't like this method, should get rid of it
def populate_descriptions(c):
    c['descriptions'] = Budget.objects.get_all_descriptions(get_main_entity(c))

def populate_entity_descriptions(c, entity, show_side=None):
    c['descriptions'] = Budget.objects.get_all_descriptions(entity)
    # For convenience, after populating the descriptions, set also an 'alias'
    # from 'economic' to the right income/expense descriptions, which simplifies the code
    c['descriptions']['economic'] = c['descriptions'][show_side] if show_side else None

def populate_years(c, breakdown):
    years = sorted(list(set(breakdown.years.values())))
    c['years'] = json.dumps([str(year) for year in years])
    c['show_treemap'] = ( len(years) == 1 )     # TODO: Should be done by Javascript

    # Set the starting year for the year slider.
    # We try to set it to the year of the latest non-draft budget, but we need to be
    # careful, as there's no guarantee there'll be data for that year. In those
    # cases revert to the safe fall-back: pick the latest year in the data.
    latest_budget = populate_latest_budget(c)
    c['starting_year'] = latest_budget.year if latest_budget.year in years else years[-1]

def populate_comparison_years(c, breakdown_left, breakdown_right):
    years = sorted(list(set(breakdown_left.years.values() + breakdown_right.years.values())))
    c['years'] = json.dumps([str(year) for year in years])
    c['starting_year'] = years[-1]

def populate_budget_statuses(c, entity_id):
    c['budget_statuses'] = json.dumps(Budget.objects.get_statuses(entity_id))

def populate_latest_budget(c):
    c['latest_budget'] = Budget.objects.latest(get_main_entity(c).id)
    return c['latest_budget']

def populate_level(c, level):
    c['level'] = level
    c['is_county'] = (level=='comarca')
    c['show_entity_url'] = 'budget_app.views.counties_show' if (level=='comarca') else 'budget_app.views.towns_show'

def populate_entities(c, level):
    c['entities'] = Entity.objects.entities(level)
    c['entities_json'] = json.dumps(Entity.objects.get_entities_table(level))


#
# POLICIES TEMPLATE - variables and flags driving the template
#


# Should we group elements at the economic subheading level, or list all of them?
# By default, and traditionally, we showed all of them, but in big administrations
# this results in lists of items with identical names, because they belong to different
# departments (see #135). In those cases we can group at the subheading level, but beware,
# make sure subheadings are consistent across departments (not the case for PGE, f.ex.).
def get_final_element_grouping(c):
    if hasattr(settings, 'BREAKDOWN_BY_UID') and settings.BREAKDOWN_BY_UID==False:
        return 'economic_uid'
    else:
        return 'uid'

def populate_csv_settings(c, type, id):
    c['csv_type'] = type
    c['csv_id'] = id

def _get_tab_titles(show_side):
    if show_side == 'income':
        return {
            'economic': u"¿Cómo se ingresa?",
            'funding': u"Tipo de ingresos",
            'institutional': u"¿Quién recauda?"
        }
    else:
        return {
            'functional': u"¿En qué se gasta?",
            'economic': u"¿Cómo se gasta?",
            'funding': u"¿Cómo se financia?",
            'institutional': u"¿Quién lo gasta?"
        }

def set_show_side(c, side):
    c['show_side'] = side
    c['tab_titles'] = _get_tab_titles(side)

# Do we have an exhaustive budget, classified along four dimensions? I.e. display all tabs?
def set_full_breakdown(c, full_breakdown):
    c['full_breakdown'] = full_breakdown

def set_starting_tab(c, tab):
    c['starting_tab'] = tab;

# Get widget parameter
def isWidget(request):
    return request.GET.get('widget',False)


#
# FORMATTING
#
# TODO: Is there a core Django/Python replacement for this?
# TODO: We shouldn't hardcode the thousand separator symbol, should depend on locale
def add_thousands_separator(number):
    s = '%d' % number
    groups = []
    while s and s[-1].isdigit():
        groups.append(s[-3:])
        s = s[:-3]
    return s + '.'.join(reversed(groups))


#
# TOP AREA DESCRIPTIONS
#

# Retrieve the descriptions for the top level categories, used by visualizations, in JSON
def _get_area_descriptions(descriptions, category):
    areas = {}
    for i in range(10):  # 0..9
        areas[str(i)] = descriptions[category].get(str(i))
    return json.dumps(areas)

# Top level categories descriptions, for visualizations
def populate_area_descriptions(c, areas):
    for area in areas:
        c[area+'_areas'] = _get_area_descriptions(c['descriptions'], area)


#
# BUDGET BREAKDOWNS
#

# Get the breakdown column name given a year and actual/budget
def year_column_name(item):
    if item.actual:
        return 'actual_' + str(getattr(item, 'year'))
    else:
        return str(getattr(item, 'year'))

# Iterate over a set of budget items and calculate a series of breakdowns
def get_budget_breakdown(condition, condition_arguments, breakdowns, callback=None):
    for item in BudgetItem.objects.each_denormalized(condition, condition_arguments):
        column_name = year_column_name(item)
        for breakdown in breakdowns:
            if breakdown != None:
                breakdown.add_item(column_name, item)
        if callback:
            callback(column_name, item)

# Auxiliary callback to distinguish financial and non-financial spending
def get_financial_breakdown_callback(c, breakdowns):
    def callback(column_name, item):
        if not c['include_financial_chapters'] and item.is_financial() and item.expense:
            c['breakdowns']['financial_expense'].add_item(column_name, item)
        else:
            for breakdown in breakdowns:
                if breakdown != None:
                    breakdown.add_item(column_name, item)
    return callback

# Return an institutional breakdown, taking into account whether or not codes are consistent
# along the years: if they are not, i.e. if they change over the years, we need to tag them
# with the year so they're unique along time, not only inside a given budget.
def _get_year_tagged_institution(item):
    # We put the year at the end to be able to access the original code from the visualizations
    return getattr(item, 'institution') + '/' + str(getattr(item, 'year'))

def _get_year_tagged_department(item):
    # We put the year at the end to be able to access the original code from the visualizations
    return getattr(item, 'department') + '/' + str(getattr(item, 'year'))

def get_institutional_breakdown(c):
    consistent_institutional_codes = hasattr(settings, 'CONSISTENT_INSTITUTIONAL_CODES') and settings.CONSISTENT_INSTITUTIONAL_CODES
    if consistent_institutional_codes:
        return BudgetBreakdown(['institution', 'department'])
    else:
        return BudgetBreakdown([_get_year_tagged_institution, _get_year_tagged_department])


#
# META FIELDS
#

# Set metadata fields before response is returned.
# Themes can override this method if needed (e.g. see #469)
def _set_meta_fields(c):
    c['meta_title'] = _(u'Presupuestos del Gobierno de Aragón')
    if c['title_prefix']:
        c['meta_title'] = c['title_prefix'] + ' - ' + c['meta_title']

    c['meta_description'] = _(u'Información presupuestaria del Gobierno de Aragón')
    c['meta_keywords'] = _('presupuestos, gastos, ingresos') + ', ' + _(u'Gobierno de Aragón')

    c['meta_og_title'] = c['meta_title']
    c['meta_og_description'] = c['meta_description']

    c['meta_tweet_text'] = c['meta_title']


#
# RENDER RESPONSE
#

# Wrapper around render_to_response, useful to hold code to be called for all responses
def render_response(template_name, c):
    _set_meta_fields(c)

    return render_to_response(template_name, c)

# Check whether a callback is provided and, based on that, render HTML or call back.
def render(c, render_callback, template_name):
    if not render_callback:
        return render_response(template_name, c)
    else:
        return render_callback.generate_response(c)
