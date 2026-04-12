$ErrorActionPreference = 'Stop'

$notifId = [guid]::NewGuid().ToString()
$projectId = [guid]::NewGuid().ToString()
$userId = 'a12cd878-bd31-4806-944d-a36629a2b25e'

$insertProjectSql = "INSERT INTO public.projects (id, user_id, title, description, category, tags, budget, timeline, status, featured) VALUES ('$projectId', '$userId', 'Direct Routing Verification', 'Automated direct inbox routing verification', 'Web Application', '[]', 'Under 5000 USD', '1-3 months', 'PENDING', false);"
npx @insforge/cli db query $insertProjectSql | Out-String | Write-Output

$insertSql = "INSERT INTO public.submission_notifications (id, project_id, user_id, official_email, payload, delivery_status) VALUES ('$notifId', '$projectId', '$userId', 'creators.makerslab@gmail.com', '{}'::jsonb, 'QUEUED');"
npx @insforge/cli db query $insertSql | Out-String | Write-Output

$anonLine = Get-Content .env | Where-Object { $_ -match '^VITE_INSFORGE_ANON_KEY=' } | Select-Object -First 1
$anon = $anonLine.Substring($anonLine.IndexOf('=') + 1).Trim()

$bodyObj = @{
  notificationId = $notifId
  to = 'someoneelse@example.com'
  projectId = $projectId
  projectTitle = 'Direct Routing Test'
  projectStatus = 'PENDING'
  submitter = @{
    id = $userId
    name = 'Otto'
    email = 'nhanakwameotto@gmail.com'
  }
  details = @{
    category = 'Web Application'
    budget = 'Under 5000 USD'
    timeline = '1-3 months'
    description = 'Direct official inbox enforcement test'
    filesCount = 0
  }
}
$body = $bodyObj | ConvertTo-Json -Depth 6 -Compress

$status = 'FAILED'
$deliveryError = $null

try {
  $response = Invoke-RestMethod -Method Post -Uri 'https://5ab7xs59.functions.insforge.app/send-project-submission-email' -Headers @{
    Authorization = "Bearer $anon"
    apikey = $anon
    'Content-Type' = 'application/json'
  } -Body $body

  if ($response.ok -eq $true) {
    $status = 'SENT'
  } else {
    $deliveryError = 'Function returned non-ok response'
  }
} catch {
  $deliveryError = ($_.Exception.Message -replace "'", "''")
}

if ($status -eq 'SENT') {
  npx @insforge/cli db query "UPDATE public.submission_notifications SET delivery_status='SENT', dispatched_at=NOW(), delivery_error=NULL, updated_at=NOW() WHERE id='$notifId';" | Out-String | Write-Output
} else {
  if (-not $deliveryError) { $deliveryError = 'Unknown delivery failure' }
  npx @insforge/cli db query "UPDATE public.submission_notifications SET delivery_status='FAILED', delivery_error='$deliveryError', updated_at=NOW() WHERE id='$notifId';" | Out-String | Write-Output
}

npx @insforge/cli db query "SELECT id, official_email, delivery_status, dispatched_at, delivery_error FROM public.submission_notifications WHERE id='$notifId';"
