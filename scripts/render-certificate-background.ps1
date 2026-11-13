param(
  [string]$DestinationPath = "",

  [ValidateSet("completion", "participation")]
  [string]$Award = "completion",

  [int]$Scale = 3
)

# Renders the certificate design without the fellow's name or certificate number.
# The AEF_Cohort_1_Certificates automation places this image behind the name and number.
# The image contains the signature, so it is saved in the private assets/signatures folder.

$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
if (-not $DestinationPath) {
  $fileName = if ($Award -eq "completion") { "aef-cohort-1-completion-background.png" } else { "aef-cohort-1-participation-background.png" }
  $DestinationPath = Join-Path $workspaceRoot "assets\signatures\$fileName"
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
$sampleUrl = ([System.Uri]$samplePath).AbsoluteUri + "?award=$Award#background"
$destinationDirectory = Split-Path -Parent $DestinationPath
if (-not (Test-Path $destinationDirectory)) {
  New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
}
$renderId = [Guid]::NewGuid().ToString("N")
$temporaryScreenshot = Join-Path $destinationDirectory "aef-background-render-$renderId.png"
$temporaryProfile = Join-Path $env:TEMP "aef-background-edge-$renderId"

# A4 landscape is 1123 x 794 CSS pixels.
# Use a fresh screenshot path and browser profile each time. Edge does not reliably
# replace an existing screenshot, which can leave an old printed link in the PDF.
try {
  $edgeProcess = Start-Process -FilePath $edge -Wait -PassThru -WindowStyle Hidden -ArgumentList @(
    "--headless", "--disable-gpu", "--hide-scrollbars",
    "--user-data-dir=`"$temporaryProfile`"",
    "--window-size=1123,794",
    "--force-device-scale-factor=$Scale",
    "--virtual-time-budget=5000",
    "--screenshot=`"$temporaryScreenshot`"",
    $sampleUrl
  )
  if ($edgeProcess.ExitCode -ne 0 -or -not (Test-Path $temporaryScreenshot)) {
    throw "The background image was not created by Edge."
  }
  Move-Item -LiteralPath $temporaryScreenshot -Destination $DestinationPath -Force
} finally {
  if (Test-Path $temporaryScreenshot) { Remove-Item -LiteralPath $temporaryScreenshot -Force }
  if (Test-Path $temporaryProfile) { Remove-Item -LiteralPath $temporaryProfile -Recurse -Force }
}

Write-Host "Saved certificate background: $DestinationPath"
