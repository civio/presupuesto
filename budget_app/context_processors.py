from local_settings import ENV

def analytics_processor(request):
    return {'analytics_code': ENV.get('GA_CODE', 'UA-36118896-1')}
