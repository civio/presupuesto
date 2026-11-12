# Settings for the tests in tests/subheadings, like tests/settings.py but for Navarra's theme.
# Django takes the theme from the settings, so each theme's tests run in their own pytest.
import os

os.environ['LOCAL_SETTINGS'] = os.path.join(os.path.dirname(__file__), 'env_subheadings.py')

from project.settings import *  # noqa: E402, F403
