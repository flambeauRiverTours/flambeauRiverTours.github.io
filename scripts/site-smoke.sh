#!/usr/bin/env bash
# Checks a deployed copy of the site: that it serves this build, its files, a real 404 and the project-site redirects.
# Usage: scripts/site-smoke.sh https://<host> [dist]
set -uo pipefail

BASE=${1:?usage: site-smoke.sh https://<host> [dist]}
DIST=${2:-dist}
FAILED=0
fail() { echo "::error::$*"; FAILED=1; }
status() { curl -s -o /dev/null -w '%{http_code}' "$BASE$1"; }

# the entry script's hashed name is unique to this build; the platform may serve the old one for a moment
ENTRY=$(grep -oE '/assets/[^"]+\.js' "$DIST/index.html" | head -1)
for _ in $(seq 1 12); do
  curl -fsS "$BASE/" | grep -qF "$ENTRY" && break
  sleep 10
done
curl -fsS "$BASE/" | grep -qF "$ENTRY" || fail "$BASE/ doesn't serve this build ($ENTRY)"

for path in / /privacy.html /assistant-write-up.html /Jack-Treadwell-Resume.pdf /og-image.jpg /favicon.svg "$ENTRY"; do
  [ "$(status "$path")" = 200 ] || fail "$path returned $(status "$path"), not 200"
done

# no client-side router: a missing page is a 404, not the home page
[ "$(status /no-such-page)" = 404 ] || fail "/no-such-page returned $(status /no-such-page), not 404"

curl -sI "$BASE/" | grep -qi '^x-content-type-options: nosniff' || fail "/ has no X-Content-Type-Options header"

for project in FantasyFootballWebsite dailyDriver; do
  home="https://flambeaurivertours.github.io/$project/"
  for path in "/$project" "/$project/" "/$project/some/page"; do
    read -r code location < <(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$BASE$path")
    [ "$code $location" = "301 $home" ] || fail "$path redirected $code to ${location:-nowhere}, not 301 to $home"
  done
done

[ "$FAILED" = 0 ] && echo "The site at $BASE passed its smoke checks."
exit "$FAILED"
