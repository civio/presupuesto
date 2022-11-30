from django.template.defaultfilters import slugify
from django.db import models
from django.conf import settings


class GoalsManager(models.Manager):
    def get_programme_goals(self, entity, programme_id):
        return self \
            .select_related('institutional_category') \
            .filter(budget__entity=entity.id, functional_category__programme=programme_id) \
            .all()


class Goal(models.Model):
    budget = models.ForeignKey('Budget')
    institutional_category = models.ForeignKey('InstitutionalCategory', db_column='institutional_category_id')
    functional_category = models.ForeignKey('FunctionalCategory', db_column='functional_category_id')
    goal_number = models.CharField(max_length=2)
    description = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = GoalsManager()

    class Meta:
        app_label = "budget_app"
        db_table = "goals"

    def __unicode__(self):
        return self.description
