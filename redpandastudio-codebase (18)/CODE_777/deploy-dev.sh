#!/bin/bash
# ============================================
# DEPLOY TO DEV (workers.dev only)
# Does NOT touch gradstudio.org production
# ============================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_DIR="$SCRIPT_DIR/worker"
STATIC_DIR="$SCRIPT_DIR/static"
R2_BUCKET="learning-simulations"

echo "=========================================="
echo "  DEPLOYING TO DEV ENVIRONMENT"
echo "  Target: learning-platform-api.sabareeshrao.workers.dev"
echo "  Production (gradstudio.org) is UNTOUCHED"
echo "=========================================="

# Step 1: Upload static files to R2 (under static/ prefix)
echo ""
echo "[1/2] Uploading static files to R2..."
for file in "$STATIC_DIR"/*; do
  filename=$(basename "$file")
  r2key="static/$filename"
  echo "  Uploading $filename -> r2://$R2_BUCKET/$r2key"
  cd "$WORKER_DIR" && npx wrangler r2 object put "$R2_BUCKET/$r2key" --file "$file" --content-type "$(file --mime-type -b "$file")"
done

echo ""
echo "[2/2] Deploying worker to DEV environment..."
cd "$WORKER_DIR" && npx wrangler deploy --env dev

echo ""
echo "=========================================="
echo "  DEV DEPLOY COMPLETE"
echo "  URL: https://learning-platform-api.sabareeshrao.workers.dev"
echo "  Production: UNTOUCHED"
echo "=========================================="
