# -*- coding: UTF-8 -*-
from coffin.shortcuts import render_to_response
from budget_app.models import BudgetBreakdown, Entity, EconomicCategory
from helpers import *

def entities_show(request, c, entity, render_callback=None):
    # Prepare the budget breakdowns
    c['financial_expense_breakdown'] = BudgetBreakdown()
    c['functional_breakdown'] = BudgetBreakdown(['policy', 'programme'])
    c['institutional_breakdown'] = get_institutional_breakdown(c) if c['show_global_institutional_treemap'] else None
    if entity.level == settings.MAIN_ENTITY_LEVEL:
        c['economic_breakdown'] = BudgetBreakdown(['article', 'heading'])

        # We assume here that all items are properly configured across all dimensions
        # (and why wouldn't they? see below). Note that this is a particular case of the
        # more complex logic below for small entities, and I used for a while the more 
        # general code for all scenarios, until I realised performance was much worse,
        # as we do two expensive denormalize-the-whole-db queries!
        get_budget_breakdown(   "e.id = %s", [ entity.id ],
                                [c['economic_breakdown']],
                                get_financial_breakdown_callback(c, [c['functional_breakdown'], c['institutional_breakdown']]) )
    else:
        # Small entities have a varying level of detail: often we don't have any breakdown below
        # chapter, so we have to start there. Also, to be honest, the heading level doesn't add
        # much to what you get with articles.
        c['economic_breakdown'] = BudgetBreakdown(['chapter', 'article'])

        # For small entities we sometimes have separate functional and economic breakdowns as
        # input, so we can't just get all the items and add them up, as we would double count
        # the amounts.
        get_budget_breakdown(   "e.id = %s and fc.area <> 'X'", [ entity.id ],
                                [],
                                get_financial_breakdown_callback(c, [c['functional_breakdown'], c['institutional_breakdown']]) )
        get_budget_breakdown(   "e.id = %s and ec.chapter <> 'X'", [ entity.id ],
                                [ c['economic_breakdown'] ] )

    # Additional data needed by the view
    populate_level(c, entity.level)
    populate_entity_stats(c, entity)
    # TODO: We're doing this also for Aragon, check performance!
    populate_entity_descriptions(c, entity)
    populate_years(c, c['economic_breakdown'])
    populate_budget_statuses(c, entity.id)
    populate_area_descriptions(c, ['functional', 'income', 'expense', 'institutional'])
    set_full_breakdown(c, entity.level == settings.MAIN_ENTITY_LEVEL)
    c['entity'] = entity

    # if parameter widget defined use policies/widget template instead of policies/show
    template = 'entities/show_widget.html' if isWidget(request) else 'entities/show.html'

    return render(c, render_callback, template)
