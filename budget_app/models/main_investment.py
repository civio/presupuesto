from django.db import models, connection

from django.conf import settings

class MainInvestmentManager(models.Manager):
    def all_main_investments(self, entity_id):
        return self.filter(budget__entity=entity_id).all()

    def each_denormalized(self, amount_column_name, additional_constraints=None, additional_arguments=None):
        sql = \
            "select " \
                "mi.id, mi.description, mi." + amount_column_name + " as amount, TRUE as expense, " \
                "mi.entity_name, mi.section_name, mi.area_name, " \
                "fc.description as policy, " \
                "b.year " \
            "from " \
                "main_investments mi " \
                "left join functional_categories fc on mi.functional_category_id = fc.id " \
                "left join budgets b on mi.budget_id = b.id " \
                "left join entities e on b.entity_id = e.id "

        if additional_constraints:
            sql += " where " + additional_constraints

        return self.raw(sql, additional_arguments)

class MainInvestment(models.Model):
    budget = models.ForeignKey('Budget', on_delete=models.CASCADE)
    project_id = models.CharField(max_length=20)
    description = models.CharField(max_length=200)
    image_URL = models.CharField(max_length=200, null=True)
    status = models.CharField(max_length=20)
    entity_name = models.CharField(max_length=100)
    section_name = models.CharField(max_length=100)

    functional_category = models.ForeignKey('FunctionalCategory',
                            db_column='functional_category_id',
                            on_delete=models.CASCADE)
    geographic_category = models.ForeignKey('GeographicCategory',
                            db_column='geographic_category_id',
                            null=True,
                            on_delete=models.CASCADE)
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
        db_table = "main_investments"

    def __unicode__(self):
        return self.description
