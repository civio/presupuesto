from django.db import models, connection

from django.conf import settings

class PaymentManager(models.Manager):
    # Return the list of areas
    # def get_areas(self, entity_id):
    #     return self.values_list('area', flat=True) \
    #                 .filter(budget_id__entity=entity_id) \
    #                 .distinct() \
    #                 .order_by('area')

    def each_denormalized(self, additional_constraints=None, additional_arguments=None):
        sql = \
            "select " \
                "i.id, i.amount, i.description, i.expense, FALSE as actual, " \
                "gc.code as area, " \
                "b.year " \
            "from " \
                "investments i " \
                "left join geographic_categories gc on i.geographic_category_id = gc.id " \
                "left join budgets b on i.budget_id = b.id "

        return self.raw(sql)


class Investment(models.Model):
    budget = models.ForeignKey('Budget')
    geographic_category = models.ForeignKey('GeographicCategory', db_column='geographic_category_id')
    expense = models.BooleanField()
    description = models.CharField(max_length=300)
    amount = models.BigIntegerField()
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = PaymentManager()

    class Meta:
        app_label = "budget_app"
        db_table = "investments"

    def __unicode__(self):
        return self.description
