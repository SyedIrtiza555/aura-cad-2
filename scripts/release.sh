#!/usr/bin/env bash
# ==============================================================================
# Aura Desk - Release Engine Automation Script
# Usage:
#   ./scripts/release.sh [version] [--push] [--dry-run]
# Example:
#   ./scripts/release.sh 1.0.0
#   ./scripts/release.sh 1.0.1 --push
# ==============================================================================

set -euo pipefail

TARGET_VERSION="${1:-}"
DO_PUSH=false
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --push)
      DO_PUSH=true
      ;;
    --dry-run)
      DRY_RUN=true
      ;;
  esac
done

# If no target version was specified as first parameter or first parameter was a flag
if [[ -z "$TARGET_VERSION" || "$TARGET_VERSION" == --* ]]; then
  TARGET_VERSION=$(node -p "require('./package.json').version")
fi

# Strip leading 'v' if provided
TARGET_VERSION="${TARGET_VERSION#v}"
TAG_NAME="v${TARGET_VERSION}"

echo "=================================================="
echo "🚀 Aura Desk Release Engine"
echo "Target Version: ${TARGET_VERSION} (Tag: ${TAG_NAME})"
echo "Dry Run: ${DRY_RUN} | Auto Push: ${DO_PUSH}"
echo "=================================================="

# 1. Verify working directory cleanliness (unless dry run)
if [ "$DRY_RUN" = false ]; then
  if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: Working tree has uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
  fi
fi

# 2. Verify git branch is master or main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "master" && "$CURRENT_BRANCH" != "main" ]]; then
  echo "⚠️ Warning: You are releasing from branch '$CURRENT_BRANCH' (standard is 'master' or 'main')."
fi

# 3. Check for tag collisions
if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
  echo "❌ Error: Git tag '$TAG_NAME' already exists in the repository."
  exit 1
fi

# 4. Run test suite invariants
echo "🧪 Running invariant and unit tests..."
npm test

# 5. Run production build verification
echo "📦 Running production build..."
npm run build

# 6. Synchronize package.json and tauri.conf.json versions if needed
CURRENT_PKG_VER=$(node -p "require('./package.json').version")
if [ "$CURRENT_PKG_VER" != "$TARGET_VERSION" ]; then
  echo "📝 Updating package.json version to ${TARGET_VERSION}..."
  npm version --no-git-tag-version "$TARGET_VERSION"
  
  if [ -f "src-tauri/tauri.conf.json" ]; then
    echo "📝 Updating src-tauri/tauri.conf.json version to ${TARGET_VERSION}..."
    node -e "
      const fs = require('fs');
      const conf = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
      conf.version = '${TARGET_VERSION}';
      fs.writeFileSync('src-tauri/tauri.conf.json', JSON.stringify(conf, null, 2) + '\n');
    "
  fi

  if [ "$DRY_RUN" = false ]; then
    git add package.json src-tauri/tauri.conf.json package-lock.json 2>/dev/null || git add package.json src-tauri/tauri.conf.json
    git commit -m "chore(release): cut v${TARGET_VERSION}"
  fi
fi

# 7. Create Annotated Git Tag
if [ "$DRY_RUN" = true ]; then
  echo "🔍 [DRY RUN] Would create git tag: git tag -a ${TAG_NAME} -m 'Release ${TAG_NAME}'"
else
  echo "🏷️ Creating annotated tag: ${TAG_NAME}"
  git tag -a "${TAG_NAME}" -m "Release ${TAG_NAME} - Aura Desk"
fi

# 8. Push to remote if requested
if [ "$DO_PUSH" = true ]; then
  if [ "$DRY_RUN" = true ]; then
    echo "🔍 [DRY RUN] Would push: git push origin ${CURRENT_BRANCH} --tags"
  else
    echo "⬆️ Pushing branch and tags to origin..."
    git push origin "${CURRENT_BRANCH}" --tags
    echo "🎉 Successfully pushed ${TAG_NAME} to origin! Release Engine workflow triggered."
  fi
else
  echo ""
  echo "✅ Release tag ${TAG_NAME} successfully created locally!"
  echo "To trigger the CI/CD Release Engine, push to GitHub:"
  echo "   git push origin ${CURRENT_BRANCH} --tags"
fi
