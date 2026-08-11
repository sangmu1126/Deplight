#!/usr/bin/env bash
set -euo pipefail

SRC_DIR=${1:-lambda/ai_code_analyzer}
OUT_ZIP=${2:-build/ai_analyzer.zip}

mkdir -p "$(dirname "$OUT_ZIP")"

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

python3 -m pip install \
    --requirement "$SRC_DIR/requirements.txt" \
    --target "$tmpdir" \
    --platform manylinux2014_x86_64 \
    --python-version 3.12 \
    --implementation cp \
    --only-binary=:all: \
    --disable-pip-version-check

rsync -a \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '*.zip' \
    --exclude 'package' \
    --exclude 'deploy_pkg' \
    "$SRC_DIR/" "$tmpdir/"

rm -f "$OUT_ZIP"
pushd "$tmpdir" >/dev/null
zip -qr "$OLDPWD/$OUT_ZIP" .
popd >/dev/null

echo "Created $OUT_ZIP"
