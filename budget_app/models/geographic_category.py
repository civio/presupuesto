from django.db import models
from django.conf import settings


class GeographicCategoriesManager(models.Manager):
    pass


class GeographicCategory(models.Model):
    budget = models.ForeignKey('Budget')
    uid = models.CharField(max_length=5)
    description = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = GeographicCategoriesManager()

    class Meta:
        app_label = "budget_app"
        db_table = "geographic_categories"

    def __unicode__(self):
        return self.description
