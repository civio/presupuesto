# -*- coding: UTF-8 -*-

from budget_app.models import BudgetBreakdown, Entity, EconomicCategory
from policies_helpers import policies_show_helper, programmes_show_helper, articles_show_helper
from payments import payments_helper, payment_search_helper
from helpers import *

def entities_policies(request, id, render_callback=None):
    c = get_context(request, css_class='body-entities', title='')
    entity = _fetch_entity(c, id)
    return entities_show_helper(request, c, entity, render_callback)


def entities_show_helper(request, c, entity, render_callback=None):
    # Prepare the budget breakdowns
    c['breakdowns'] = {
        'financial_expense': BudgetBreakdown(),
        'functional': BudgetBreakdown(['policy', 'programme']),
        'institutional': get_institutional_breakdown(c) if c['show_global_institutional_treemap'] else None
    }
    if entity.level == settings.MAIN_ENTITY_LEVEL:
        c['breakdowns']['economic'] = BudgetBreakdown(['article', 'heading'])

        # We assume here that all items are properly configured across all dimensions
        # (and why wouldn't they? see below). Note that this is a particular case of the
        # more complex logic below for small entities, and I used for a while the more 
        # general code for all scenarios, until I realised performance was much worse,
        # as we do two expensive denormalize-the-whole-db queries!
        get_budget_breakdown(   "e.id = %s", [ entity.id ],
                                [c['breakdowns']['economic']],
                                get_financial_breakdown_callback(c, \
                                    [c['breakdowns']['functional'], \
                                    c['breakdowns']['institutional']]) )
    else:
        # Small entities have a varying level of detail: often we don't have any breakdown below
        # chapter, so we have to start there. Also, to be honest, the heading level doesn't add
        # much to what you get with articles.
        c['breakdowns']['economic'] = BudgetBreakdown(['chapter', 'article'])

        # For small entities we sometimes have separate functional and economic breakdowns as
        # input, so we can't just get all the items and add them up, as we would double count
        # the amounts.
        get_budget_breakdown(   "e.id = %s and fc.area <> 'X'", [ entity.id ],
                                [],
                                get_financial_breakdown_callback(c, \
                                    [c['breakdowns']['functional'], \
                                    c['breakdowns']['institutional']]) )
        get_budget_breakdown(   "e.id = %s and ec.chapter <> 'X'", [ entity.id ],
                                [ c['breakdowns']['economic'] ] )

    # Additional data needed by the view
    populate_level(c, entity.level)
    populate_entity_stats(c, entity)
    # TODO: We're doing this also for Aragon, check performance!
    populate_entity_descriptions(c, entity)
    populate_years(c, c['breakdowns']['economic'])
    populate_budget_statuses(c, entity.id)
    populate_area_descriptions(c, ['functional', 'income', 'expense', 'institutional'])
    set_full_breakdown(c, entity.level == settings.MAIN_ENTITY_LEVEL)
    c['entity'] = entity

    # if parameter widget defined use policies/widget template instead of policies/show
    template = 'entities/show_widget.html' if isWidget(request) else 'entities/show.html'

    return render(c, render_callback, template)


def entities_policies_show(request, id, policy_id, title, render_callback=None):
    c = get_context(request, css_class='body-entities body-policies', title='')
    entity = _fetch_entity(c, id)
    return policies_show_helper(request, c, entity, policy_id, title, render_callback)


# XXX: This function only exists so the Javascript at policy_paths.html
# can build the full URL. Doesn't get called.
def entities_programmes(request, id, render_callback=None):
    return entities_policies(request, id, render_callback)

def entities_programmes_show(request, id, programme_id, title, render_callback=None):
    c = get_context(request, css_class='body-entities body-policies body-programmes', title='')
    entity = _fetch_entity(c, id)
    return programmes_show_helper(request, c, entity, programme_id, title, render_callback)


# XXX: This function only exists so the Javascript at policy_paths.html
# can build the full URL. Doesn't get called.
def entities_income_articles(request, id, render_callback=None):
    return entities_policies(request, id, render_callback)

def entities_expense_articles(request, id, render_callback=None):
    return entities_policies(request, id, render_callback)

def entities_income_articles_show(request, id, article_id, title, render_callback=None):
    c = get_context(request, css_class='body-entities body-articles', title='')
    entity = _fetch_entity(c, id)
    return articles_show_helper(request, c, entity, article_id, title, 'income', render_callback)

def entities_expense_articles_show(request, id, article_id, title, render_callback=None):
    c = get_context(request, css_class='body-entities body-articles', title='')
    entity = _fetch_entity(c, id)
    return articles_show_helper(request, c, entity, article_id, title, 'expense', render_callback)


def entities_payments(request, id, render_callback=None):
    c = get_context(request, css_class='body-payments', title='')
    entity = _fetch_entity(c, id)
    return payments_helper(request, c, entity, render_callback)

def entities_payments_search(request, id, render_callback=None):
    c = get_context(request)
    entity = _fetch_entity(c, id)
    return payment_search_helper(request, c, entity, render_callback)


def _fetch_entity(c, id):
    # Retrieve the entity to display
    entity = Entity.objects.filter(code=id).first()
    set_title(c, entity.name)

    # Set the entity id and name
    # is_secondary_entity is only set when accessing the URL for a particular entity,
    # (that is, in a context with multiple entities), not when accessing the main
    # policies page. See #105.
    # XXX: Would it make sense to have this as a setting for the whole site (replacing
    # maybe the too-specific SEARCH_ENTITIES)? I.e. do we need to support an scenario where
    # the entity name is shown for child entities but not the default? For PGE maybe?
    # If not, we could even set this automatically based on whether there're multiple
    # entities in the database for a given language.
    set_entity(c, entity, is_secondary_entity=True)

    return entity