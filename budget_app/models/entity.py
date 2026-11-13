from django.db import models
from django.template.defaultfilters import slugify

class Entity(models.Model):
    code = models.CharField(max_length=10, db_index=True)
    level = models.CharField(max_length=20, db_index=True)
    name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(unique=False)
    language = models.CharField(max_length=5)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)


    class Meta:
        db_table = "entities"

    def save(self):
        if not self.id: # Only set the slug when the object is created.
            self.slug = slugify(self.name)
        super(Entity, self).save()

    def __unicode__(self):
        return self.name
