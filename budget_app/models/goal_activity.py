from django.db import models

class GoalActivitiesManager(models.Manager):
    # FIXME Temporary
    def get_programme_activities(self, entity, programme_id):
        return self \
            .select_related('goal') \
            .filter(goal__budget__entity=entity.id, goal__functional_category__programme=programme_id) \
            .all()


class GoalActivity(models.Model):
    goal = models.ForeignKey('Goal', on_delete=models.CASCADE)
    activity_number = models.CharField(max_length=2)
    description = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = GoalActivitiesManager()

    class Meta:
        app_label = "budget_app"
        db_table = "goal_activities"

    def __unicode__(self):
        return self.description
