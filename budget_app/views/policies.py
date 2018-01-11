# -*- coding: UTF-8 -*-

from django.core.urlresolvers import reverse
from budget_app.models import Budget, BudgetBreakdown, FunctionalCategory, EconomicCategory
from entities import entities_show_helper
from policies_helpers import policies_show_helper, programmes_show_helper, articles_show_helper
from helpers import *
import json


def policies(request, render_callback=None):
    # Get request context
    c = get_context(request, css_class='body-entities', title='')

    # Retrieve the entity to display
    main_entity = get_main_entity(c)
    set_title(c, main_entity.name)

    return entities_show_helper(request, c, main_entity, render_callback)


def policies_show(request, id, title, render_callback=None):
    c = get_context(request, css_class='body-policies', title='')
    main_entity = get_main_entity(c)
    return policies_show_helper(request, c, main_entity, id, title, render_callback)


def programmes_show(request, id, title, render_callback=None):
    c = get_context(request, css_class='body-policies body-programmes', title='')
    main_entity = get_main_entity(c)
    return programmes_show_helper(request, c, main_entity, id, title, render_callback)


# FIXME: This is just like the programme function above. Should refactor common parts
def subprogrammes_show(request, id, title, render_callback=None):
    # Get request context
    c = get_context(request, css_class='body-policies body-subprogrammes', title='')

    # Retrieve the entity to display
    main_entity = get_main_entity(c)

    # Extra request context info
    c['subprogramme_id'] = id
    subprogramme = FunctionalCategory.objects.filter(budget__entity=main_entity,
                                                        subprogramme=id)[0]
    c['programme'] = FunctionalCategory.objects.filter(budget__entity=main_entity,
                                                        programme=subprogramme.programme,
                                                        subprogramme__isnull=True)[0]
    # The policy object is needed for the breadcrumb only
    c['policy'] = FunctionalCategory.objects.filter(budget__entity=main_entity,
                                                    policy=subprogramme.policy,
                                                    programme__isnull=True)[0]

    # Ignore if possible the descriptions for execution data, they are truncated and ugly
    programme_descriptions = {}
    def _populate_programme_descriptions(column_name, item):
        item_uid = getattr(item, get_final_element_grouping(c))()
        if not item.actual or not item_uid in programme_descriptions:
            programme_descriptions[item_uid] = getattr(item, 'description')

    # Get the budget breakdown
    c['breakdowns'] = {
      'economic': BudgetBreakdown(['chapter', 'article', 'heading', get_final_element_grouping(c)]),
      'funding': BudgetBreakdown(['source', 'fund']) if c['show_funding_tab'] else None,
      'institutional': get_institutional_breakdown(c) if c['show_institutional_tab'] else None
    }
    get_budget_breakdown(   "fc.subprogramme = %s and e.id = %s", [ id, main_entity.id ],
                            [ 
                                c['breakdowns']['economic'],
                                c['breakdowns']['funding'],
                                c['breakdowns']['institutional']
                            ],
                            _populate_programme_descriptions)

    # Note we don't modify the original descriptions, we're working on a copy (of the hash,
    # which is made of references to the hashes containing the descriptions themselves).
    c['descriptions'] = Budget.objects.get_all_descriptions(main_entity).copy()
    programme_descriptions.update(c['descriptions']['expense'])
    c['descriptions']['economic'] = programme_descriptions
    c['name'] = c['descriptions']['functional'].get(c['subprogramme_id'])
    c['title_prefix'] = c['name']

    # Additional data needed by the view
    show_side = 'expense'
    populate_stats(c)
    populate_years(c, c['breakdowns']['economic'])
    populate_budget_statuses(c, main_entity.id)
    populate_area_descriptions(c, ['functional', 'funding', show_side])
    populate_csv_settings(c, 'subprogramme', id)
    set_show_side(c, show_side)
    set_full_breakdown(c, True)
    set_starting_tab(c, 'economic')

    # Back button: go back to parent programme
    c['back_button'] = {
        'url': reverse('budget_app.views.programmes_show', args=[subprogramme.programme, c['programme'].slug()]),
        'description': c['descriptions']['functional'].get(subprogramme.programme)
    }

    # if parameter widget defined use policies/widget template instead of policies/show
    template = 'policies/show_widget.html' if isWidget(request) else 'policies/show.html'

    return render(c, render_callback, template )


def income_articles_show(request, id, title, render_callback=None):
    c = get_context(request, css_class='body-policies body-articles', title='')
    main_entity = get_main_entity(c)
    return articles_show_helper(request, c, main_entity, id, title, 'income', render_callback)

def expense_articles_show(request, id, title, render_callback=None):
    c = get_context(request, css_class='body-policies body-articles', title='')
    main_entity = get_main_entity(c)
    return articles_show_helper(request, c, main_entity, id, title, 'expense', render_callback)
