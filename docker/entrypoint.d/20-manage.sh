#!/bin/sh
set -xe

# Execution for manage.py:
# [budget_app]
#     clean_budgets
#     load_budget
#     load_budget_data
#     load_entities
#     load_execution
#     load_glossary
#     load_investments
#     load_payments
#     load_stats
#     remove_budget

if PGPASSWORD=${DATABASE_PASSWORD} \
  psql --username=${DATABASE_USER} --host=${DATABASE_HOST} \
  --port=${DATABASE_PORT} --dbname=${DATABASE_NAME} \
  --command="SELECT * FROM budgets LIMIT 1;"; then
    echo "[INFO] Database initialized, do not load data again"
else
    echo "[INFO] Prepare database..."
    python manage.py syncdb
    python manage.py migrate
    python manage.py load_glossary
    python manage.py load_entities
    python manage.py load_stats

    if [ "${LOAD_BUDGET}" != "ALL" ]; then
        for language in $(ls -l $APPDIR/$THEME/data | \
          grep '^d' | awk '{ print $NF }'); do
            python manage.py load_budget $LOAD_BUDGET --language $language
            python manage.py load_payments $LOAD_BUDGET --language $language
            #python manage.py load_execution $year
            #python manage.py load_investments $year --language $language
        done
    else
        for language in $(ls -l $APPDIR/$THEME/data | \
          grep '^d' | awk '{ print $NF }'); do
            for year in $(ls $APPDIR/$THEME/data/$language/municipio); do
                python manage.py load_budget $year --language $language
                python manage.py load_payments $year --language $language
                #python manage.py load_execution $year
                #python manage.py load_investments $year --language $language
            done
        done
    fi
fi
