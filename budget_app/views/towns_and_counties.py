# -*- coding: UTF-8 -*-

import json

from coffin.shortcuts import render_to_response
from budget_app.models import BudgetBreakdown, Entity
from entities import entities_index, entities_show
from helpers import *


def counties(request, render_callback=None):
    c = get_context(request, css_class='body-counties', title='Comarcas')
    return entities_index(request, c, 'comarca', render_callback)

def counties_show(request, county_slug, render_callback=None):
    county = _get_county(county_slug)
    return entities_show(request, _get_county_context(request, county), county, render_callback)

def counties_show_income(request, county_slug, id, render_callback=None):
    county = _get_county(county_slug)
    c = _get_county_context(request, county)
    return entities_show_article(request, c, county, id, '', 'income', render_callback)

def counties_show_expense(request, county_slug, id, render_callback=None):
    county = _get_county(county_slug)
    c = _get_county_context(request, county)
    return entities_show_article(request, c, county, id, '', 'expense', render_callback)

def counties_show_functional(request, county_slug, id, render_callback=None):
    county = _get_county(county_slug)
    c = _get_county_context(request, county)
    return entities_show_policy(request, c, county, id, '', render_callback)

def counties_compare(request, county_left_slug, county_right_slug):
    county_left = _get_county(county_left_slug)
    county_right = _get_county(county_right_slug)
    c = get_context(request, 
                    css_class='body-counties', 
                    title='Comparativa '+county_left.name+'/'+county_right.name+' - Comarcas')
    return entities_compare(request, c, county_left, county_right)

# Retrieve the entity to display from the given slug
def _get_county(slug):
    return Entity.objects.get(level='comarca', slug=slug)

# Get request context for a county page
def _get_county_context(request, county):
    c = get_context(request, css_class='body-entities', title=county.name +' - Comarcas')
    populate_entities(c, county.level)
    return c



def towns(request, render_callback=None):
    c = get_context(request, css_class='body-entities', title='Municipios')
    return entities_index(request, c, 'municipio', render_callback)

def towns_show(request, town_slug, render_callback=None):
    town = _get_town(town_slug)
    return entities_show(request, _get_town_context(request, town), town, render_callback)

def towns_show_income(request, town_slug, id, render_callback=None):
    town = _get_town(town_slug)
    c = _get_town_context(request, town)
    return entities_show_article(request, c, town, id, '', 'income', render_callback)

def towns_show_expense(request, town_slug, id, render_callback=None):
    town = _get_town(town_slug)
    c = _get_town_context(request, town)
    return entities_show_article(request, c, town, id, '', 'expense', render_callback)

def towns_show_functional(request, town_slug, id, render_callback=None):
    town = _get_town(town_slug)
    c = _get_town_context(request, town)
    return entities_show_policy(request, c, town, id, '', render_callback)

def towns_compare(request, town_left_slug, town_right_slug):
    town_left = _get_town(town_left_slug)
    town_right = _get_town(town_right_slug)
    c = get_context(request, 
                    css_class='body-entities', 
                    title='Comparativa '+town_left.name+'/'+town_right.name+' - Municipios')
    return entities_compare(request, c, town_left, town_right)

# Retrieve the entity to display from the given slug
def _get_town(slug):
    return Entity.objects.get(level='municipio', slug=slug)

# Get request context for a town page
def _get_town_context(request, town):
    c = get_context(request, css_class='body-entities', title=town.name +' - Municipios')
    populate_entities(c, town.level)
    return c



def entities_compare(request, c, entity_left, entity_right):
    c['entity_left'] = entity_left
    c['entity_right'] = entity_right

    # Get the budget breakdowns
    # XXX: No good functional data at this level so far
    # c['functional_breakdown_left'] = BudgetBreakdown(['policy'])
    c['economic_breakdown_left'] = BudgetBreakdown(['chapter', 'article'])
    get_budget_breakdown(   "e.name = %s and ec.chapter <> 'X'", [ entity_left.name ],
                            [ 
                                c['economic_breakdown_left'] 
                            ])

    c['economic_breakdown_right'] = BudgetBreakdown(['chapter', 'article'])
    get_budget_breakdown(   "e.name = %s and ec.chapter <> 'X'", [ entity_right.name ],
                            [ 
                                c['economic_breakdown_right'] 
                            ])

    # Additional data needed by the view
    populate_level(c, entity_left.level)
    populate_entity_stats(c, entity_left, 'stats_left')
    populate_entity_stats(c, entity_right, 'stats_right')
    populate_entity_descriptions(c, entity_left)
    populate_area_descriptions(c, ['income', 'expense'])
    populate_comparison_years(c, c['economic_breakdown_left'], c['economic_breakdown_right'])
    populate_entities(c, entity_left.level)

    return render_to_response('entities/compare.html', c)


# FIXME: from here below it's a big copy-paste from the policies view, should clean-up.
# Note that these methods below use the policies templates, so they really shouldn't be
# in this view, it's confusing. We should be calling methods in the Policies view,
# passing the entity object as argument. But not a priority now, see #105.
def entities_show_policy(request, c, entity, id, title, render_callback=None):
    # Get request context
    c = get_context(request, css_class='body-policies', title='')
    c['policy_uid'] = id

    # Get the budget breakdown
    c['breakdowns'] = {
      'functional': BudgetBreakdown(['function', 'programme']),
      'economic': BudgetBreakdown(['chapter', 'article', 'heading'])
    }
    get_budget_breakdown(   "fc.policy = %s and e.id = %s", [ id, entity.id ],
                            [ 
                                c['breakdowns']['functional'],
                                c['breakdowns']['economic']
                            ])

    # Additional data needed by the view
    show_side = 'expense'
    populate_level(c, entity.level)
    populate_entity_stats(c, entity)
    populate_entity_descriptions(c, entity, show_side)
    populate_years(c, c['breakdowns']['functional'])
    populate_budget_statuses(c, entity.id)
    populate_area_descriptions(c, ['functional', show_side])
    populate_csv_settings(c, 'policy', id)
    set_show_side(c, show_side)
    set_full_breakdown(c, False)
    c['entity'] = entity

    c['name'] = c['descriptions']['functional'].get(c['policy_uid'])
    c['title_prefix'] = c['name']

    return render(c, render_callback, 'policies/show.html')


# Prepare all data needed for an article breakdown page (i.e. economic dimension)
# XXX: As a workaround for the really spotty data we've got for small entities, this
# function can now also handle 'chapters'. This is needed because sometimes (no-XBRL data)
# that's the only data we have.
def entities_show_article(request, c, entity, id, title, show_side, render_callback=None):
    # Get request context
    c = get_context(request, css_class='body-policies', title='')
    c['article_id'] = id
    c['is_chapter'] = len(id) <= 1
    if c['is_chapter']:
        c['article'] = EconomicCategory.objects.filter( budget__entity=entity,
                                                        chapter=id, 
                                                        expense=(show_side=='expense'))[0]
    else:
        c['article'] = EconomicCategory.objects.filter( budget__entity=entity,
                                                        article=id, 
                                                        expense=(show_side=='expense'))[0]

    # Ignore if possible the descriptions for execution data, they are truncated and ugly
    article_descriptions = {}
    def _populate_article_descriptions(column_name, item):
        if not item.actual or not item.uid() in article_descriptions:
            article_descriptions[item.uid()] = getattr(item, 'description')

    # Get the budget breakdown.
    # The functional breakdown is an empty one because our small entity data is not fully broken.
    c['breakdowns'] = {
      'functional': None,
      'funding': BudgetBreakdown(['source', 'fund']) if c['show_funding_tab'] else None,
      'institutional': get_institutional_breakdown(c) if c['show_institutional_tab'] else None
    }
    if c['is_chapter']:
        # XXX: Some entities combine different levels of data detail along the years. Trying
        # to display detailed categories (articles, headings) looks bad on the visualization,
        # because some years just 'disappear'. So we take the 'safe route', just visualizing
        # the chapter total. We could try to be smarter here.
        c['breakdowns']['economic_breakdown'] = BudgetBreakdown(['chapter', 'article'])
        query = "ec.chapter = %s and e.id = %s"
    else:
        c['breakdowns']['economic_breakdown'] = BudgetBreakdown(['heading', 'uid'])
        query = "ec.article = %s and e.id = %s"
    get_budget_breakdown(   query, [ id, entity.id ],
                            [ 
                                c['breakdowns']['economic'],
                                c['breakdowns']['funding'],
                                c['breakdowns']['institutional']
                            ],
                            _populate_article_descriptions)

    # Note we don't modify the original descriptions, we're working on a copy (of the hash,
    # which is made of references to the hashes containing the descriptions themselves).
    # TODO: Review how we're handling descriptions here for smaller entities
    c['descriptions'] = Budget.objects.get_all_descriptions(entity).copy()
    article_descriptions.update(c['descriptions'][show_side])
    c['descriptions'][show_side] = article_descriptions
    c['name'] = c['descriptions'][show_side].get(c['article_id'])
    c['title_prefix'] = c['name'] + ' - ' + entity.name

    # Additional data needed by the view
    populate_level(c, entity.level)
    populate_entity_stats(c, entity)
    populate_years(c, c['breakdowns']['institutional'])
    populate_budget_statuses(c, entity.id)
    populate_area_descriptions(c, ['functional', 'funding', show_side])
    populate_csv_settings(c, 'article', id)
    set_show_side(c, show_side)
    set_full_breakdown(c, False)
    c['entity'] = entity

    return render(c, render_callback, 'policies/show.html')

