#!/bin/sh
set -e

echo "[INFO] User: $(whoami)"

if [ "${DEBUG}" == "True" ]; then
    export
    pip freeze
fi

cp docker/executable/python/docker-local_settings.py ./local_settings.py
