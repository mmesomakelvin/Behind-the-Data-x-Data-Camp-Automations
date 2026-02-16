param(
    [Parameter(Mandatory = $true)]
    [string]$Project,

    [Parameter(Mandatory = $true)]
    [string]$Action,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ExtraArgs
)

$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$projectDir = Join-Path (Join-Path $workspaceRoot "projects") $Project
$configPath = Join-Path $projectDir ".clasp.json"

if (-not (Test-Path $projectDir)) {
    throw "Project '$Project' not found at $projectDir"
}
if (-not (Test-Path $configPath)) {
    throw "No .clasp.json found for project '$Project'. Expected: $configPath"
}

Push-Location $projectDir
try {
    Write-Output "Project: $Project"
    Write-Output "Directory: $projectDir"
    Write-Output "Command: clasp $Action $($ExtraArgs -join ' ')"
    & clasp $Action @ExtraArgs
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}