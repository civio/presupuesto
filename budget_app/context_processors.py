import project.settings as settings
from local_settings import ENV

def analytics_processor(request):
    return {'analytics_code': ENV.get('GA_CODE', 'UA-36118896-1')}

def cookies_url_processor(request):
    return { 'cookies_url': False if not settings.COOKIES_URL else settings.COOKIES_URL }
<<<<<<< HEAD
=======

def show_options_processor(request):
    return {
      'show_payments':            settings.SHOW_PAYMENTS,
      'show_tax_receipt':         settings.SHOW_TAX_RECEIPT,
      'show_counties_and_towns':  settings.SHOW_COUNTIES_AND_TOWNS
    }
>>>>>>> master
