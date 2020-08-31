import os

# ENVIRONMENT-SPECIFIC SETTINGS
#
ENV = {
  'THEME': os.environ['THEME'],

  'DEBUG': os.environ['DEBUG'],
  'TEMPLATE_DEBUG': os.environ['TEMPLATE_DEBUG'],

  # Database
  'DATABASE_HOST': os.environ['DATABASE_HOST'],
  'DATABASE_PORT': os.environ['DATABASE_PORT'],
  'DATABASE_NAME': os.environ['DATABASE_NAME'],
  'DATABASE_USER': os.environ['DATABASE_USER'],
  'DATABASE_PASSWORD': os.environ['DATABASE_PASSWORD'],
  'SEARCH_CONFIG': os.environ['SEARCH_CONFIG'],

  # Caching
  'CACHES': {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'
    }
  },

  # Proxy
  'HTTP_PROXY': '',
  'HTTPS_PROXY': ''
}
