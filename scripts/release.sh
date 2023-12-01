#!/bin/bash
# Usage: ./scripts/release.sh <version>
set -ex

if [ $# -ne 1 ]; then
  echo "Usage: ./release.sh <version>"
  exit 1
fi

# Prechecks
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
  echo "You must be on the main branch to release"
  exit 1
fi
git diff --exit-code

# Bump version
NEW_VERSION=$1
# verify that NEW_VERSION is a valid semver
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Version must be a valid semver (e.g. 1.2.3)"
  exit 1
fi
MAJOR_VERSION=$(echo $NEW_VERSION | cut -d. -f1)

# Fail if there are any unstaged changes left
git diff --exit-code
git commit -m "Release v$NEW_VERSION 🚀"
git tag -fa v$NEW_VERSION -m "Release v$NEW_VERSION 🚀"
git tag -fa v$MAJOR_VERSION -m "Release v$NEW_VERSION 🚀"
git push origin v$NEW_VERSION
git push -f origin v$MAJOR_VERSION
git push --follow-tags
gh release create v$NEW_VERSION --title "v$NEW_VERSION" --generate-notes -d
