from django.db import models
from django.conf import settings


class GlossaryTermManager(models.Manager):
    def search(self, query, language):
        sql = "select id, title, description from glossary_terms " \
                "where " \
                "(language is null or language='"+language+"') "

        # If no query is passed (i.e. we're showing the glossary page),
        # return all the terms.
        if query and query != '':
            sql += "and " \
                "to_tsvector('"+settings.SEARCH_CONFIG+"',title) @@ plainto_tsquery('"+settings.SEARCH_CONFIG+"',%s) or " \
                "to_tsvector('"+settings.SEARCH_CONFIG+"',description) @@ plainto_tsquery('"+settings.SEARCH_CONFIG+"',%s) "

        sql += "order by title asc"
        return self.raw(sql, [query, query])


class GlossaryTerm(models.Model):
    title = models.CharField(max_length=100)
    description = models.CharField(max_length=2000)
    language = models.CharField(max_length=5)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = GlossaryTermManager()

    class Meta:
        app_label = "budget_app"
        db_table = "glossary_terms"

    def __unicode__(self):
        return self.title
