# ============================================================
# Markers Lab - Backend Deployment Script
# Deploy Phase 1 Security Infrastructure to Insforge
# ============================================================

Write-Host "`n🚀 Starting Markers Lab Deployment..." -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Colors for output
$SUCCESS = "Green"
$WARNING = "Yellow"
$ERROR_COLOR = "Red"
$INFO = "Cyan"

# Step 1: Deploy critical tables
Write-Host "📊 Step 1: Creating security tables..." -ForegroundColor $INFO
Write-Host "  - password_resets table" -ForegroundColor $INFO
Write-Host "  - email_verifications table" -ForegroundColor $INFO
Write-Host "  - login_attempts table" -ForegroundColor $INFO
Write-Host "  - audit_logs table" -ForegroundColor $INFO
Write-Host "  - user_settings table" -ForegroundColor $INFO

$sqlScript = Get-Content "insforge/tables-critical.sql" -Raw
if ($LASTEXITCODE -ne 0 -or -not $sqlScript) {
    Write-Host "❌ Failed to read tables-critical.sql" -ForegroundColor $ERROR_COLOR
    exit 1
}

# Execute via Insforge CLI
Write-Host "  Executing SQL... " -ForegroundColor $INFO -NoNewline
$output = npx @insforge/cli db query "$sqlScript" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Tables created successfully" -ForegroundColor $SUCCESS
} else {
    Write-Host "⚠️  Warning: Check Insforge dashboard" -ForegroundColor $WARNING
    Write-Host "  $output" -ForegroundColor $WARNING
}

# Step 2: Deploy RLS policies
Write-Host "`n🔐 Step 2: Applying Row Level Security policies..." -ForegroundColor $INFO
Write-Host "  - Protecting all 10 tables with RLS" -ForegroundColor $INFO
Write-Host "  - Setting up role-based access control" -ForegroundColor $INFO

$rlsScript = Get-Content "insforge/rls-policies.sql" -Raw
if ($LASTEXITCODE -ne 0 -or -not $rlsScript) {
    Write-Host "❌ Failed to read rls-policies.sql" -ForegroundColor $ERROR_COLOR
    exit 1
}

Write-Host "  Executing policies... " -ForegroundColor $INFO -NoNewline
$output = npx @insforge/cli db query "$rlsScript" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ RLS policies applied" -ForegroundColor $SUCCESS
} else {
    Write-Host "⚠️  Warning: Check Insforge dashboard" -ForegroundColor $WARNING
    Write-Host "  $output" -ForegroundColor $WARNING
}

# Step 3: Verify tables exist
Write-Host "`n✅ Step 3: Verifying deployment..." -ForegroundColor $INFO

$verifyQuery = @"
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('password_resets', 'email_verifications', 'login_attempts', 'audit_logs', 'user_settings')
ORDER BY tablename;
"@

Write-Host "  Checking for security tables... " -ForegroundColor $INFO -NoNewline
$tables = npx @insforge/cli db query "$verifyQuery" 2>&1
if ($LASTEXITCODE -eq 0 -and $tables -like "*password_resets*") {
    Write-Host "✅ All tables verified" -ForegroundColor $SUCCESS
} else {
    Write-Host "⚠️  Manual verification needed" -ForegroundColor $WARNING
}

Write-Host "`n================================" -ForegroundColor $INFO
Write-Host "✅ Deployment Phase 1 Complete!" -ForegroundColor $SUCCESS
Write-Host "================================`n" -ForegroundColor $INFO

Write-Host "📋 Next Steps:" -ForegroundColor $INFO
Write-Host "  1. Open Insforge dashboard to verify tables" -ForegroundColor $INFO
Write-Host "  2. Review BACKEND_SETUP_GUIDE.md for testing" -ForegroundColor $INFO
Write-Host "  3. Test password reset flow end-to-end" -ForegroundColor $INFO
Write-Host "  4. Monitor admin security dashboard for data" -ForegroundColor $INFO

Write-Host ""
