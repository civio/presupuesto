from django.db import models
from django.conf import settings


class InstitutionalCategoriesManager(models.Manager):
    def search_departments(self, query, budget):
        sql =   "select * from institutional_categories " \
                    "where department is not null and " \
                    "to_tsvector('"+settings.SEARCH_CONFIG+"',description) @@ plainto_tsquery('"+settings.SEARCH_CONFIG+"',%s) "

        if budget:
            sql += " and budget_id='%s'" % budget.id

        sql += "order by description asc"
        return self.raw(sql, (query, ))


class InstitutionalCategory(models.Model):
    budget = models.ForeignKey('Budget')
    institution = models.CharField(max_length=5)
    section = models.CharField(max_length=8, null=True)
    department = models.CharField(max_length=11, null=True)
    description = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = InstitutionalCategoriesManager()

    class Meta:
        app_label = "budget_app"
        db_table = "institutional_categories"

    # Return the 'budget domain' id, used to uniquely identify a category
    # in a budget
    def uid(self):
        if self.section == None:
            return self.institution
        elif self.department == None:
            return self.section
        return self.department

    def __unicode__(self):
        return self.description
