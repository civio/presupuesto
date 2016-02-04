import project.settings as settings
from local_settings import ENV

def analytics_processor(request):
    return {'analytics_code': ENV.get('GA_CODE', 'UA-36118896-1')}

def cookies_url_processor(request):
    return { 'cookies_url': False if not settings.COOKIES_URL else settings.COOKIES_URL }
