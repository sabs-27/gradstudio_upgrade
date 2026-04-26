#!/bin/bash
# ============================================
# DEPLOY TO DEVELOPMENT (workers.dev)
# ============================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_DIR="$SCRIPT_DIR/worker"
STATIC_DIR="$SCRIPT_DIR/static"
ADMIN_DIR="$SCRIPT_DIR/admin-preview"
R2_BUCKET="learning-simulations"

echo "=========================================="
echo "  👨‍💻 DEPLOYING TO DEVELOPMENT"
echo "  Target: learning-platform-api-dev.sabareeshrao.workers.dev"
echo "=========================================="
echo ""

# Step 1: Upload static files to R2 (under dev-static/ prefix)
echo ""
echo "[1/3] Uploading static files to R2 (dev-static/)..."
for file_path in "$STATIC_DIR"/*; do
  [ -e "$file_path" ] || continue
  filename=$(basename "$file_path")
  r2key="dev-static/$filename"
  
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

# Step 2: Upload admin-preview to R2 (under dev-admin/ prefix)
echo ""
echo "[2/3] Uploading admin-preview to R2 (dev-admin/)..."
for file_path in "$ADMIN_DIR"/*; do
  [ -e "$file_path" ] || continue
  filename=$(basename "$file_path")
  r2key="dev-admin/$filename"
  
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
echo "[3/3] Deploying worker to DEVELOPMENT..."
cd "$WORKER_DIR" && npx wrangler deploy --env dev

echo ""
echo "=========================================="
echo "  DEVELOPMENT DEPLOY COMPLETE"
echo "  Main Website: https://learning-platform-api-dev.sabareeshrao.workers.dev"
echo "  Admin Editor: https://learning-platform-api-dev.sabareeshrao.workers.dev/gradstudio-learn-admin.html"
echo "=========================================="
