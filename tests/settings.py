# Settings for the tests in tests/app: the app's settings, but reading tests/env.py
# instead of local_settings.py, so they don't depend on the site we're working on.
import os

os.environ['LOCAL_SETTINGS'] = os.path.join(os.path.dirname(__file__), 'env.py')

from project.settings import *  # noqa: E402, F403
