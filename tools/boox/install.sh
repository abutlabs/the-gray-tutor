#!/usr/bin/env bash
# Puts the Gray Tutor button (gray-tutor.sh) where Termux:Widget finds it. Run it from
# Termux, or from a proot Linux inside Termux: it finds Termux's home either way.
set -eu
TERMUX_HOME=/data/data/com.termux/files/home
[ -d "$TERMUX_HOME" ] || { echo "Termux not found at $TERMUX_HOME"; exit 1; }
mkdir -p "$TERMUX_HOME/.shortcuts/tasks"
cp "$(dirname "$0")/gray-tutor.sh" "$TERMUX_HOME/.shortcuts/tasks/Gray Tutor"
chmod 700 "$TERMUX_HOME/.shortcuts" "$TERMUX_HOME/.shortcuts/tasks"
chmod 755 "$TERMUX_HOME/.shortcuts/tasks/Gray Tutor"
echo "Installed. Long-press the home screen > Widgets > Termux:Widget, then tap Gray Tutor."
