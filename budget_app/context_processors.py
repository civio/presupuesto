from local_settings import ENV
from django.conf import settings

def analytics_processor(request):
    return { 'analytics_code': ENV.get('GA_CODE', '') }

def cookies_url_processor(request):
    return { 'cookies_url': False if not hasattr(settings, 'COOKIES_URL') else settings.COOKIES_URL }

def show_options_processor(request):
    return {
      # False by default if setting is not found
      'show_payments':            hasattr(settings, 'SHOW_PAYMENTS') and settings.SHOW_PAYMENTS,
      'show_tax_receipt':         hasattr(settings, 'SHOW_TAX_RECEIPT') and settings.SHOW_TAX_RECEIPT,
      'show_counties_and_towns':  hasattr(settings, 'SHOW_COUNTIES_AND_TOWNS') and settings.SHOW_COUNTIES_AND_TOWNS
    }
