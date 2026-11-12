#!/usr/bin/env bash
# The tests that can run without npm packages, compared with how they stood before you
# edited anything.   refactor/check.sh base   (on a clean tree, first)
#                    refactor/check.sh        (after your edits: prints only NEW failures)
set -uo pipefail
out=$(mktemp)
# one baseline per working copy, so runs side by side don't read each other's
id=$(pwd | cksum | cut -d" " -f1)
base=/tmp/refactor-base-$id.txt
now=/tmp/refactor-now-$id.txt
node --test "tools/*.test.ts" > "$out" 2>&1
grep -E "^\s*not ok" "$out" | sed -E 's/^\s*not ok [0-9]+ - //' | sort -u > "$now"
if [ "${1:-}" = "base" ]; then
  cp "$now" "$base"
  echo "baseline: $(wc -l < "$base") tests fail before any edit (missing packages)"
  exit 0
fi
new=$(comm -13 "$base" "$now")
if [ -z "$new" ]; then echo "no new failures"; exit 0; fi
echo "NEW FAILURES:"; echo "$new"
echo; echo "details: grep -n -A25 'not ok' $out"
exit 1
