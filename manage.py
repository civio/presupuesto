#!/usr/bin/env python
import os
import sys

from subprocess import call

def compile_less(theme):
    filepath = ''.join([theme, '/static/stylesheets/main.{}'])
    #call(['lessc',filepath.format('less'),filepath.format('css')])
    call(['sass',filepath.format('scss'),filepath.format('css')])


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")

    from django.core.management import execute_from_command_line
    from dj_static import Cling, MediaCling
    from local_settings import ENV

    if sys.argv[1] == 'livereload':

        import formic

        from django.core.wsgi import get_wsgi_application
        from livereload import Server

        application = get_wsgi_application()
        server = Server(Cling(application))
        compile_less(ENV['THEME'])

        # Add your watch
        for filepath in formic.FileSet(include="**/*.scss"):
            server.watch(filepath, lambda: compile_less(ENV['THEME']))
        for filepath in formic.FileSet(include=["**/*.html", "**/*.js"]):
            server.watch(filepath)

        server.serve(port=8000)
    else:
        execute_from_command_line(sys.argv)
