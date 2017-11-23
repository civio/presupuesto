from django.db import models, connection

from django.conf import settings

class InvestmentManager(models.Manager):
    def each_denormalized(self, additional_constraints=None, additional_arguments=None):
        sql = \
            "select " \
                "i.id, i.amount, i.description, TRUE as expense, i.actual, " \
                "gc.code as area, " \
                "fc.policy, " \
                "b.year " \
            "from " \
                "investments i " \
                "left join functional_categories fc on i.functional_category_id = fc.id " \
                "left join geographic_categories gc on i.geographic_category_id = gc.id " \
                "left join budgets b on i.budget_id = b.id " \
                "left join entities e on b.entity_id = e.id "

        if additional_constraints:
            sql += " where " + additional_constraints

        return self.raw(sql, additional_arguments)


class Investment(models.Model):
    budget = models.ForeignKey('Budget')
    actual = models.BooleanField()
    functional_category = models.ForeignKey('FunctionalCategory', db_column='functional_category_id', null=True)
    geographic_category = models.ForeignKey('GeographicCategory', db_column='geographic_category_id', null=True)
    project_id = models.CharField(max_length=20, null=True)
    description = models.CharField(max_length=300)
    amount = models.BigIntegerField()
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = InvestmentManager()

    class Meta:
        app_label = "budget_app"
        db_table = "investments"

    def __unicode__(self):
        return self.description
