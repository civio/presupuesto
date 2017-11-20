from django.db import models, connection

from django.conf import settings

class PaymentManager(models.Manager):
    # Return the list of areas
    # def get_areas(self, entity_id):
    #     return self.values_list('area', flat=True) \
    #                 .filter(budget_id__entity=entity_id) \
    #                 .distinct() \
    #                 .order_by('area')

    # Return a list of years for which we have payments
    def get_years(self, entity_id):
        return self.values_list('budget_id__year', flat=True) \
                    .filter(budget_id__entity=entity_id) \
                    .distinct() \
                    .order_by('budget__year')

    # def each_denormalized(self, additional_constraints=None, additional_arguments=None):
    #     # XXX: Note that this left join syntax works well even when the economic_category_id is null,
    #     # as opposed to the way we query for Budget Items. I should probably adopt this all around,
    #     # and potentially even stop using dummy categories on loaders.
    #     sql = \
    #         "select " \
    #             "p.id, p.area, p.programme, p.date, p.payee, p.expense, p.amount, p.description, " \
    #             "coalesce(ec.description, 'Otros') as ec_description, " \
    #             "b.year " \
    #         "from " \
    #             "payments p " \
    #             "left join budgets b on p.budget_id = b.id " \
    #             "left join economic_categories ec on p.economic_category_id = ec.id "

    #     if additional_constraints:
    #         sql += " where " + additional_constraints

    #     return self.raw(sql, additional_arguments)


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
