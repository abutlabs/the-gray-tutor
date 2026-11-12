#!/usr/bin/env bash
# For a session that can't reach the npm registry: a stand-in for @noble/hashes' blake2b,
# so the widget tests that hash can run. Never used by the site or by CI, which install the
# real package. Run from the repo root.
set -euo pipefail
if [ ! -f node_modules/@noble/hashes/blake2.js ]; then
  mkdir -p node_modules/@noble/hashes
  cp refactor/shim/noble-hashes/* node_modules/@noble/hashes/
  echo "stand-in @noble/hashes installed"
fi
