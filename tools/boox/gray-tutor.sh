#!/data/data/com.termux/files/usr/bin/bash
# The Gray Tutor, served from the tablet itself: one tap on a Termux:Widget home-screen
# button. Fetches the newest built site when it has changed (the site-latest release,
# made by .github/workflows/pages.yml), serves it here on port 8765 and opens it in the
# browser in reading mode. With no network it serves the copy it already has.
#
#   install: bash tools/boox/install.sh   (copies this to ~/.shortcuts/tasks/ in Termux)
#   needs:   pkg install python curl unzip, and the Termux:Widget app

set -u
PORT=${GRAY_TUTOR_PORT:-8765}
DIR=$HOME/.gray-tutor
ZIP=$DIR/site.zip
ZIP_URL=https://github.com/abutlabs/the-gray-tutor/releases/download/site-latest/site.zip
URL="http://127.0.0.1:$PORT/the-gray-tutor/?read"
mkdir -p "$DIR"

# 1. the newest site, only if it changed since the copy here (-z: the zip's own date)
if curl -fsSL --max-time 300 --remote-time -z "$ZIP" -o "$ZIP.part" "$ZIP_URL" && [ -s "$ZIP.part" ]; then
  rm -rf "$DIR/new" && mkdir -p "$DIR/new/the-gray-tutor" \
    && unzip -q "$ZIP.part" -d "$DIR/new/the-gray-tutor" \
    && rm -rf "$DIR/site" && mv "$DIR/new" "$DIR/site" && mv "$ZIP.part" "$ZIP"
fi
rm -f "$ZIP.part"
[ -d "$DIR/site" ] || { echo "No copy of the site yet: connect to the network and tap again."; exit 1; }

# 2. the server, unless it is already running. The site's addresses have no .html
#    (cleanUrls), so a page asked for as /x is served from x.html.
if ! curl -fs -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/the-gray-tutor/"; then
  setsid nohup python - "$DIR/site" "$PORT" >"$DIR/server.log" 2>&1 <<'PY' &
import os, sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
root, port = sys.argv[1], int(sys.argv[2])
class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        full = super().translate_path(path)
        if not os.path.exists(full) and os.path.exists(full + ".html"):
            return full + ".html"
        return full
    def log_message(self, *args): pass
ThreadingHTTPServer(("127.0.0.1", port), partial(Handler, directory=root)).serve_forever()
PY
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    curl -fs -o /dev/null --max-time 1 "http://127.0.0.1:$PORT/the-gray-tutor/" && break
    sleep 0.3
  done
fi

# 3. the browser
termux-open-url "$URL"
