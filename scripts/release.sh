#!/bin/bash
# Usage: ./scripts/release.sh [--execute]
# By default, runs in dry-run mode. Pass --execute to actually perform the release.
set -e

EXECUTE=false
for arg in "$@"; do
  case "$arg" in
    --execute) EXECUTE=true ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

if [ "$EXECUTE" = false ]; then
  echo "=== DRY RUN MODE (pass --execute to perform the release) ==="
fi

# Pre-checks
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
  echo "You must be on the main branch to release"
  exit 1
fi
if ! git diff --quiet; then
  echo "Error: Working tree is not clean. The following files have uncommitted changes:"
  git diff --name-only | sed 's/^/  /'
  exit 1
fi

# Bump version
NEW_VERSION=$(cat .codspeed-runner-version)
# verify that NEW_VERSION is a valid semver
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Version must be a valid semver (e.g. 1.2.3)"
  exit 1
fi
MAJOR_VERSION=$(echo "$NEW_VERSION" | cut -d. -f1)

# Check if this version has already been released (local tag, remote tag, or GitHub release)
if git tag -l "v$NEW_VERSION" | grep -q . || git ls-remote --tags origin "refs/tags/v$NEW_VERSION" | grep -q . || gh release view "v$NEW_VERSION" > /dev/null 2>&1; then
  echo "Error: v$NEW_VERSION has already been released."
  exit 1
fi

# Determine release notes strategy
RUNNER_NOTES=$(gh release view "v$NEW_VERSION" -R CodSpeedHQ/codspeed --json body | jq -r .body)
RELEASE_NOTES="$RUNNER_NOTES


**Full Runner Changelog**: https://github.com/CodSpeedHQ/codspeed/blob/main/CHANGELOG.md"

# Summary
echo ""
echo "Version: v$NEW_VERSION"
echo "Major tag: v$MAJOR_VERSION"
echo ""
echo "The following actions will be performed:"
echo "  - Create an empty commit: \"Release v$NEW_VERSION 🚀\""
echo "  - Create/update tag v$NEW_VERSION"
echo "  - Force-update tag v$MAJOR_VERSION"
echo "  - Push tags and commits"
echo "  - Create a draft GitHub release v$NEW_VERSION with runner release notes"

if [ "$EXECUTE" = false ]; then
  echo ""
  echo "Release notes:"
  echo "---"
  echo "$RELEASE_NOTES"
  echo "---"
  echo ""
  echo "=== DRY RUN: No changes were made ==="
  exit 0
fi

set -x

# Ask for confirmation
read -p "Are you sure you want to release v$NEW_VERSION? Bumping the v$MAJOR_VERSION major version? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

git commit -m "Release v$NEW_VERSION 🚀" --allow-empty
git tag -s -fa "v$NEW_VERSION" -m "Release v$NEW_VERSION 🚀"
git tag -s -fa "v$MAJOR_VERSION" -m "Release v$NEW_VERSION 🚀"
git push origin tag "v$NEW_VERSION"
git push -f origin tag "v$MAJOR_VERSION"
git push --follow-tags

gh release create "v$NEW_VERSION" --title "v$NEW_VERSION" --notes "$RELEASE_NOTES" -d
