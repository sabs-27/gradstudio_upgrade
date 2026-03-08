#!/bin/bash
# ============================================
# DEPLOY TO PRODUCTION (gradstudio.org)
# ⚠️  WARNING: This updates the live site!
# ============================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_DIR="$SCRIPT_DIR/worker"
STATIC_DIR="$SCRIPT_DIR/static"
ADMIN_DIR="$SCRIPT_DIR/admin-preview"
R2_BUCKET="learning-simulations"

# Load environment variables from .env if present
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

echo "=========================================="
echo "  ⚠️  DEPLOYING TO PRODUCTION"
echo "  Target: gradstudio.org + workers.dev"
echo "=========================================="
echo ""

# Bypass confirmation if "y" is piped
if [ -t 0 ]; then
    read -p "Are you sure you want to deploy to PRODUCTION? (y/N) " confirm
else
    confirm="y"
fi

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

# Step 1: Upload static files to R2 (under static/ prefix)
echo ""
echo "[1/3] Uploading static files to R2 (Remote)..."
for file_path in "$STATIC_DIR"/*; do
  [ -e "$file_path" ] || continue
  filename=$(basename "$file_path")
  r2key="static/$filename"
  
  # Determine MIME type more robustly
  content_type="application/octet-stream"
  case "$filename" in
    *.html) content_type="text/html" ;;
    *.css)  content_type="text/css" ;;
    *.js)   content_type="application/javascript" ;;
    *.png)  content_type="image/png" ;;
    *.jpg|*.jpeg) content_type="image/jpeg" ;;
    *.ico)  content_type="image/x-icon" ;;
    *.svg)  content_type="image/svg+xml" ;;
    *.txt)  content_type="text/plain" ;;
  esac

  echo "  Uploading $filename -> r2://$R2_BUCKET/$r2key ($content_type)"
  cd "$WORKER_DIR" && npx wrangler r2 object put "$R2_BUCKET/$r2key" --file "$file_path" --content-type "$content_type" --remote
done

# Step 2: Upload admin-preview to R2 (under admin-preview/ prefix)
echo ""
echo "[2/3] Uploading admin-preview to R2 (Remote)..."
for file_path in "$ADMIN_DIR"/*; do
  [ -e "$file_path" ] || continue
  filename=$(basename "$file_path")
  r2key="admin-preview/$filename"
  
  content_type="application/octet-stream"
  case "$filename" in
    *.html) content_type="text/html" ;;
    *.css)  content_type="text/css" ;;
    *.js)   content_type="application/javascript" ;;
  esac

  echo "  Uploading $filename -> r2://$R2_BUCKET/$r2key ($content_type)"
  cd "$WORKER_DIR" && npx wrangler r2 object put "$R2_BUCKET/$r2key" --file "$file_path" --content-type "$content_type" --remote
done

echo ""
echo "[3/3] Deploying worker to PRODUCTION..."
cd "$WORKER_DIR" && npx wrangler deploy

echo ""
echo "=========================================="
echo "  PRODUCTION DEPLOY COMPLETE"
echo "  URLs: https://gradstudio.org"
echo "        https://gradstudio.org/admin-preview"
echo "        https://learning-platform-api.sabareeshrao.workers.dev"
echo "=========================================="
