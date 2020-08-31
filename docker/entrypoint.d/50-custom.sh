#!/bin/sh
set -e

mkdir -p /app/static/javascripts/vis/
#ln -s $APPDIR/$THEME/node_modules/d3-shape/src/curve/bundle.js \
#  /app/static/javascripts/vis/d3-bundle.js

if [ -f $APPDIR/$THEME/d3-bundle.js ]; then
  echo "[INFO] File d3-bundle.js from theme"
  ln -s $APPDIR/$THEME/d3-bundle.js \
    /app/static/javascripts/vis/d3-bundle.js
else
  echo "[INFO] File d3-bundle.js from default docker image"
  ln -s $APPDIR/docker/files/d3-bundle.js \
    /app/static/javascripts/vis/d3-bundle.js
fi
