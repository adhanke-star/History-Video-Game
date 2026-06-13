#!/bin/bash
# The Civil War — local launcher.
# Double-click this file to play. It starts a tiny local web server in this
# folder (required for Modern/3D mode — browsers block local 3D files over
# file://) and opens the game in your default browser. Close the Terminal
# window (or Ctrl-C) to stop the server when you're done.
cd "$(dirname "$0")"
PORT=8765
echo "Serving The Civil War at http://localhost:$PORT/civil_war_generals.html"
echo "(Leave this window open while you play. Close it to stop.)"
# open the browser shortly after the server starts
( sleep 1; open "http://localhost:$PORT/civil_war_generals.html" ) &
# python3 ships with macOS
python3 -m http.server $PORT
