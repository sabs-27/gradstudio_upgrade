$ErrorActionPreference = "Stop"

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$workerDir = Join-Path $scriptPath "worker"
$staticDir = Join-Path $scriptPath "static"
$adminDir = Join-Path $scriptPath "admin-preview"
$r2Bucket = "learning-simulations"

Write-Host "=========================================="
Write-Host "  👨‍💻 DEPLOYING TO DEVELOPMENT"
Write-Host "  Target: learning-platform-api-dev.sabareeshrao.workers.dev"
Write-Host "=========================================="
Write-Host ""

Write-Host "[1/3] Uploading static files to R2 (dev-static/)..."
Set-Location -Path $workerDir

$staticFiles = Get-ChildItem -Path $staticDir -File
foreach ($file in $staticFiles) {
    $filename = $file.Name
    $r2key = "dev-static/$filename"
    $contentType = "application/octet-stream"

    switch -Wildcard ($filename.ToLower()) {
        "*.html" { $contentType = "text/html" }
        "*.css"  { $contentType = "text/css" }
        "*.js"   { $contentType = "application/javascript" }
        "*.png"  { $contentType = "image/png" }
        "*.jpg"  { $contentType = "image/jpeg" }
        "*.jpeg" { $contentType = "image/jpeg" }
        "*.ico"  { $contentType = "image/x-icon" }
        "*.svg"  { $contentType = "image/svg+xml" }
        "*.txt"  { $contentType = "text/plain" }
    }

    Write-Host "  Uploading $filename -> r2://$r2Bucket/$r2key ($contentType)"
    npx wrangler r2 object put "$r2Bucket/$r2key" --file "$($file.FullName)" --content-type $contentType --remote
}

Write-Host ""
Write-Host "[2/3] Uploading admin-preview to R2 (dev-admin/)..."
$adminFiles = Get-ChildItem -Path $adminDir -File
foreach ($file in $adminFiles) {
    $filename = $file.Name
    $r2key = "dev-admin/$filename"
    $contentType = "application/octet-stream"

    switch -Wildcard ($filename.ToLower()) {
        "*.html" { $contentType = "text/html" }
        "*.css"  { $contentType = "text/css" }
        "*.js"   { $contentType = "application/javascript" }
    }

    Write-Host "  Uploading $filename -> r2://$r2Bucket/$r2key ($contentType)"
    npx wrangler r2 object put "$r2Bucket/$r2key" --file "$($file.FullName)" --content-type $contentType --remote
}

Write-Host ""
Write-Host "[3/3] Deploying worker to DEVELOPMENT..."
npx wrangler deploy --env dev

Write-Host ""
Write-Host "=========================================="
Write-Host "  DEVELOPMENT DEPLOY COMPLETE"
Write-Host "  Main Website: https://learning-platform-api-dev.sabareeshrao.workers.dev"
Write-Host "  Admin Editor: https://learning-platform-api-dev.sabareeshrao.workers.dev/gradstudio-learn-admin.html"
Write-Host "=========================================="
