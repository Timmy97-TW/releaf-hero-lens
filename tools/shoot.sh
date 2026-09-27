#!/bin/sh
# tools/shoot.sh <path-and-query> <out.png> [width] [height]
# Renders one still of a variant with headless Chrome. Needs the preview
# server on :8921. The hero is the window minus the 68px nav strip.
W=${3:-1440}; H=${4:-820}
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=$W,$H --virtual-time-budget=15000 --screenshot="$2" "http://localhost:8921/$1" 2>/dev/null
