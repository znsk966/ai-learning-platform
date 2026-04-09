from backend.settings import *  # noqa: F401, F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable real payment provider in tests (use demo mode)
LEMONSQUEEZY_API_KEY = ''
LEMONSQUEEZY_STORE_ID = ''

# Disable throttling in tests
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    'DEFAULT_THROTTLE_CLASSES': [],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10000/day',
        'user': '10000/day',
        'auth': '10000/day',
        'payment': '10000/day',
    },
}
