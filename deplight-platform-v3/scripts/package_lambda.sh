#!/usr/bin/env bash
set -euo pipefail

SRC_DIR=${1:-lambda/ai_code_analyzer}
OUT_ZIP=${2:-build/ai_analyzer.zip}
PYTHON_VERSION=${PYTHON_VERSION:-3.12}

mkdir -p "$(dirname "$OUT_ZIP")"
OUT_DIR=$(cd "$(dirname "$OUT_ZIP")" && pwd)
OUT_ZIP="${OUT_DIR}/$(basename "$OUT_ZIP")"

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

rsync -a \
    --exclude package \
    --exclude deploy_pkg \
    --exclude '*.zip' \
    --exclude __pycache__ \
    --exclude '*.pyc' \
    "$SRC_DIR/" "$tmpdir/"

python3 -m pip install \
    --requirement "$SRC_DIR/requirements.txt" \
    --target "$tmpdir" \
    --platform manylinux2014_x86_64 \
    --implementation cp \
    --python-version "$PYTHON_VERSION" \
    --only-binary=:all: \
    --upgrade

pushd "$tmpdir" >/dev/null
rm -f "$OUT_ZIP"
zip -q -r "$OUT_ZIP" .
popd >/dev/null

echo "Created $OUT_ZIP"
