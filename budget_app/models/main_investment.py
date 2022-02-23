from django.db import models, connection

from django.conf import settings

class MainInvestmentManager(models.Manager):
    def each_denormalized(self, column_name, additional_constraints=None, additional_arguments=None):
        sql = \
            "select " \
                "mi.id, mi.description, TRUE as expense, "+column_name+" as amount, " \
                "gc.code as area, " \
                "fc.description as policy, " \
                "b.year " \
            "from " \
                "main_investments mi " \
                "left join functional_categories fc on mi.functional_category_id = fc.id " \
                "left join geographic_categories gc on mi.geographic_category_id = gc.id " \
                "left join budgets b on mi.budget_id = b.id " \
                "left join entities e on b.entity_id = e.id "

        if additional_constraints:
            sql += " where " + additional_constraints

        return self.raw(sql, additional_arguments)

class MainInvestment(models.Model):
    budget = models.ForeignKey('Budget')
    project_id = models.CharField(max_length=20)
    description = models.CharField(max_length=200)
    status = models.CharField(max_length=20)
    entity_name = models.CharField(max_length=100)
    section_name = models.CharField(max_length=100)

    functional_category = models.ForeignKey('FunctionalCategory', db_column='functional_category_id')
    geographic_category = models.ForeignKey('GeographicCategory', db_column='geographic_category_id', null=True)
    area_name = models.CharField(max_length=100)

    address = models.CharField(max_length=200)
    latitude = models.FloatField()
    longitude = models.FloatField()

    start_year = models.IntegerField(null=True)
    expected_end_year = models.IntegerField(null=True)
    actual_end_year = models.IntegerField(null=True)

    total_expected_amount = models.BigIntegerField()
    already_spent_amount = models.BigIntegerField()
    current_year_amount = models.BigIntegerField()

    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = MainInvestmentManager()

    class Meta:
        app_label = "budget_app"
        db_table = "main_investments"

    def __unicode__(self):
        return self.description
