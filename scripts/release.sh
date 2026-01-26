#!/bin/bash
# Usage: ./scripts/release.sh
set -ex

# Prechecks
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
  echo "You must be on the main branch to release"
  exit 1
fi
git diff --exit-code

# Bump version
NEW_VERSION=$(cat .codspeed-runner-version)
# verify that NEW_VERSION is a valid semver
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Version must be a valid semver (e.g. 1.2.3)"
  exit 1
fi
MAJOR_VERSION=$(echo $NEW_VERSION | cut -d. -f1)

# Ask for confirmation
read -p "Are you sure you want to release v$NEW_VERSION? Bumping the v$MAJOR_VERSION major version ?(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# Fail if there are any unstaged changes left
git diff --exit-code
git commit -m "Release v$NEW_VERSION 🚀" --allow-empty
git tag -s -fa v$NEW_VERSION -m "Release v$NEW_VERSION 🚀"
git tag -s -fa v$MAJOR_VERSION -m "Release v$NEW_VERSION 🚀"
git push origin tag v$NEW_VERSION
git push -f origin tag v$MAJOR_VERSION
git push --follow-tags

RUNNER_NOTES=$(gh release view v$NEW_VERSION -R CodSpeedHQ/codspeed --json body | jq -r .body)
RUNNER_NOTES="$RUNNER_NOTES


**Full Runner Changelog**: https://github.com/CodSpeedHQ/codspeed/blob/main/CHANGELOG.md"
gh release create v$NEW_VERSION --title "v$NEW_VERSION" --notes "$RUNNER_NOTES" -d
