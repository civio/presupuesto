# -*- coding: UTF-8 -*-
import json

from django.core.urlresolvers import reverse

from budget_app.models import Budget, BudgetBreakdown, FunctionalCategory, EconomicCategory, Goal, GoalActivity, GoalIndicator
from helpers import *

def policies_show_helper(request, c, entity, id, title, render_callback=None):
    c['policy_uid'] = id

    # Get the budget breakdown
    c['breakdowns'] = {
      'functional': BudgetBreakdown(['programme']),
      'economic': BudgetBreakdown(['chapter', 'article', 'heading']),
      'funding': BudgetBreakdown(['source', 'fund']) if c['show_funding_tab'] else None,
      'institutional': get_institutional_breakdown(c) if c['show_institutional_tab'] else None
    }
    get_budget_breakdown(   "fc.policy = %s and e.id = %s", [ id, entity.id ],
                            [ 
                                c['breakdowns']['functional'],
                                c['breakdowns']['economic'],
                                c['breakdowns']['funding'],
                                c['breakdowns']['institutional']
                            ])

    # Add monitoring information, if needed
    if (c['show_monitoring']):
        c['monitoring_programmes'] = GoalIndicator.objects.get_monitoring_programmes(entity.id, id)

        monitoring_totals_per_programme = GoalIndicator.objects.get_indicators_summary_by_programme(entity.id, "policy", id)
        c['monitoring_totals_per_programme'] = dict((total[1], total) for total in monitoring_totals_per_programme)

        totals = GoalIndicator.objects.get_indicators_summary_by_policy(entity.id, id)
        c['monitoring_totals'] = dict((total[0], total[2]/total[3] if total[2]!=None else '') for total in totals)

    # Additional data needed by the view
    show_side = 'expense'
    populate_stats(c)
    populate_entity_descriptions(c, entity, show_side)
    populate_years(c, c['breakdowns']['functional'])
    populate_budget_statuses(c, entity.id)
    populate_area_descriptions(c, ['functional', 'funding', show_side])
    populate_csv_settings(c, 'policy', id)
    set_show_side(c, show_side)
    set_full_breakdown(c, True)
    set_starting_tab(c, 'functional')

    c['name'] = c['descriptions']['functional'].get(c['policy_uid'])
    c['title_prefix'] = c['name']

    # Back button: specify which tab in the main page to go to
    c['back_to_tab'] = 'functional'

    # if parameter widget defined use policies/widget template instead of policies/show
    template = 'policies/show_widget.html' if isWidget(request) else 'policies/show.html'

    return render(c, render_callback, template)


def programmes_show_helper(request, c, entity, id, title, render_callback=None):
    # Extra request context info
    c['programme_id'] = id
    programme = FunctionalCategory.objects.filter(budget__entity=entity,
                                                    programme=id,
                                                    subprogramme__isnull=True).first()
    c['policy'] = FunctionalCategory.objects.filter(budget__entity=entity,
                                                    policy=programme.policy,
                                                    function__isnull=True).first()

    # Ignore if possible the descriptions for execution data, they are truncated and ugly
    programme_descriptions = {}
    def _populate_programme_descriptions(column_name, item):
        item_uid = getattr(item, get_final_element_grouping(c))()
        if not item.actual or not item_uid in programme_descriptions:
            programme_descriptions[item_uid] = getattr(item, 'description')

    # Get the budget breakdown
    # The functional breakdown may or may not exist, depending on whether we are at deepest level,
    # i.e. depending on whether there are subprogrammes. The policy page will check whether
    # the breakdown exists and adapt accordingly.
    c['breakdowns'] = {
      'functional': BudgetBreakdown(['subprogramme']) if c['use_subprogrammes'] else None,
      'economic': BudgetBreakdown(['chapter', 'article', 'heading', get_final_element_grouping(c)]),
      'funding': BudgetBreakdown(['source', 'fund']) if c['show_funding_tab'] else None,
      'institutional': get_institutional_breakdown(c) if c['show_institutional_tab'] else None
    }
    get_budget_breakdown(   "fc.programme = %s and e.id = %s", [ id, entity.id ],
                            [
                                c['breakdowns']['functional'],
                                c['breakdowns']['economic'],
                                c['breakdowns']['funding'],
                                c['breakdowns']['institutional']
                            ],
                            _populate_programme_descriptions)

    # Note we don't modify the original descriptions, we're working on a copy (of the hash,
    # which is made of references to the hashes containing the descriptions themselves).
    c['descriptions'] = Budget.objects.get_all_descriptions(entity).copy()
    programme_descriptions.update(c['descriptions']['expense'])
    c['descriptions']['economic'] = programme_descriptions
    c['name'] = c['descriptions']['functional'].get(c['programme_id'])
    c['title_prefix'] = c['name']

    # Add monitoring information, if needed
    if (c['show_monitoring']):
        # Get raw monitoring data
        c['monitoring_goals'] = _group_by(Goal.objects.get_programme_goals(entity, id), lambda g: g.institutional_category_id)
        c['monitoring_activities'] = _group_by(GoalActivity.objects.get_programme_activities(entity, id), lambda a: a.goal.uid)
        c['monitoring_indicators'] = _group_by(GoalIndicator.objects.get_programme_indicators(entity, id), lambda i: i.goal.uid)

        # Get full list of sections with goals in the programme
        c['monitoring_sections'] = GoalIndicator.objects.get_monitoring_sections(entity.id, id)

        # Get progress totals. We can do it easily with SQL, instead of calculating it here.
        totals = GoalIndicator.objects.get_indicators_summary_by_programme(entity.id, "programme", id)
        c['monitoring_totals'] = dict((total[0], total[3]/total[4] if total[3]!=None else '') for total in totals)
        monitoring_totals_per_section = GoalIndicator.objects.get_indicators_summary_by_section(entity.id, id)
        c['monitoring_totals_per_section'] = dict((total[0], total) for total in monitoring_totals_per_section)

        # If there's only one section per year, display it extended
        c['expand_monitoring_sections'] = (len(c['monitoring_totals'])==len(c['monitoring_totals_per_section']))

    # Additional data needed by the view
    show_side = 'expense'
    populate_stats(c)
    populate_years(c, c['breakdowns']['economic'])
    populate_budget_statuses(c, entity.id)
    populate_area_descriptions(c, ['functional', 'funding', show_side])
    populate_csv_settings(c, 'programme', id)
    set_show_side(c, show_side)
    set_full_breakdown(c, True)
    set_starting_tab(c, 'functional' if c['use_subprogrammes'] else 'economic')

    # Back button: go back to parent policy
    if is_secondary_entity(c):
        back_url = reverse('entities_policies_show', args=[entity.code, programme.policy, c['policy'].slug()])
    else:
        back_url = reverse('policies_show', args=[programme.policy, c['policy'].slug()])

    c['back_button'] = {
        'url': back_url,
        'description': c['descriptions']['functional'].get(programme.policy)
    }

    # if parameter widget defined use policies/widget template instead of policies/show
    template = 'policies/show_widget.html' if isWidget(request) else 'policies/show.html'

    return render(c, render_callback, template)


def articles_show_helper(request, c, entity, id, title, show_side, render_callback=None):
    # Extra request context info
    c['article_id'] = id
    c['article'] = EconomicCategory.objects.filter( budget__entity=entity,
                                                    article=id, 
                                                    expense=(show_side=='expense')).first()

    # Ignore if possible the descriptions for execution data, they are truncated and ugly
    article_descriptions = {}
    def _populate_article_descriptions(column_name, item):
        item_uid = getattr(item, get_final_element_grouping(c))()
        if not item.actual or not item_uid in article_descriptions:
            article_descriptions[item_uid] = getattr(item, 'description')

    # Get the budget breakdown.
    # The functional one is used only when showing expenses.
    c['breakdowns'] = {
      'functional': BudgetBreakdown(['policy', 'programme']) if show_side=='expense' else None,
      'economic': BudgetBreakdown(['heading', get_final_element_grouping(c)]),
      'funding': BudgetBreakdown(['source', 'fund']) if c['show_funding_tab'] else None,
      'institutional': get_institutional_breakdown(c) if c['show_institutional_tab'] else None
    }
    get_budget_breakdown(   "ec.article = %s and e.id = %s and i.expense = %s",
                            [ id, entity.id, show_side=='expense' ],
                            [ 
                                c['breakdowns']['functional'],
                                c['breakdowns']['economic'],
                                c['breakdowns']['funding'],
                                c['breakdowns']['institutional']
                            ],
                            _populate_article_descriptions)

    # Note we don't modify the original descriptions, we're working on a copy (of the hash,
    # which is made of references to the hashes containing the descriptions themselves).
    c['descriptions'] = Budget.objects.get_all_descriptions(entity).copy()
    article_descriptions.update(c['descriptions'][show_side])
    c['descriptions']['economic'] = article_descriptions
    c['name'] = c['descriptions']['economic'].get(c['article_id'])
    c['title_prefix'] = c['name']

    # Additional data needed by the view
    populate_stats(c)
    populate_years(c, c['breakdowns']['economic'])
    populate_budget_statuses(c, entity.id)
    populate_area_descriptions(c, ['functional', 'funding', show_side])
    populate_csv_settings(c, 'article_revenues' if show_side=='income' else 'article_expenditures', id)
    set_show_side(c, show_side)
    set_full_breakdown(c, True)
    set_starting_tab(c, 'economic')

    # Back button: specify which tab in the main page to go to
    c['back_to_tab'] = show_side

    # if parameter widget defined use policies/widget template instead of policies/show
    template = 'policies/show_widget.html' if isWidget(request) else 'policies/show.html'

    return render(c, render_callback, template)


# Poor man's D3js' group method. Python's `groupby` is -confusingly- something else,
# more like an iterator, can't be accessed randomly, which is what we need in the template.
# See https://docs.python.org/3/library/itertools.html#itertools.groupby
def _group_by(items, key):
    groups = {}
    for item in items:
        values = groups.get(key(item), [])
        values.append(item)
        groups[key(item)] = values
    return groups
