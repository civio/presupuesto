from django.db import models

class GoalIndicatorsManager(models.Manager):
    # XXX Temporary
    def get_programme_indicators(self, entity, programme_id):
        return self \
            .select_related('goal') \
            .filter(goal__budget__entity=entity.id, goal__functional_category__programme=programme_id) \
            .all()


class GoalIndicator(models.Model):
    goal = models.ForeignKey('Goal', on_delete=models.CASCADE)
    indicator_number = models.CharField(max_length=2)
    description = models.CharField(max_length=800)
    unit = models.CharField(max_length=20)
    target = models.BigIntegerField()
    actual = models.BigIntegerField()
    score = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = GoalIndicatorsManager()

    class Meta:
        app_label = "budget_app"
        db_table = "goal_indicators"

    def __unicode__(self):
        return self.description
