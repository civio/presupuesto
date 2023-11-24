from django.template.defaultfilters import slugify
from django.db import models
from django.conf import settings


class GeographicCategoriesManager(models.Manager):
    def categories(self, entity):
        return self.filter(budget__entity=entity)


class GeographicCategory(models.Model):
    budget = models.ForeignKey('Budget')
    code = models.CharField(max_length=5)
    description = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = GeographicCategoriesManager()

    class Meta:
        db_table = "geographic_categories"

    # Return the 'budget domain' id, used to uniquely identify a category
    # in a budget
    def uid(self):
        return self.code

    def slug(self):
        return slugify(self.description)

    def __unicode__(self):
        return self.description
