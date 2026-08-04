#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_PATH="$SCRIPT_DIR/../package.json"

log() {
    local step="$1"
    local message="$2"
    printf '[%s] [%s] %s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$step" "$message"
}

run() {
    local command="$1"
    local step="$2"
    log "$step" "Running: $command"
    local start
    start=$(date +%s)

    eval "$command"

    local end
    end=$(date +%s)
    local duration=$((end - start))
    log "$step" "Completed in ${duration}s"
}

on_error() {
    log "ERROR" "Script failed at line $1"
    exit 1
}
trap 'on_error $LINENO' ERR

log "INIT" "Starting GitHub release process"

log "INIT" "Reading package.json from: $PACKAGE_PATH"

if [ ! -f "$PACKAGE_PATH" ]; then
    log "ERROR" "package.json not found at: $PACKAGE_PATH"
    exit 1
fi

VERSION=$(node -p "require('$PACKAGE_PATH').version")
TAG="v${VERSION}"

log "INIT" "Detected version: $VERSION"
log "INIT" "Release tag: $TAG"

# Assets to upload
ASSETS=(
    "./android/app/build/outputs/apk/release/audiovibes-arm64-v8a.apk"
    "./android/app/build/outputs/apk/release/audiovibes-armeabi-v7a.apk"
)

log "CHECK" "Checking git working tree"
run "git diff --quiet" "GIT"
log "CHECK" "Git working tree is clean"

log "TAG" "Creating git tag: $TAG"
run "git tag $TAG" "TAG"

log "PUSH" "Pushing main branch"
run "git push origin main" "PUSH"

log "PUSH" "Pushing tag: $TAG"
run "git push origin $TAG" "PUSH"

log "ASSETS" "Verifying release assets"
count=${#ASSETS[@]}
for i in "${!ASSETS[@]}"; do
    file="${ASSETS[$i]}"
    absolute=$(realpath -m "$file")
    index=$((i + 1))
    log "ASSETS" "Checking asset ${index}/${count}: $absolute"

    if [ ! -f "$file" ]; then
        log "ERROR" "Asset not found: $absolute"
        exit 1
    fi

    size=$(du -m "$file" | cut -f1)
    log "ASSETS" "Found asset (${size} MB): $(basename "$file")"
done

log "RELEASE" "Creating GitHub release"
run "gh release create $TAG ${ASSETS[*]} --title \"$TAG\" --generate-notes" "RELEASE"

log "DONE" "GitHub release $TAG created successfully"
