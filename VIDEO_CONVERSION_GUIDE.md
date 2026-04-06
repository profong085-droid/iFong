# Video Conversion Guide - MOV to MP4

## 📋 Overview

This guide will help you convert MOV video files to MP4 format for better browser compatibility.

---

## ⚠️ Current Situation

**Problem**: MOV files have limited browser support
- ✅ Works: Safari (Mac/iPhone)
- ⚠️ Issues: Chrome, Firefox, Edge on Windows

**Solution**: Convert to MP4 (H.264 + AAC) for universal compatibility

---

## 🎯 Quick Start

### Step 1: Install FFmpeg

Choose ONE of these methods:

#### **Method A: Download Pre-built Binary** (Recommended)

1. **Download**: https://www.gyan.dev/ffmpeg/builds/
   - Click on: `ffmpeg-release-essentials.zip`
   
2. **Extract**:
   - Unzip the file
   - Move folder to: `C:\ffmpeg`
   
3. **Add to PATH**:
   - Press `Win + X` → System
   - Advanced system settings → Environment Variables
   - Edit "Path" variable
   - Add: `C:\ffmpeg\bin`
   - Click OK on all dialogs

4. **Verify** (open NEW terminal):
   ```bash
   ffmpeg -version
   ```

#### **Method B: Using Chocolatey** (Requires Admin)

1. Right-click PowerShell → **Run as Administrator**
2. Run:
   ```powershell
   choco install ffmpeg -y
   ```
3. Close admin terminal

#### **Method C: Using Online Converter** (No Install)

If you can't install FFmpeg:
1. Go to: https://cloudconvert.com/mov-to-mp4
2. Upload each MOV file
3. Download MP4 version
4. Place in: `public/videos/`

---

### Step 2: Convert Videos

Once FFmpeg is installed, run the conversion script:

```powershell
# In your project directory
.\convert-videos.ps1
```

**Or manually run each command**:

```bash
# Convert IMG_0859
ffmpeg -i public/videos/IMG_0859.MOV -c:v libx264 -c:a aac -crf 23 -preset medium public/videos/IMG_0859.mp4

# Convert IMG_0950
ffmpeg -i public/videos/IMG_0950.MOV -c:v libx264 -c:a aac -crf 23 -preset medium public/videos/IMG_0950.mp4

# Convert IMG_0949
ffmpeg -i public/videos/IMG_0949.MOV -c:v libx264 -c:a aac -crf 23 -preset medium public/videos/IMG_0949.mp4
```

---

### Step 3: Verify Conversion

Check that MP4 files were created:

```powershell
Get-ChildItem public/videos/*.mp4 | Select-Object Name, @{N='Size(MB)';E={[math]::Round($_.Length/1MB,1)}}
```

Expected output:
```
Name           Size(MB)
----           --------
IMG_0859.mp4     ~45.0
IMG_0949.mp4      ~1.5
IMG_0950.mp4     ~28.0
```

---

### Step 4: Test Locally

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Open browser: http://localhost:5173

3. Scroll to video section

4. Videos should now play in ALL browsers ✅

---

### Step 5: Deploy to Production

1. Commit changes:
   ```bash
   git add .
   git commit -m "feat: Convert videos to MP4 for browser compatibility"
   git push origin master
   ```

2. Vercel will auto-deploy

3. Test on: https://ifongkhcom.vercel.app

---

## 🔧 FFmpeg Conversion Options Explained

```bash
ffmpeg -i input.MOV -c:v libx264 -c:a aac -crf 23 -preset medium output.mp4
```

| Option | Meaning | Recommended |
|--------|---------|-------------|
| `-i input.MOV` | Input file | Your MOV file |
| `-c:v libx264` | Video codec | H.264 (best compatibility) |
| `-c:a aac` | Audio codec | AAC (standard for web) |
| `-crf 23` | Quality (0-51) | 18-28 (lower = better) |
| `-preset medium` | Encoding speed | medium (good balance) |

### Quality Settings

- **CRF 18**: Visually lossless (larger file)
- **CRF 23**: Default (recommended)
- **CRF 28**: Smaller file, slightly lower quality

### Preset Options

- **ultrafast**: Fastest, largest file
- **medium**: Balanced (recommended)
- **veryslow**: Slowest, smallest file

---

## 📊 Expected Results

### Before (MOV)
- ❌ Limited browser support
- ❌ Large file sizes
- ❌ codec issues on Windows

### After (MP4)
- ✅ Works on ALL browsers
- ✅ Smaller file sizes (20-40% reduction)
- ✅ Universal compatibility
- ✅ Better streaming performance

---

## 🐛 Troubleshooting

### Error: "ffmpeg is not recognized"

**Cause**: FFmpeg not in PATH or terminal not refreshed

**Fix**:
1. Close ALL terminals
2. Open NEW terminal
3. Run: `ffmpeg -version`

### Error: "File not found"

**Cause**: Wrong file path

**Fix**:
```powershell
# Check if files exist
Get-ChildItem public/videos/*.MOV
```

### Error: "Permission denied"

**Cause**: File in use or no permissions

**Fix**:
1. Close video player if open
2. Run terminal as Administrator

### Videos still not playing

**Check**:
1. MP4 files exist in `public/videos/`
2. File names match exactly (case-sensitive)
3. Browser console for errors (F12)

---

## 📝 File Structure

After conversion, your `public/videos/` folder should contain:

```
public/videos/
├── IMG_0859.MOV    (original - 52.2 MB)
├── IMG_0859.mp4    (converted - ~45 MB) ✅
├── IMG_0950.MOV    (original - 33.6 MB)
├── IMG_0950.mp4    (converted - ~28 MB) ✅
├── IMG_0949.MOV    (original - 1.9 MB)
└── IMG_0949.mp4    (converted - ~1.5 MB) ✅
```

**Note**: Keep original MOV files as backup. They won't affect the build size.

---

## 🎓 Additional Resources

- **FFmpeg Documentation**: https://ffmpeg.org/documentation.html
- **H.264 Encoding Guide**: https://trac.ffmpeg.org/wiki/Encode/H.264
- **Video Compression Tips**: https://www.youtube.com/watch?v=whnbaDUW8YI

---

## ✅ Checklist

- [ ] FFmpeg installed and working
- [ ] All 3 videos converted to MP4
- [ ] MP4 files in `public/videos/`
- [ ] App.tsx updated to use .mp4
- [ ] Tested locally in Chrome
- [ ] Tested locally in Firefox
- [ ] Tested locally in Edge
- [ ] Pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Tested on production URL

---

## 🆘 Need Help?

If you encounter issues:

1. Check browser console (F12) for errors
2. Verify MP4 files exist in correct location
3. Test MP4 files directly: http://localhost:5173/videos/IMG_0949.mp4
4. Check FFmpeg version: `ffmpeg -version`

---

**Good luck! 🚀**
