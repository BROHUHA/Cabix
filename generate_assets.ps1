Add-Type -AssemblyName System.Drawing

function Generate-Laurel {
    param([string]$path, [bool]$flip)
    
    $width = 96
    $height = 146
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(237, 228, 216))
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(237, 228, 216), 2.5)

    # Draw curved stem
    $pathStem = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pathStem.AddBezier(70, 138, 55, 95, 30, 50, 15, 12)
    $g.DrawPath($pen, $pathStem)

    # Add leaves along the stem
    $leafPairs = @(
        @{t=0.15; len=22; angle=40},
        @{t=0.32; len=24; angle=45},
        @{t=0.48; len=26; angle=50},
        @{t=0.64; len=24; angle=55},
        @{t=0.80; len=22; angle=60},
        @{t=0.92; len=18; angle=65},
        @{t=1.00; len=16; angle=0} # Top leaf
    )

    foreach ($leaf in $leafPairs) {
        $t = $leaf.t
        # Point on bezier curve
        $p0 = New-Object System.Drawing.PointF(70, 138)
        $p1 = New-Object System.Drawing.PointF(55, 95)
        $p2 = New-Object System.Drawing.PointF(30, 50)
        $p3 = New-Object System.Drawing.PointF(15, 12)

        $cx = (1-$t)*(1-$t)*(1-$t)*$p0.X + 3*(1-$t)*(1-$t)*$t*$p1.X + 3*(1-$t)*$t*$t*$p2.X + $t*$t*$t*$p3.X
        $cy = (1-$t)*(1-$t)*(1-$t)*$p0.Y + 3*(1-$t)*(1-$t)*$t*$p1.Y + 3*(1-$t)*$t*$t*$p2.Y + $t*$t*$t*$p3.Y

        if ($leaf.angle -eq 0) {
            # Single top leaf
            $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
            $gp.AddEllipse($cx - 5, $cy - 12, 10, 18)
            $g.FillPath($brush, $gp)
        } else {
            # Outer leaf (pointing left/up)
            $state1 = $g.Save()
            $g.TranslateTransform($cx, $cy)
            $g.RotateTransform(-$leaf.angle)
            $g.FillEllipse($brush, -$leaf.len, -6, $leaf.len, 12)
            $g.Restore($state1)

            # Inner leaf (pointing right/up)
            $state2 = $g.Save()
            $g.TranslateTransform($cx, $cy)
            $g.RotateTransform($leaf.angle - 25)
            $g.FillEllipse($brush, 0, -6, ($leaf.len * 0.8), 12)
            $g.Restore($state2)
        }
    }

    if ($flip) {
        $bmp.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX)
    }

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

function Generate-Trophy {
    param([string]$path)
    $w = 48
    $h = 48
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(237, 228, 216))
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(237, 228, 216), 3)

    # Cup body
    $g.FillRectangle($brush, 14, 8, 20, 14)
    $g.FillPie($brush, 14, 10, 20, 24, 0, 180)
    
    # Handles
    $g.DrawArc($pen, 7, 9, 12, 16, 90, 180)
    $g.DrawArc($pen, 29, 9, 12, 16, 270, 180)

    # Stem and Base
    $g.FillRectangle($brush, 21, 30, 6, 8)
    $g.FillRectangle($brush, 12, 38, 24, 5)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

function Generate-Shuffle {
    param([string]$path)
    $w = 48
    $h = 48
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(237, 228, 216), 3.5)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    # Arrow 1: top-left to bottom-right curve
    $p1 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p1.AddBezier(10, 14, 22, 14, 26, 34, 38, 34)
    $g.DrawPath($pen, $p1)

    # Arrowhead 1 at (38, 34)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(237, 228, 216))
    $pts1 = @(
        (New-Object System.Drawing.PointF(38, 34)),
        (New-Object System.Drawing.PointF(30, 29)),
        (New-Object System.Drawing.PointF(30, 39))
    )
    $g.FillPolygon($brush, $pts1)

    # Arrow 2: bottom-left to top-right curve
    $p2 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p2.AddBezier(10, 34, 22, 34, 26, 14, 38, 14)
    $g.DrawPath($pen, $p2)

    # Arrowhead 2 at (38, 14)
    $pts2 = @(
        (New-Object System.Drawing.PointF(38, 14)),
        (New-Object System.Drawing.PointF(30, 9)),
        (New-Object System.Drawing.PointF(30, 19))
    )
    $g.FillPolygon($brush, $pts2)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Generate-Laurel -path "public/assets/images/laurel-left.png" -flip $false
Generate-Laurel -path "public/assets/images/laurel-right.png" -flip $true
Generate-Trophy -path "public/assets/images/icon-trophy.png"
Generate-Shuffle -path "public/assets/images/icon-shuffle.png"
Write-Host "Assets generated successfully!"
