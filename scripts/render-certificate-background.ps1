param(
  [string]$DestinationPath = "",

  [int]$Scale = 3
)

# Renders the certificate design without the fellow's name or certificate number.
# The AEF_Cohort_1_Certificates automation places this image behind the name and number.
# The image contains the signature, so it is saved in the private assets/signatures folder.

$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
if (-not $DestinationPath) {
  $DestinationPath = Join-Path $workspaceRoot "assets\signatures\aef-cohort-1-certificate-background.png"
}

$edgeCandidates = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$edge = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) {
  throw "Microsoft Edge was not found."
}

$samplePath = Join-Path $workspaceRoot "artifacts\certificates\aef-cohort-1-certificate-sample.html"
$sampleUrl = ([System.Uri]$samplePath).AbsoluteUri + "#background"

# A4 landscape is 1123 x 794 CSS pixels.
# Start-Process keeps Edge's harmless console warnings from stopping the script.
Start-Process -FilePath $edge -Wait -WindowStyle Hidden -ArgumentList @(
  "--headless", "--disable-gpu", "--hide-scrollbars",
  "--window-size=1123,794",
  "--force-device-scale-factor=$Scale",
  "--virtual-time-budget=5000",
  "--screenshot=`"$DestinationPath`"",
  $sampleUrl
)

if (-not (Test-Path $DestinationPath)) {
  throw "The background image was not created."
}

Write-Host "Saved certificate background: $DestinationPath"
