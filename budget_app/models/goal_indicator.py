from django.db import models, connection

class GoalIndicatorsManager(models.Manager):

    # Get different summaries of indicators' scores.
    # Easy to do through SQL, but raw() needs the primary key to be in the result list,
    # so we end up having to access the DB connection directly. :/
    #
    # Note: we return unnamed tuples, which force us to use index access [] for the fields,
    # which is ugly. We could return Dict's doing something like https://stackoverflow.com/a/14294314,
    # but not sure it's worth the pain right now.

    # Get a summary of indicators and scores for a whole entity (for the main viz).
    # Or provide a policy id and get just the summary for that one, for the policy page.
    def get_indicators_summary_by_policy(self, entity_id, policy_id=None):
        sql = \
            "select " \
                "b.year, fc.policy, sum(gi.score), count(*) " \
            "from " \
                "goal_indicators gi " \
                "left join goals g on gi.goal_id = g.id " \
                "left join budgets b on g.budget_id = b.id " \
                "left join functional_categories fc on g.functional_category_id = fc.id " \
            "where " \
                "b.entity_id = %s "

        query_arguments = [entity_id]
        if policy_id:
            sql += "and fc.policy = %s "
            query_arguments.append(policy_id)

        sql += "group by b.year, fc.policy " \
            "order by b.year asc, fc.policy asc"

        cursor = connection.cursor()
        cursor.execute(sql, query_arguments)
        return list(cursor.fetchall())

    # Get a summary of indicators and scores by programme.
    def get_indicators_summary_by_programme(self, entity_id, field_name, field_id):
        sql = \
            "select " \
                "b.year, fc.programme, fc.description, sum(gi.score), count(*) " \
            "from " \
                "goal_indicators gi " \
                "left join goals g on gi.goal_id = g.id " \
                "left join budgets b on g.budget_id = b.id " \
                "left join functional_categories fc on g.functional_category_id = fc.id " \
            "where " \
                "fc."+field_name+" = %s and " \
                "b.entity_id = %s " \
            "group by b.year, fc.programme, fc.description " \
            "order by fc.description asc"
        cursor = connection.cursor()
        cursor.execute(sql, [field_id, entity_id])
        return list(cursor.fetchall())

    # Get a summary of indicators and scores for a given programme.
    def get_indicators_summary_by_section(self, entity_id, programme_id):
        sql = \
            "select " \
                "b.year, ic.id, ic.description, sum(gi.score), count(*) " \
            "from " \
                "goal_indicators gi " \
                "left join goals g on gi.goal_id = g.id " \
                "left join budgets b on g.budget_id = b.id " \
                "left join functional_categories fc on g.functional_category_id = fc.id " \
                "left join institutional_categories ic ON g.institutional_category_id = ic.id " \
            "where " \
                "fc.programme = %s and " \
                "b.entity_id = %s " \
            "group by b.year, ic.id, ic.description " \
            "order by ic.description asc"
        cursor = connection.cursor()
        cursor.execute(sql, [programme_id, entity_id])
        return list(cursor.fetchall())

    # FIXME Temporary
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
