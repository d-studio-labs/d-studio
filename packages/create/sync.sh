#!/bin/sh
# Syncs tracks/{hello,velvet} and synths/d-studio.scd from examples/playground
# (source of truth) into this template. Run after editing a track in
# playground, before publishing/testing the scaffolder.
#
#   packages/create/sync.sh
#
# Only touches *.js and *.scd files it knows playground and the template
# both carry — template-only files (tracks/velvet/README.md, this project's
# own package.json/LICENSE/etc) are left alone. Doesn't delete a file from
# the template that was removed from playground; check `git status` after.
set -eu
cd "$(dirname "$0")/../.."

SRC=examples/playground
DEST=packages/create/templates/project

for track in hello velvet; do
  echo "→ tracks/$track"
  for f in "$SRC/tracks/$track"/*.js; do
    cp "$f" "$DEST/tracks/$track/$(basename "$f")"
  done
done

echo "→ synths/d-studio.scd"
cp "$SRC/synths/d-studio.scd" "$DEST/synths/d-studio.scd"

echo "✓ synced playground -> $DEST"
