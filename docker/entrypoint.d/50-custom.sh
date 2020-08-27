#!/bin/sh
set -e

mkdir -p /app/static/javascripts/vis/
ln -s $APPDIR/$THEME/node_modules/d3-shape/src/curve/bundle.js \
  /app/static/javascripts/vis/d3-bundle.js