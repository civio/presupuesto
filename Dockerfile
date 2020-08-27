FROM node:11-alpine as theme

ARG THEME_REPO="https://github.com/civio/presupuesto-torrelodones"

ENV THEME=presupuesto-theme \
    THEME_REPO=$THEME_REPO

ADD budget_app /budget_app

RUN apk add \
        gcc \
        g++ \
        make \
        musl-dev \
        git \
        python \
    && echo "[INFO] Get theme from ${THEME_REPO}" \ 
    && git clone --depth 1 ${THEME_REPO} ${THEME} \
    && set -x \
    && cd ./${THEME} \
    && if [ -f rollup.config.js ]; then \
        npm install --global rollup; \
        rollup -c; \
    fi \
    && npm install \
    && npm install node-sass d3 \
    && npm run css-build

FROM python:2.7-alpine

ARG APPDIR=/app
ARG USER_ID=1000
ARG GROUP_ID=1000

WORKDIR $APPDIR

ENV APPDIR=$APPDIR \
    USER_ID=$USER_ID \
    GROUP_ID=$GROUP_ID \
    MODE=runserver \
    THEME=presupuesto-example \
    DEBUG=False \
    TEMPLATE_DEBUG=False \
    DATABASE_HOST=postgres \
    DATABASE_PORT=5432 \
    DATABASE_NAME=dvmi_example_dev \
    DATABASE_USER=admindb \
    DATABASE_PASSWORD=admin \
    SEARCH_CONFIG=unaccent_spa \
    PG_CATALOG=pg_catalog.spanish \
    PG_STEM=spanish_stem \
    LOAD_BUDGET=ALL \
    APP_LISTEN=0.0.0.0:8000

RUN addgroup -g ${GROUP_ID} presupuesto \
    && adduser -D presupuesto -u ${USER_ID} -g presupuesto -G presupuesto -s /bin/sh -h ${APPDIR}

ADD --chown=presupuesto . $APPDIR
COPY --from=theme /presupuesto-theme $APPDIR/$THEME

RUN apk update \
    && apk add --no-cache \
        gcc \
        musl-dev \
        postgresql-dev \
        postgresql-client \
        postgresql-libs \
        run-parts \
    && pip install -r requirements/local.txt \
    && apk --purge del \
        gcc \
        musl-dev \
        postgresql-dev

EXPOSE 8000
USER presupuesto
ENTRYPOINT sh $APPDIR/docker/executable/sh/entrypoint.sh