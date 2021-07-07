#!/bin/sh
set -e

if [ "${DEBUG}" == "True" ]; then
    echo "[WARNING] Debug ensures manual execution"
    sleep infinity
else
    echo "[INFO] Start server in mode $MODE"
    python manage.py $MODE $APP_LISTEN
fi
