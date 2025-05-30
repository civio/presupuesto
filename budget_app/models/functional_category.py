from django.template.defaultfilters import slugify
from django.db import models
from django.conf import settings


class FunctionalCategoriesManager(models.Manager):
    def programmes(self):
        return self.filter(programme__isnull=False)

    def _search(self, query, budget, conditions):
        sql = "select * from functional_categories " \
                "where " + conditions + " and " \
                "to_tsvector('"+settings.SEARCH_CONFIG+"',description) @@ plainto_tsquery('"+settings.SEARCH_CONFIG+"',%s)"

        if budget:
            sql += " and budget_id='%s'" % budget.id

        return self.raw(sql, (query, ))

    def search_policies(self, query, budget=None):
        return self._search(query, budget, "policy is not null and function is null and area<>'X' and policy<>'XX'")

    def search_programmes(self, query, budget=None):
        return self._search(query, budget, "programme is not null and programme<>'XXXX'")


class FunctionalCategory(models.Model):
    budget = models.ForeignKey('Budget', on_delete=models.CASCADE)
    area = models.CharField(max_length=1)
    policy = models.CharField(max_length=3, null=True)
    function = models.CharField(max_length=5, null=True)
    programme = models.CharField(max_length=5, null=True)
    subprogramme = models.CharField(max_length=7, null=True)
    description = models.CharField(max_length=300)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = FunctionalCategoriesManager()

    class Meta:
        db_table = "functional_categories"

    # Returns the 'budget domain' id, used to uniquely identify a category in
    # a given budget.
    #   Note: this implementation garantees uniqueness only if children ids are
    # 'fully scoped' (for lack of a better name). I.e. a function id could
    # be '4.1', for example, meaning that it belongs to area '4'.
    def uid(self):
        if self.policy == None:
            return self.area
        elif self.function == None:
            return self.policy
        elif self.programme == None:
            return self.function
        elif self.subprogramme == None:
            return self.programme
        return self.subprogramme

    def slug(self):
        return slugify(self.description)

    def __unicode__(self):
        return self.description
