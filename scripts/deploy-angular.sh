#!/usr/bin/env bash
set -e

# === CONFIG ===
DIST_DIR="dist"
TARGET_DIR="/Users/nguyenlephong/Documents/NDS/BBShop/brandportal-angular-2/src/assets/micro-app/docs-setting"
STYLE_FILE="pdf-docs-setting.css"
UMD_FILE="pdf-docs-setting.umd.js"

echo "🚀 Starting deploy (copy only)..."

# === STEP 1: Verify source files ===
if [ ! -f "$DIST_DIR/$STYLE_FILE" ]; then
  echo "❌ Error: $STYLE_FILE not found in $DIST_DIR"
  exit 1
fi

if [ ! -f "$DIST_DIR/$UMD_FILE" ]; then
  echo "❌ Error: $UMD_FILE not found in $DIST_DIR"
  exit 1
fi

# === STEP 2: Ensure target directory exists ===
mkdir -p "$TARGET_DIR"

# === STEP 3: Clean old files ===
echo "🧹 Cleaning old files in $TARGET_DIR ..."
rm -f "$TARGET_DIR/$STYLE_FILE" "$TARGET_DIR/$UMD_FILE"

# === STEP 4: Copy files ===
echo "📂 Copying files to $TARGET_DIR ..."
cp "$DIST_DIR/$STYLE_FILE" "$TARGET_DIR/"
cp "$DIST_DIR/$UMD_FILE" "$TARGET_DIR/"

echo "✅ Deploy complete!"
echo "📁 Files updated in: $TARGET_DIR"