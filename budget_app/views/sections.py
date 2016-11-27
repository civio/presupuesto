# -*- coding: UTF-8 -*-
from coffin.shortcuts import render_to_response
from budget_app.models import Budget, BudgetBreakdown, InstitutionalCategory
from helpers import *
import json


# XXX: This view only makes sense -and works- if institutional codes remain constant 
# across years, i.e. if the flag CONSISTENT_INSTITUTIONAL_CODES is enabled.
def sections_show(request, id, title, render_callback=None):
    # Get request context
    c = get_context(request, css_class='body-policies body-sections', title='')

    # Retrieve the entity to display
    main_entity = get_main_entity(c)

    # Extra request context info
    c['section_id'] = id
    c['section'] = InstitutionalCategory.objects.filter(  budget__entity=main_entity, 
                                                          department=id)[0]

    # Ignore if possible the descriptions for execution data, they are truncated and ugly
    programme_descriptions = {}
    def _populate_programme_descriptions(column_name, item):
        item_uid = getattr(item, get_final_element_grouping(c))()
        if not item.actual or not item_uid in programme_descriptions:
            programme_descriptions[item_uid] = getattr(item, 'description')

    # Get the budget breakdown
    c['breakdowns'] = {
      'functional': BudgetBreakdown(['policy', 'programme']),
      'economic': BudgetBreakdown(['chapter', 'article', 'heading', get_final_element_grouping(c)]),
      'institutional': None
    }
    get_budget_breakdown(   "ic.department = %s and e.id = %s", [ id, main_entity.id ],
                            [ 
                                c['breakdowns']['functional'],
                                c['breakdowns']['economic'],
                            ],
                            _populate_programme_descriptions)

    # Note we don't modify the original descriptions, we're working on a copy (of the hash,
    # which is made of references to the hashes containing the descriptions themselves).
    c['descriptions'] = Budget.objects.get_all_descriptions(main_entity).copy()
    programme_descriptions.update(c['descriptions']['expense'])
    c['descriptions']['economic'] = programme_descriptions
    c['name'] = c['descriptions']['institutional'].get(c['section_id'])
    c['title_prefix'] = c['name']

    # Additional data needed by the view
    show_side = 'expense'
    populate_stats(c)
    populate_years(c, c['breakdowns']['economic'])
    populate_budget_statuses(c, main_entity.id)
    populate_area_descriptions(c, ['functional', show_side])
    populate_csv_settings(c, 'section', id)
    set_show_side(c, show_side)
    set_full_breakdown(c, True)
    set_starting_tab(c, 'functional')

    # if parameter widget defined use policies/widget template instead of policies/show
    template = 'policies/show_widget.html' if isWidget(request) else 'policies/show.html'

    return render(c, render_callback, template )
