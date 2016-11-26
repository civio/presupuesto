# -*- coding: UTF-8 -*-
from coffin.shortcuts import render_to_response
from budget_app.models import BudgetBreakdown, Entity, EconomicCategory
from helpers import *

def entities_index(request, c, level, render_callback=None):
    # Get the budget breakdown
    c['economic_breakdown'] = BudgetBreakdown(['name'])
    # The top level entity has a nicely broken down budget, where each item is classified across
    # 4 dimensions. For smaller entities, however, we have two separate breakdowns as input,
    # that are loaded separately, with dummy values ('X') assigned to the three unknown dimensions. 
    # To avoid double counting, we must calculate breakdowns along a dimension including only
    # those items for which we know the category (i.e. not 'X')
    get_budget_breakdown(   "e.level = %s and ec.chapter <> 'X'", [ level ], 
                            [ 
                                c['economic_breakdown'] 
                            ])

    # Additional data needed by the view
    populate_level(c, level)
    populate_level_stats(c, level)
    populate_years(c, c['economic_breakdown'])
    populate_entities(c, level)

    # XXX: The percentage format in pages listing entities is tricky and confusing, partly because
    # we have many gaps in the data which vary each year, so I'm hiding the drop-down option for now.
    c['hide_percentage_format'] = True
    
    return render(c, render_callback, 'entities/index.html')


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
