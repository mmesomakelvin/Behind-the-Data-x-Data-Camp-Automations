param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,

  [Parameter(Mandatory = $true)]
  [string]$DestinationPath
)

Add-Type -AssemblyName System.Drawing

$sourceImage = [System.Drawing.Image]::FromFile($SourcePath)
$sourceBitmap = New-Object System.Drawing.Bitmap(
  $sourceImage.Width,
  $sourceImage.Height,
  [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
)
$graphics = [System.Drawing.Graphics]::FromImage($sourceBitmap)
$graphics.DrawImage($sourceImage, 0, 0, $sourceImage.Width, $sourceImage.Height)
$graphics.Dispose()
$sourceImage.Dispose()

$rectangle = New-Object System.Drawing.Rectangle(0, 0, $sourceBitmap.Width, $sourceBitmap.Height)
$sourceData = $sourceBitmap.LockBits(
  $rectangle,
  [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
  [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
)

$sourceBytes = New-Object byte[] ($sourceData.Stride * $sourceData.Height)
[System.Runtime.InteropServices.Marshal]::Copy($sourceData.Scan0, $sourceBytes, 0, $sourceBytes.Length)
$sourceBitmap.UnlockBits($sourceData)

$transparentBitmap = New-Object System.Drawing.Bitmap(
  $sourceBitmap.Width,
  $sourceBitmap.Height,
  [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
)
$outputData = $transparentBitmap.LockBits(
  $rectangle,
  [System.Drawing.Imaging.ImageLockMode]::WriteOnly,
  [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
)
$outputBytes = New-Object byte[] ($outputData.Stride * $outputData.Height)

$minimumX = $sourceBitmap.Width
$minimumY = $sourceBitmap.Height
$maximumX = -1
$maximumY = -1

for ($y = 0; $y -lt $sourceBitmap.Height; $y++) {
  for ($x = 0; $x -lt $sourceBitmap.Width; $x++) {
    $sourceIndex = ($y * $sourceData.Stride) + ($x * 3)
    $outputIndex = ($y * $outputData.Stride) + ($x * 4)

    $blue = [int]$sourceBytes[$sourceIndex]
    $green = [int]$sourceBytes[$sourceIndex + 1]
    $red = [int]$sourceBytes[$sourceIndex + 2]
    $blueExcess = $blue - (($red + $green) / 2)
    $alpha = [Math]::Max(0, [Math]::Min(255, [int](($blueExcess - 18) * 5.5)))

    $outputBytes[$outputIndex] = [byte]$blue
    $outputBytes[$outputIndex + 1] = [byte]$green
    $outputBytes[$outputIndex + 2] = [byte]$red
    $outputBytes[$outputIndex + 3] = [byte]$alpha

    if ($alpha -gt 10) {
      $minimumX = [Math]::Min($minimumX, $x)
      $minimumY = [Math]::Min($minimumY, $y)
      $maximumX = [Math]::Max($maximumX, $x)
      $maximumY = [Math]::Max($maximumY, $y)
    }
  }
}

[System.Runtime.InteropServices.Marshal]::Copy($outputBytes, 0, $outputData.Scan0, $outputBytes.Length)
$transparentBitmap.UnlockBits($outputData)
$sourceBitmap.Dispose()

if ($maximumX -lt $minimumX -or $maximumY -lt $minimumY) {
  $transparentBitmap.Dispose()
  throw "No blue signature strokes were detected."
}

$padding = 20
$cropX = [Math]::Max(0, $minimumX - $padding)
$cropY = [Math]::Max(0, $minimumY - $padding)
$cropRight = [Math]::Min($transparentBitmap.Width - 1, $maximumX + $padding)
$cropBottom = [Math]::Min($transparentBitmap.Height - 1, $maximumY + $padding)
$cropRectangle = New-Object System.Drawing.Rectangle(
  $cropX,
  $cropY,
  ($cropRight - $cropX + 1),
  ($cropBottom - $cropY + 1)
)

$croppedBitmap = $transparentBitmap.Clone(
  $cropRectangle,
  [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
)
$transparentBitmap.Dispose()

$destinationDirectory = Split-Path -Parent $DestinationPath
if ($destinationDirectory) {
  New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
}

$croppedBitmap.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
$croppedBitmap.Dispose()

Write-Output "Created transparent signature: $DestinationPath"
