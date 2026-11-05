#!/bin/sh
# Scaffolds a new d-studio project from templates/project/, next to this file.
#
#   curl -fsSL https://raw.githubusercontent.com/d-studio-labs/d-studio/main/packages/create/create.sh | sh -s my-track
#
# Downloads this repo's template folder, fills in the project name, and runs
# `npm install`. Safe to re-run against a different name; refuses to
# overwrite an existing directory.
#
#   D_STUDIO_BRANCH=my-branch curl -fsSL .../my-branch/packages/create/create.sh | sh -s my-track
#
# tests a branch before it's merged to main (fetch the script itself from
# that branch too, like the example above, or it'll run main's version)
set -eu

REPO="${D_STUDIO_REPO:-d-studio-labs/d-studio}"
BRANCH="${D_STUDIO_BRANCH:-main}"

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

if [ ! -d "$tmp/packages/create/templates/project" ]; then
  echo "✗ packages/create/templates/project not found in $REPO@$BRANCH — the repo layout may have moved" >&2
  exit 1
fi

mkdir -p "$name"
cp -R "$tmp/packages/create/templates/project/." "$name/"

# $name may be a path (curl ... | sh -s ~/code/my-track) - the package name
# itself should just be the final component, not the whole path
pkgname=$(basename "$name")
author=$(git config --get user.name 2>/dev/null || true)
: "${author:=your name}"
year=$(date +%Y)

# BSD sed (macOS) needs an explicit (empty) backup extension after -i; GNU
# sed doesn't. `|` as the delimiter since a name/author could contain `/`
if sed --version >/dev/null 2>&1; then sed_i() { sed -i "$@"; }; else sed_i() { sed -i '' "$@"; }; fi
sed_i "s|__PROJECT_NAME__|$pkgname|" "$name/package.json" "$name/README.md"
sed_i "s|__AUTHOR__|$author|; s|__YEAR__|$year|" "$name/LICENSE"

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
