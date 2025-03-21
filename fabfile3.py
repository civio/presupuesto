#
# Fabric file using Python 3 calls.
#
# To use `fabric`:
#   $ pip install fabric==1.14.1
#
# Add an alias to `~/.zsrhc`:
#   alias fab3='fab -f fabfile3.py'
#
# To start a site:
#   $ source env/bin/activate  # Optional
#   $ nvm use
#   $ fab3 start:madrid
#
# In the local environment, the Python version is selected by `pyenv` using `.python-version`.
#
# To deploy:
#   $ fab3 deploy:navarra
#
from fabric.api import *
import os

env.hosts = ['david@85.159.211.140:22001']  # Midas server

def set_project(name):
    env.project = name
    env.path = '/var/www/%(project)s.dondevanmisimpuestos.es/public' % env
    env.theme_path = '%(path)s/presupuesto-%(project)s' % env

    # Activate the virtualenv, inspired by https://stackoverflow.com/a/3403558
    # Assume all the deployments have it and is named the same. Could be adapted easily.
    env.activate_virtualenv = 'source env/bin/activate &&'

def update_core(name=None):
    if name is not None:
        set_project(name)

    if hasattr(env, 'project'):
        print("--- Update core repo")
        run("cd %(path)s; git pull origin" % env)

        # Update the Python requirements in the virtual env (not at the server level)
        run("cd %(path)s; %(activate_virtualenv)s pip install -q -r requirements/base.txt" % env)

        run("cd %(path)s; npm install; npm run d3-build;" % env)
        run("cd %(path)s; %(activate_virtualenv)s python3 manage.py migrate;" % env)
    else:
        print("--- Error: project name not defined (use fab update_core:'project_name')")


def update_theme(name=None):
    if name is not None:
        set_project(name)

    if hasattr(env, 'project'):
        print("--- Update presupuesto-%(project)s repo" % env)
        run("cd %(theme_path)s; git pull origin" % env)
    else:
        print("--- Error: project name not defined (use fab update_theme:'project_name')")


def css_build(name=None):
    if name is not None:
        set_project(name)

    if hasattr(env, 'project'):
        print("--- Build presupuesto-%(project)s css file" % env)
        run("cd %(theme_path)s; npm install; npm run css-build" % env)
    else:
        print("--- Error: project name not defined (use fab update_theme:'project_name')")


def compile_assets(name=None):
    if name is not None:
        set_project(name)

    if hasattr(env, 'project'):
        print("--- Compile assets")
        run("cd %(path)s; %(activate_virtualenv)s python3 manage.py collectstatic --noinput | grep -v 'Found another file'" % env)
        # After upgrading to Django 1.11 we don't do offline compression #80 #1044
        # run("cd %(path)s; python3 manage.py compress --force --engine jinja2" % env)
    else:
        print("--- Error: project name not defined (use fab compile_assets:'project_name')")


def restart_app(name=None):
    if name is not None:
        set_project(name)

    if hasattr(env, 'project'):
        print("--- Restart app")
        run("cd %(path)s; touch project/wsgi.py" % env)
    else:
        print("--- Error: project name not defined (use fab restart_app:'project_name')")


def clean_cache(name=None):
    if name is not None:
        set_project(name)

    if hasattr(env, 'project'):
        print("--- Clean cache")
        run("sudo /home/david/clean-tmp-folder.sh %(project)s" % env)
    else:
        print("--- Error: project name not defined (use fab clean_cache:'project_name')")


# Load Methods
# ---------------

# call as: fab load_glossary:'castellon'
# call as: fab load_glossary:name='castellon',lang='es-es'
def load_glossary(name=None,lang=None):
    if name is not None:
        set_project(name)

    if lang is not None:
        env.lang = lang

    if hasattr(env, 'project'):
        if hasattr(env, 'lang'):
            run("cd %(path)s; python3 manage.py load_glossary --language=%(lang)s" % env)
        else:
            run("cd %(path)s; python3 manage.py load_glossary" % env)
    else:
        print("--- Error: project name not defined (use fab load_glossary:'project_name')")

# call as: fab load_entities:'castellon'
def load_entities(name=None):
    if name is not None:
        set_project(name)

    if hasattr(env, 'project'):
        run("cd %(path)s; python3 manage.py load_entities" % env)
    else:
        print("--- Error: project name not defined (use fab load_entities:'project_name')")

# call as: fab load_stats:'castellon'
def load_stats(name=None):
    if name is not None:
        set_project(name)

    if hasattr(env, 'project'):
        run("cd %(path)s; python3 manage.py load_stats" % env)
    else:
        print("--- Error: project name not defined (use fab load_stats:'project_name')")

# call as: fab load_data:name='castellon'
# call as: fab load_data:name='castellon', lang='es-es'
def load_data(name=None,lang=None):
    load_glossary(name,lang)
    load_entities(name)
    load_stats(name)

# call as: fab load_budget:name='castellon', year='2013'
# call as: fab load_budget:name='castellon', year='2013', lang='es-es'
# call as: fab load_budget:name='castellon', year='2013', status='3'
def load_budget(name=None,year=None,lang=None,status=None):
    if year is not None:
        env.year = year
    else:
        print("--- Error: year not defined (use fab load_budget:name='project_name',year=year_value)")
        return

    if status is not None:
        env.status = status

    if name is not None:
        set_project(name)

    if lang is not None:
        env.lang = lang

    if hasattr(env, 'project'):
        if hasattr(env, 'lang'):
            if hasattr(env, 'status'):
                run("cd %(path)s; python3 manage.py load_budget %(year)s --language=%(lang)s --status=%(status)sT" % env)
            else:
                run("cd %(path)s; python3 manage.py load_budget %(year)s --language=%(lang)s" % env)
        else:
            if hasattr(env, 'status'):
                run("cd %(path)s; python3 manage.py load_budget %(year)s --status=%(status)sT" % env)
            else:
                run("cd %(path)s; python3 manage.py load_budget %(year)s" % env)
    else:
        print("--- Error: project name not defined (use fab load_budget:name='project_name',year=year_value)")

# call as: fab load_budgets:name='castellon', yearFrom=2013, yearTo=2015
# call as: fab load_budgets:name='castellon', yearFrom=2013, yearTo=2015, lang='es-es'
def load_budgets(name=None,yearFrom=None,yearTo=None,lang=None):
    if yearFrom is None or yearTo is None:
        print("--- Error: yearFrom or yearTo values are not defined (use fab load_budgets:name='project_name',yearFrom=year_from_value,yearTo=year_to_value)")
        return

    for year in range(int(yearFrom), int(yearTo)+1):
        load_budget(name,str(year),lang)


# call as: fab create_theme:'castellon'
# or fab create_theme:name='santacoloma',entityName='Santa Coloma de Gramenet'
# name has no spaces & entityName is the human version
# entityName no needed if there's no spaces in theme name
# example: name='valldeuixo', entityName='La Vall d\'Uixo'
def create_theme(name=None, entityName=None):
    if name is None:
        print("--- Error: project name not defined (use fab create_theme:'project_name')")
    else:
        if os.path.isdir("presupuesto-%s" % name):
            print("--- Error: there's a folder presupuesto-%s. Delete it before if you want to create a %s theme." % (name, name))
            return
        if entityName is None:
            entityName = name.capitalize()
        # Create a folder presupuesto-{name}
        local("mkdir presupuesto-%s" % name)
        # Clone presupuestos-base repository into presupuestos-{name} folder
        local("git clone git@github.com:civio/presupuesto-base.git presupuesto-%s" % name)
        # Remove .git folder
        local("rm -rf presupuesto-%s/.git" % name)
        # Create database dvmi_{name}_dev
        local("createdb -h localhost dvmi_%s_dev" % name)
        # Create local_settings_{name}.py file from ocal_settings.py-example
        local("cp local_settings.py-example local_settings_%s.py" % name)
        local("sed -i '' 's/example/%s/g' local_settings_%s.py" % (name, name))
        # Replace theme 'base' references with '{name}'
        local("sed -i '' 's/Base City/%s/g' presupuesto-%s/settings.py" % (entityName, name))
        local("sed -i '' 's/Base/%s/g' presupuesto-%s/settings.py" % (name.capitalize(), name))
        local("sed -i '' 's/base/%s/g' presupuesto-%s/package.json" % (name, name))
        local("sed -i '' 's/Base City/%s/g' presupuesto-%s/data/entidades.csv" % (entityName, name))
        local("sed -i '' 's/Base City/%s/g' presupuesto-%s/data/poblacion.csv" % (entityName, name))
        local("sed -i '' 's/Base City/%s/g' presupuesto-%s/data/es/clasificacion_organica.csv" % (entityName, name))
        local("sed -i '' 's/Base/%s/g' presupuesto-%s/loaders/*" % (name.capitalize(), name))
        local("sed -i '' 's/base/%s/g' presupuesto-%s/loaders/*" % (name, name))
        local("cd presupuesto-%s/loaders; mv 'base_budget_loader.py' '%s_budget_loader.py'; mv 'base_payments_loader.py' '%s_payments_loader.py'" % (name, name, name))
        local("sed -i '' 's/Base City/%s/g' presupuesto-%s/locale/*/LC_MESSAGES/django.po" % (entityName, name))
        local("cd presupuesto-%s; django-admin.py compilemessages;" % name)


# call as: fab start:'castellon'
def start(name=None):
    if name is None:
        print("--- Error: project name not defined (use fab start:'project_name')")
    else:
        # Copy local_settings_{name}.py file into local_settings.py file
        local("cat local_settings_%s.py > local_settings.py" % name)
        # Load theme packages & compile css
        local("cd presupuesto-%s; npm install; npm run css-build; cd ..;" % name)
        # Run django server
        local("source env/bin/activate && python3 manage.py runserver")


# call as: fab deploy:'castellon'
def deploy(name=None,skipCore=None):

    if name is None:
        print("--- Error: project name not defined (use fab deploy:'project_name')")
    else:
        set_project(name)

        if skipCore is None:
            update_core()
        update_theme()
        css_build()
        compile_assets()
        restart_app()
        clean_cache()
