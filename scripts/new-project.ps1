param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern("^[A-Za-z0-9][A-Za-z0-9_-]*$")]
    [string]$Project,

    [Parameter(Mandatory = $true)]
    [string]$ScriptId,

    [string]$TimeZone = "Africa/Lagos"
)

$ErrorActionPreference = "Stop"

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$projectsDir = Join-Path $workspaceRoot "projects"
$projectDir = Join-Path $projectsDir $Project
$srcDir = Join-Path $projectDir "src"

if (Test-Path $projectDir) {
    throw "Project '$Project' already exists: $projectDir"
}

New-Item -ItemType Directory -Path $srcDir -Force | Out-Null

$claspConfig = @{
    scriptId = $ScriptId
    rootDir = "src"
} | ConvertTo-Json -Compress
Write-Utf8NoBom -Path (Join-Path $projectDir ".clasp.json") -Content $claspConfig

$manifest = @{
    timeZone = $TimeZone
    dependencies = @{}
    exceptionLogging = "STACKDRIVER"
    runtimeVersion = "V8"
} | ConvertTo-Json -Depth 4
Write-Utf8NoBom -Path (Join-Path $srcDir "appsscript.json") -Content $manifest

$projectReadme = "# $Project`r`n`r`nApps Script project folder.`r`n`r`nPush:`r`n.\\scripts\\clasp-project.ps1 -Project $Project -Action push`r`n"
Write-Utf8NoBom -Path (Join-Path $projectDir "README.md") -Content $projectReadme

Write-Output "Created: $projectDir"
Write-Output "Next: add source files under $srcDir"
Write-Output "Push with: .\\scripts\\clasp-project.ps1 -Project $Project -Action push"