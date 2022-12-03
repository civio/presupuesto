from django.db import models

class GoalsManager(models.Manager):
    def get_policy_goals(self, entity, policy_id):
        return self \
            .filter(budget__entity=entity.id, functional_category__policy=policy_id) \
            .all()

    def get_programme_goals(self, entity, programme_id):
        return self \
            .select_related('institutional_category') \
            .filter(budget__entity=entity.id, functional_category__programme=programme_id) \
            .all()

class Goal(models.Model):
    budget = models.ForeignKey('Budget')
    uid = models.CharField(max_length=20, db_index=True)   # Unique inside a given budget
    institutional_category = models.ForeignKey('InstitutionalCategory', db_column='institutional_category_id')
    functional_category = models.ForeignKey('FunctionalCategory', db_column='functional_category_id')
    goal_number = models.CharField(max_length=2)
    description = models.TextField()
    report = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = GoalsManager()

    class Meta:
        app_label = "budget_app"
        db_table = "goals"

    def __unicode__(self):
        return self.description
