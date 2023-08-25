from django.contrib.staticfiles.storage import staticfiles_storage
from coffin.template import Library

register = Library()

# Shim for `static` tag for Coffin-dependent code.
# When we upgrade Django to 1.8+ we get rid of Coffin and its `{% static ... %}` tag.
# Instead, `django-jinja` provides a `{{ static() }}` function. It's easier to change
# the old code to use a new global funcion than to create a new tag for the modern code.
# The implementation below is a copy of the one inside `django-jinja`.
@register.object
def static(path):
    return staticfiles_storage.url(path)
