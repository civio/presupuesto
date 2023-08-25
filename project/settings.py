# -*- coding: UTF-8 -*-

import os.path
import sys

SETTINGS_PATH = os.path.dirname(os.path.abspath(__file__))
ROOT_PATH = os.path.join(SETTINGS_PATH, '..')
APP_PATH = os.path.join(ROOT_PATH, 'budget_app')


# ENVIRONMENT-SPECIFIC SETTINGS
#
# Load a non-versioned-controlled local file if it exists.
#
# Note: I thought initially I'd insert it at the very end, so it could override any setting,
# but it turns out it's more useful to load it at the beginning, so I can set the database credentials.
# I could potentially split it in two (like Rails does), but feels overkill
#
try:
    execfile(os.path.join(ROOT_PATH, 'local_settings.py'), globals(), locals())
except IOError:
    pass

HTTP_PROXY = ENV.get('HTTP_PROXY') or ENV.get('http_proxy')
HTTPS_PROXY = ENV.get('HTTPS_PROXY') or ENV.get('https_proxy')


# THEME-SPECIFIC SETTINGS
# Note: After looking into ways of importing modules dynamically, I decided this was the simplest solution
# Following http://igorsobreira.com/2010/09/12/customize-settingspy-locally-in-django.html
#
# Pick a theme by setting the THEME variable in 'local_settings.py'.
#
if ENV.get('THEME'):
    THEME = ENV.get('THEME')
    THEME_PATH = os.path.join(ROOT_PATH, THEME)
    execfile(os.path.join(ROOT_PATH, THEME, 'settings.py'), globals(), locals())
else:
    print "Please set the environment variable THEME in your local_settings.py file."
    sys.exit(1)


# DJANGO SETTINGS
#
DEBUG = ENV.get('DEBUG', False)

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',  # Add 'postgresql_psycopg2', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': ENV.get('DATABASE_NAME'),                    # Or path to database file if using sqlite3.
        'USER': ENV.get('DATABASE_USER'),                    # Not used with sqlite3.
        'PASSWORD': ENV.get('DATABASE_PASSWORD'),            # Not used with sqlite3.
        'HOST': ENV.get('DATABASE_HOST', 'localhost'),       # Set to empty string for localhost. Not used with sqlite3.
        'PORT': ENV.get('DATABASE_PORT', ''),                # Set to empty string for default. Not used with sqlite3.
    }
}

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)
MANAGERS = ADMINS

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
TIME_ZONE = 'Europe/Madrid'

# Location of translation files (used by themes to override certain strings)
LOCALE_PATHS = (
    os.path.join(THEME_PATH, 'locale'),
    os.path.join(APP_PATH, 'locale'),
)

# Ensure LANGUAGES is defined for LocaleMiddleware. Multilingual themes
# will have defined this beforehand with their particular language list.
if 'LANGUAGES' not in locals():
    # All choices can be found here: http://www.i18nguy.com/unicode/language-identifiers.html
    LANGUAGES = (
      ('es', 'Castellano'),
    )

# Base language code for this installation. Selects the first from the list of available ones.
# See https://docs.djangoproject.com/en/1.4//topics/i18n/translation/#how-django-discovers-language-preference
LANGUAGE_CODE = locals()['LANGUAGES'][0][0]

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale.
USE_L10N = False

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = False

# Absolute filesystem path to the directory that will hold user-uploaded files.
MEDIA_ROOT = ''

# URL that handles the media served from MEDIA_ROOT. Make sure to use a trailing slash.
MEDIA_URL = ''

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
STATIC_ROOT = os.path.join(ROOT_PATH, 'static')

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
if ENV.get('STATIC_URL'):
    STATIC_URL = ENV.get('STATIC_URL')
else:
    STATIC_URL = '/static/'

# Additional locations of static files
STATICFILES_DIRS = (
    os.path.join(THEME_PATH, 'static'),
    os.path.join(APP_PATH, 'static')
)

# List of finder classes that know how to find static files in various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'compressor.finders.CompressorFinder',  # add Django Compressor's file finder
)

# Config to compile LESS files automatically
COMPRESS_PRECOMPILERS = (
    ('text/less', 'lessc {infile} {outfile}'),
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = ')e2qrwa6e$u30r0)w=52!0j1_&amp;$t+y3z!o-(7ej0=#i!c7pjuy'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

if DEBUG:
    MIDDLEWARE_CLASSES = (
        'django.middleware.common.CommonMiddleware',
        # 'django.contrib.sessions.middleware.SessionMiddleware',
        # 'django.middleware.csrf.CsrfViewMiddleware',
        'django.middleware.locale.LocaleMiddleware',
    )
else:
    MIDDLEWARE_CLASSES = (
        'project.middleware.SmartUpdateCacheMiddleware',
        'django.middleware.common.CommonMiddleware',
        # 'django.contrib.sessions.middleware.SessionMiddleware',
        # 'django.middleware.csrf.CsrfViewMiddleware',
        'django.middleware.locale.LocaleMiddleware',
        # 'django.contrib.auth.middleware.AuthenticationMiddleware',
        # 'django.contrib.messages.middleware.MessageMiddleware',
        'django.middleware.cache.FetchFromCacheMiddleware',
        # Uncomment the next line for simple clickjacking protection:
        # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
    )

ROOT_URLCONF = 'project.urls'

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'project.wsgi.application'

INSTALLED_APPS = (
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.staticfiles',
    'django_jinja',
    'django_jasmine',
    'compressor',
    THEME,
    'budget_app'
)


# Template engine configuration
TEMPLATES = [
    {
        'BACKEND': 'django_jinja.backend.Jinja2',
        'DIRS': [
            os.path.join(THEME_PATH, 'templates'),
            os.path.join(ROOT_PATH, 'templates')
        ],
        'APP_DIRS': False,
        'OPTIONS': {
            'match_extension': '.html',
            'match_regex': '',
            'undefined': None,
            'newstyle_gettext': False,
            'tests': {
            },
            'filters': {
            },
            'globals': {
            },
            'constants': {
            },
            'context_processors': [
                'django.core.context_processors.debug',
                'django.core.context_processors.i18n',
                'django.core.context_processors.media',
                'django.core.context_processors.static',
                'django.core.context_processors.tz',
                'django.core.context_processors.request',
                'django.contrib.messages.context_processors.messages',
                'budget_app.context_processors.accounts_id_processor',
                'budget_app.context_processors.cookies_url_processor',
                'budget_app.context_processors.show_options_processor',
                'budget_app.context_processors.main_entity_processor',
                'budget_app.context_processors.data_sources_processor',
                'budget_app.context_processors.search_entities_processor',
                'budget_app.context_processors.overview_use_new_vis',
                'budget_app.context_processors.debug'
            ],
            'extensions': [
                'jinja2.ext.do',
                'jinja2.ext.loopcontrols',
                'jinja2.ext.i18n',
                'django_jinja.builtins.extensions.CsrfExtension',
                'django_jinja.builtins.extensions.CacheExtension',
                'django_jinja.builtins.extensions.TimezoneExtension',
                'django_jinja.builtins.extensions.UrlsExtension',
                'django_jinja.builtins.extensions.StaticFilesExtension',
                'django_jinja.builtins.extensions.DjangoFiltersExtension',
                'compressor.contrib.jinja2ext.CompressorExtension',
            ],
            'bytecode_cache': {
                'name': 'default',
                'backend': 'django_jinja.cache.BytecodeCache',
                'enabled': False,
            },
            'autoescape': True,
            'auto_reload': DEBUG,
            'translation_engine': 'django.utils.translation',
        }
    },
]

# Setup Jasmine folder for js unit test.
# See https://github.com/Aquasys/django-jasmine#installation
JASMINE_TEST_DIRECTORY = (
    os.path.join(os.path.dirname(__file__), '..', 'tests')
)

# Logging configuration
if DEBUG:
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'handlers': {
            'console': {
                'level': 'DEBUG',
                'class': 'logging.StreamHandler',
            },
        },
        'loggers': {
            'django.db.backends': {
                'level': 'DEBUG',
                'handlers': ['console'],
            },
        }
    }
else:
    # A sample logging configuration. The only tangible logging
    # performed by this configuration is to send an email to
    # the site admins on every HTTP 500 error when DEBUG=False.
    # See http://docs.djangoproject.com/en/dev/topics/logging for
    # more details on how to customize your logging configuration.
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'filters': {
            'require_debug_false': {
                '()': 'django.utils.log.RequireDebugFalse'
            }
        },
        'handlers': {
            'mail_admins': {
                'level': 'ERROR',
                'filters': ['require_debug_false'],
                'class': 'django.utils.log.AdminEmailHandler'
            }
        },
        'loggers': {
            'django.request': {
                'handlers': ['mail_admins'],
                'level': 'ERROR',
                'propagate': True,
            },
        }
    }

SEARCH_CONFIG = ENV.get('SEARCH_CONFIG', 'pg_catalog.english')

# Cache configuration
DEFAULT_CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'
    }
}
CACHES = ENV.get('CACHES', DEFAULT_CACHES)
CACHE_MIDDLEWARE_ALIAS = 'default'
CACHE_MIDDLEWARE_SECONDS = 60 * 60 * 24  # 1 Day: data doesn't actually change
CACHE_MIDDLEWARE_KEY_PREFIX = 'budget_app'


# FIXME: Temporary hack, during development of #1216. Remove once deployed
SHOW_MONITORING = ENV.get('SHOW_MONITORING', False)
