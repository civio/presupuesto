#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")

    from django.core.management import execute_from_command_line
    from dj_static import Cling, MediaCling
    from local_settings import ENV

    if len(sys.argv) >= 2 and sys.argv[1] == 'livereload':

        import formic

        from django.core.wsgi import get_wsgi_application
        from livereload import Server

        application = get_wsgi_application()
        server = Server(Cling(application))

        # Add your watch
        for filepath in formic.FileSet(include=["**/*.html", "**/*.js"]):
            server.watch(filepath)

        server.serve(port=8000)
    else:
        execute_from_command_line(sys.argv)
