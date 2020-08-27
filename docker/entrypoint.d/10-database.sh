#!/bin/sh
if [ "${DEBUG}" == "True" ]; then
    set -x
fi

echo "[INFO] Trying connect to postgres, loop"
END=15
for i in $(seq 1 $END); do
    echo "  Try connect to postgres, num $i..."
    if PGPASSWORD=$DATABASE_PASSWORD psql \
      --username=$DATABASE_USER \
      --host=$DATABASE_HOST \
      --port=$DATABASE_PORT \
      --dbname=postgres --command='SELECT now()'; then
        echo "[INFO] Postgres working!"
        break
    fi
    sleep 4
done

echo "[INFO] Trying to create database"
PGPASSWORD=${DATABASE_PASSWORD} \
  psql --username=${DATABASE_USER} \
  --host=${DATABASE_HOST} --port=${DATABASE_PORT} --dbname=postgres \
  --command="CREATE DATABASE $DATABASE_NAME OWNER $DATABASE_USER;"

echo "[INFO] Configure unaccent"
PGPASSWORD=${DATABASE_PASSWORD} \
  psql --username=${DATABASE_USER} \
  --host=${DATABASE_HOST} --port=${DATABASE_PORT} --dbname=${DATABASE_NAME} \
  --command="CREATE EXTENSION unaccent; \
    CREATE TEXT SEARCH CONFIGURATION $SEARCH_CONFIG ( COPY = $PG_CATALOG ); \
    ALTER TEXT SEARCH CONFIGURATION $SEARCH_CONFIG
    ALTER MAPPING FOR hword, hword_part, word
    WITH unaccent, $PG_STEM;\
    SET default_text_search_config = '$SEARCH_CONFIG';"