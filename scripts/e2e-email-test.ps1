$ErrorActionPreference = 'Stop'

$notificationId = 'c20ba9b8-d3a7-4be5-9c7a-006d6d412c26'
$projectId = '7e79022c-858b-480a-bcac-7684a50d02de'
$userId = 'a12cd878-bd31-4806-944d-a36629a2b25e'

$anonLine = Get-Content .env | Where-Object { $_ -match '^VITE_INSFORGE_ANON_KEY=' } | Select-Object -First 1
$anon = $anonLine.Substring($anonLine.IndexOf('=') + 1).Trim()

$bodyObj = @{
  to = 'creators.makerslab@gmail.com'
  notificationId = $notificationId
  projectId = $projectId
  projectTitle = 'E2E Submission Test - April 12'
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
    description = 'Live end-to-end submission email delivery verification run.'
    filesCount = 0
  }
}

$body = $bodyObj | ConvertTo-Json -Depth 6 -Compress

$resp = Invoke-RestMethod -Method Post -Uri 'https://5ab7xs59.functions.insforge.app/send-project-submission-email' -Headers @{
  Authorization = "Bearer $anon"
  apikey = $anon
  'Content-Type' = 'application/json'
} -Body $body

$resp | ConvertTo-Json -Depth 6

npx @insforge/cli db query "UPDATE public.submission_notifications SET delivery_status='SENT', dispatched_at=NOW(), delivery_error=NULL, updated_at=NOW() WHERE id='$notificationId';"
npx @insforge/cli db query "SELECT id, project_id, official_email, delivery_status, dispatched_at, delivery_error FROM public.submission_notifications WHERE id='$notificationId';"
