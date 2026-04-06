# Video Conversion Script
# Run this AFTER installing FFmpeg

Write-Host "Converting MOV files to MP4 format..." -ForegroundColor Cyan
Write-Host ""

# Check if FFmpeg is installed
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    Write-Host "ERROR: FFmpeg is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install FFmpeg first:" -ForegroundColor Yellow
    Write-Host "  Option 1: Download from https://www.gyan.dev/ffmpeg/builds/" -ForegroundColor Yellow
    Write-Host "  Option 2: Run 'choco install ffmpeg -y' as Administrator" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "FFmpeg found: $($ffmpeg.Source)" -ForegroundColor Green
Write-Host ""

# Create videos directory if it doesn't exist
$videosDir = "public/videos"
if (-not (Test-Path $videosDir)) {
    New-Item -ItemType Directory -Path $videosDir -Force | Out-Null
}

# Conversion function
function Convert-Video {
    param(
        [string]$InputFile,
        [string]$OutputFile
    )
    
    if (-not (Test-Path $InputFile)) {
        Write-Host "SKIP: $InputFile not found" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "Converting: $InputFile -> $OutputFile" -ForegroundColor Cyan
    
    $inputSize = (Get-Item $InputFile).Length
    $inputSizeMB = [math]::Round($inputSize / 1MB, 2)
    Write-Host "  Input size: ${inputSizeMB} MB" -ForegroundColor Gray
    
    $startTime = Get-Date
    
    # Run FFmpeg conversion
    & ffmpeg -i $InputFile -c:v libx264 -c:a aac -crf 23 -preset medium $OutputFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        $outputSize = (Get-Item $OutputFile).Length
        $outputSizeMB = [math]::Round($outputSize / 1MB, 2)
        $savings = [math]::Round((1 - ($outputSize / $inputSize)) * 100, 1)
        
        Write-Host "  Output size: ${outputSizeMB} MB" -ForegroundColor Green
        Write-Host "  Time: $([math]::Round($duration, 1))s" -ForegroundColor Green
        if ($savings -gt 0) {
            Write-Host "  Size reduction: ${savings}%" -ForegroundColor Green
        }
        Write-Host "  SUCCESS!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  FAILED!" -ForegroundColor Red
        return $false
    }
    Write-Host ""
}

# Convert videos
Write-Host "=== Starting Video Conversion ===" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$totalCount = 0

# IMG_0859
$totalCount++
if (Convert-Video -InputFile "$videosDir/IMG_0859.MOV" -OutputFile "$videosDir/IMG_0859.mp4") {
    $successCount++
}

# IMG_0950
$totalCount++
if (Convert-Video -InputFile "$videosDir/IMG_0950.MOV" -OutputFile "$videosDir/IMG_0950.mp4") {
    $successCount++
}

# IMG_0949
$totalCount++
if (Convert-Video -InputFile "$videosDir/IMG_0949.MOV" -OutputFile "$videosDir/IMG_0949.mp4") {
    $successCount++
}

Write-Host ""
Write-Host "=== Conversion Complete ===" -ForegroundColor Cyan
Write-Host "Success: $successCount / $totalCount" -ForegroundColor Green
Write-Host ""

if ($successCount -eq $totalCount) {
    Write-Host "Next step: Update App.tsx to use .mp4 files" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "All videos converted successfully!" -ForegroundColor Green
} else {
    Write-Host "Some conversions failed. Check the errors above." -ForegroundColor Red
}
