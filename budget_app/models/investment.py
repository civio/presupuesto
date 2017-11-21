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
                "i.id, i.area, i.amount, i.description, i.expense, " \
                "b.year " \
            "from " \
                "investments i " \
                "left join budgets b on i.budget_id = b.id "

        return self.raw(sql)


class Investment(models.Model):
    budget = models.ForeignKey('Budget')
    area = models.CharField(max_length=100, null=True, db_index=True)
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
