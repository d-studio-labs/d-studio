#!/bin/sh
# Scaffolds a new d-studio project from templates/project/.
#
#   curl -fsSL https://raw.githubusercontent.com/d-studio-labs/d-studio/main/scripts/create.sh | sh -s my-track
#
# Downloads this repo's template folder, fills in the project name, and runs
# `npm install`. Safe to re-run against a different name; refuses to
# overwrite an existing directory.
set -eu

REPO="d-studio-labs/d-studio"
BRANCH="main"

name="${1:-}"
if [ -z "$name" ] && [ -t 0 ]; then
  printf 'Project name: '
  read -r name
fi
if [ -z "$name" ]; then
  echo "usage: curl -fsSL <url> | sh -s <project-name>" >&2
  exit 1
fi

if [ -e "$name" ]; then
  echo "✗ ./$name already exists — pick another name or remove it first" >&2
  exit 1
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

echo "→ downloading d-studio template…"
curl -fsSL "https://github.com/$REPO/archive/refs/heads/$BRANCH.tar.gz" | tar -xz -C "$tmp" --strip-components=1

if [ ! -d "$tmp/templates/project" ]; then
  echo "✗ templates/project not found in $REPO@$BRANCH — the repo layout may have moved" >&2
  exit 1
fi

mkdir -p "$name"
cp -R "$tmp/templates/project/." "$name/"

# BSD sed (macOS) needs an explicit (empty) backup extension after -i; GNU sed doesn't
if sed --version >/dev/null 2>&1; then
  sed -i "s/__PROJECT_NAME__/$name/" "$name/package.json" "$name/README.md"
else
  sed -i '' "s/__PROJECT_NAME__/$name/" "$name/package.json" "$name/README.md"
fi

echo "→ npm install"
(cd "$name" && npm install)

cat <<EOF

✓ $name is ready

  cd $name
  npm run dirt-install   # one-time: SuperCollider quarks (needs SuperCollider installed)
  npm run samples        # download drum machine samples
  npm run dirt           # boot SuperDirt; wait for "SUPERDIRT READY"
  npm run play           # (in another terminal) start the clock

EOF
