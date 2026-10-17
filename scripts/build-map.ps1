# Preserve source pixels in lossless tiles; the overview is only a loading preview.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$project = Split-Path $PSScriptRoot -Parent
$source = [System.Drawing.Bitmap]::FromFile((Join-Path $project 'OnePiece15 Map.png'))
$target = Join-Path $project 'public/maps/tiles'
New-Item -ItemType Directory -Path $target -Force | Out-Null
try {
    for ($y = 0; $y -lt $source.Height; $y += 1024) {
        for ($x = 0; $x -lt $source.Width; $x += 1024) {
            $rect = [System.Drawing.Rectangle]::new($x, $y, [Math]::Min(1024, $source.Width - $x), [Math]::Min(1024, $source.Height - $y))
            $tile = $source.Clone($rect, $source.PixelFormat)
            try { $tile.Save((Join-Path $target "$($x / 1024)-$($y / 1024).png"), [System.Drawing.Imaging.ImageFormat]::Png) }
            finally { $tile.Dispose() }
        }
    }
} finally { $source.Dispose() }
