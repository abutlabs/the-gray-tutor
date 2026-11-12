#!/usr/bin/env bash
# The tests that can run without npm packages, compared with how they stood before you
# edited anything.   refactor/check.sh base   (on a clean tree, first)
#                    refactor/check.sh        (after your edits: prints only NEW failures)
set -uo pipefail
out=$(mktemp)
node --test "tools/*.test.ts" > "$out" 2>&1
grep -E "^\s*not ok" "$out" | sed -E 's/^\s*not ok [0-9]+ - //' | sort -u > /tmp/refactor-now.txt
if [ "${1:-}" = "base" ]; then
  cp /tmp/refactor-now.txt /tmp/refactor-base.txt
  echo "baseline: $(wc -l < /tmp/refactor-base.txt) tests fail before any edit (missing packages)"
  exit 0
fi
new=$(comm -13 /tmp/refactor-base.txt /tmp/refactor-now.txt)
if [ -z "$new" ]; then echo "no new failures"; exit 0; fi
echo "NEW FAILURES:"; echo "$new"
echo; echo "details: grep -n -A25 'not ok' $out"
exit 1
