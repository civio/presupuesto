# -*- coding: UTF-8 -*-
from budget_app.loaders import BaseLoader
from budget_app.models import *
from decimal import *
import csv
import os
import re

# Generic Monitoring loader
class MonitoringLoader(BaseLoader):

    def load(self, entity, year, path, status):
        # Find the budget the monitoring relates to
        budget = Budget.objects.filter(entity=entity, year=year)
        if not budget:
            raise Exception("Budget (%s/%s) not found" % (entity.name, year))
        else:
            budget = budget[0]

        # Delete previous monitoring data for the given budget if it exists
        Goal.objects.filter(budget=budget).delete()

        # Read the goals data
        goals = self.parse_items(os.path.join(path, 'indicadores.csv'), self.parse_goal)
        activities = self.parse_items(os.path.join(path, 'actividades.csv'), self.parse_activity)
        indicators = self.parse_items(os.path.join(path, 'indicadores.csv'), self.parse_indicator)   # FIXME: Should be separate file

        # Store the data in the database
        if len(goals) > 0:
            print u"Cargando objetivos e indicadores para entidad '%s' año %s..." % (entity.name, year)
            self.load_goals(budget, goals)
            self.load_activities(budget, activities)
            self.load_indicators(budget, indicators)


    def parse_items(self, filename, line_parser):
        items = []
        if os.path.isfile(filename):
            print "Leyendo datos de %s..." % filename
            reader = csv.reader(open(filename, 'rb'), delimiter=self._get_delimiter())
            for index, line in enumerate(reader):
                if re.match("^#", line[0]):         # Ignore comments
                    continue

                if re.match("^ +$", line[0]):       # Ignore empty lines
                    continue

                # Finally, we have useful data
                items.append(line_parser(filename, line))
        else:
            print "No se encontró el fichero %s" % filename

        return items


    # OVERRIDE THIS!
    # I don't think it's worth offering a base implementation, not at this point at least, since
    # every input data we get has a different structure, and there's value in keeping the CSV files
    # as close as possible to the original database, PDF, XLS, whatever.
    def parse_goal(self, filename, line):
        return {}

    def parse_activity(self, filename, line):
        return {}

    def parse_indicator(self, filename, line):
        return {}


    def load_goals(self, budget, goals):
        loaded_goals_uids = set()
        for goal in goals:
            if goal == None:    # Ignore null entries
                continue

            # Check for duplicates.
            # The Madrid data (the original implementation) comes in a denormalized file, together with the
            # indicators, so there are plenty of duplicates. It's easier to get rid of them at this point.
            if goal['uid'] in loaded_goals_uids:
                continue
            else:
                loaded_goals_uids.add(goal['uid'])

            # Fetch functional category (required)
            fc = FunctionalCategory.objects.filter(area=goal['fc_code'][0:1],
                                                    policy=goal['fc_code'][0:2],
                                                    function=goal['fc_code'][0:3],
                                                    programme=goal['fc_code'],
                                                    budget=budget)
            if not fc:
                print u"ALERTA: No se encuentra la categoría funcional '%s' para '%s'." % (goal['fc_code'], goal['description'])
                continue

            # Fetch institutional category, if available
            ic = InstitutionalCategory.objects.filter(institution=goal['ic_code'][0],
                                                        section=goal['ic_code'][0:2],
                                                        department=goal['ic_code'],
                                                        budget=budget)
            if not ic:
                print u"ALERTA: No se encuentra la categoría institutional '%s' para '%s'." % (goal['ic_code'], goal['description'])
                continue


            # Create the main investment record
            Goal(uid=goal['uid'],
                    functional_category=fc[0],
                    institutional_category=ic[0],
                    goal_number=goal['goal_number'],
                    description=goal['description'],
                    report=goal['report'],
                    budget=budget).save()


    def load_activities(self, budget, activities):
        for activity in activities:
            if activity == None:    # Ignore null entries
                continue

            # Fetch parent goal (required)
            goal = Goal.objects.filter(uid=activity['goal_uid'], budget=budget)
            if not goal:
                print u"ALERTA: No se encuentra el objetivo '%s' para la actividad '%s'." % (activity['goal_uid'], activity['description'])
                continue

            GoalActivity(activity_number=activity['activity_number'],
                            description=activity['description'],
                            goal=goal[0]).save()


    def load_indicators(self, budget, indicators):
        for indicator in indicators:
            if indicator == None:    # Ignore null entries
                continue

            # Fetch parent goal (required)
            goal = Goal.objects.filter(uid=indicator['goal_uid'], budget=budget)
            if not goal:
                print u"ALERTA: No se encuentra el objetivo '%s' para el indicador '%s'." % (indicator['goal_uid'], indicator['description'])
                continue

            GoalIndicator(indicator_number=indicator['indicator_number'],
                            description=indicator['description'],
                            unit=indicator['unit'],
                            target=indicator['target'],
                            actual=indicator['actual'],
                            score=indicator['score'],
                            goal=goal[0]).save()
