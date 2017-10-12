import project.settings as settings
from django.conf import settings

def accounts_id_processor(request):
  return {
    'analytics_id': '' if not hasattr(settings, 'ANALYTICS_ID') else settings.ANALYTICS_ID,
    'facebook_id': '' if not hasattr(settings, 'FACEBOOK_ID') else settings.FACEBOOK_ID
  }

def cookies_url_processor(request):
  return { 'cookies_url': False if not hasattr(settings, 'COOKIES_URL') else settings.COOKIES_URL }

def show_options_processor(request):
  return {
    'show_payments':            hasattr(settings, 'SHOW_PAYMENTS') and settings.SHOW_PAYMENTS,
    'show_tax_receipt':         hasattr(settings, 'SHOW_TAX_RECEIPT') and settings.SHOW_TAX_RECEIPT,
    'show_counties_and_towns':  hasattr(settings, 'SHOW_COUNTIES_AND_TOWNS') and settings.SHOW_COUNTIES_AND_TOWNS,
    'show_section_pages':       hasattr(settings, 'SHOW_SECTION_PAGES') and settings.SHOW_SECTION_PAGES,
    'breakdown_by_uid':         True if not hasattr(settings, 'BREAKDOWN_BY_UID') else settings.BREAKDOWN_BY_UID,
    'institutional_max_levels': settings.INSTITUTIONAL_MAX_LEVELS if hasattr(settings, 'INSTITUTIONAL_MAX_LEVELS') else 1
  }

def main_entity_processor(request):
  return {
    'main_entity_web_url':       hasattr(settings, 'MAIN_ENTITY_WEB_URL') and settings.MAIN_ENTITY_WEB_URL,
    'main_entity_legal_url':     hasattr(settings, 'MAIN_ENTITY_LEGAL_URL') and settings.MAIN_ENTITY_LEGAL_URL,
    'main_entity_privacy_url':   hasattr(settings, 'MAIN_ENTITY_PRIVACY_URL') and settings.MAIN_ENTITY_PRIVACY_URL
  }

def data_sources_processor(request):
  return {
    'data_source_budget':        hasattr(settings, 'DATA_SOURCE_BUDGET') and settings.DATA_SOURCE_BUDGET,
    'data_source_population':    hasattr(settings, 'DATA_SOURCE_POPULATION') and settings.DATA_SOURCE_POPULATION,
    'data_source_inflation':     hasattr(settings, 'DATA_SOURCE_INFLATION') and settings.DATA_SOURCE_INFLATION
  }

def search_entities_processor(request):
  return { 'search_entities': False if not hasattr(settings, 'SEARCH_ENTITIES') else settings.SEARCH_ENTITIES }

def overview_use_new_vis(request):
  return { 'overview_use_new_vis': False if not hasattr(settings, 'OVERVIEW_USE_NEW_VIS') else settings.OVERVIEW_USE_NEW_VIS }

def debug(context):
  return { 'debug': settings.DEBUG }
