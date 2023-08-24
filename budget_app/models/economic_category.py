from django.template.defaultfilters import slugify
from django.db import models
from django.conf import settings


class EconomicCategoriesManager(models.Manager):
    def expenses(self):
        return self.filter(expense=True)

    def income(self):
        return self.filter(expense=False)

    def _search(self, query, budget, conditions):
        sql = "select * from economic_categories " \
                "where " + conditions + " and " \
                "to_tsvector('"+settings.SEARCH_CONFIG+"',description) @@ plainto_tsquery('"+settings.SEARCH_CONFIG+"',%s)"

        if budget:
            sql += " and budget_id='%s'" % budget.id

        sql += "order by description asc"
        return self.raw(sql, (query, ))

    def search_articles(self, query, budget=None):
        return self._search(query, budget, "article is not null and heading is null")

    def search_headings(self, query, budget=None):
        return self._search(query, budget, "heading is not null and subheading is null")


class EconomicCategory(models.Model):
    budget = models.ForeignKey('Budget')
    expense = models.BooleanField()
    chapter = models.CharField(max_length=1)
    article = models.CharField(max_length=2, null=True)
    heading = models.CharField(max_length=9, null=True)     # 9 for PGE: '480/xxxxx' with xxxxx entity_id 
    subheading = models.CharField(max_length=9, null=True)  # 6 for Aragon, not used for PGE
    description = models.CharField(max_length=500)          # 500 for PGE
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = EconomicCategoriesManager()

    class Meta:
        db_table = "economic_categories"

    # Return the 'budget domain' id, used to uniquely identify a category
    # in a budget
    def uid(self):
        if self.article == None:
            return self.chapter
        elif self.heading == None:
            return self.article
        elif self.subheading == None:
            return self.heading
        return self.subheading

    def slug(self):
        return slugify(self.description)

    def __unicode__(self):
        return self.description
