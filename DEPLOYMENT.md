# 🚀 Deployment Guide

This guide will walk you through deploying the Cinematic iOS App to various platforms.

## 📋 Pre-deployment Checklist

- [ ] All dependencies are installed (`npm install`)
- [ ] App runs locally without errors (`npm run dev`)
- [ ] Production build works (`npm run build`)
- [ ] Update `package.json` metadata (name, description, repository URL)
- [ ] Update video files in `src/assets/videos/`
- [ ] Test all video playback and controls
- [ ] Remove or update `.env.local` if it contains sensitive data

---

## 🌐 Vercel Deployment (Recommended)

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **Deploy to Production**
```bash
vercel --prod
```

### Option 2: Deploy via GitHub Integration

1. **Push code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration
   - Click "Deploy"

3. **Auto-deployment**
   - Every push to `main` branch will trigger automatic deployment
   - Preview deployments for pull requests

### Vercel Configuration

The `vercel.json` file is already configured with:
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ SPA routing rewrites
- ✅ Asset caching headers

---

## 🐙 GitHub Pages Deployment

### Option 1: Using gh-pages package

1. **Install gh-pages**
```bash
npm install --save-dev gh-pages
```

2. **Update vite.config.ts**
```typescript
export default defineConfig({
  base: '/YOUR_REPO_NAME/', // Replace with your repo name
  plugins: [react(), tailwindcss()],
  // ... rest of config
})
```

3. **Add deploy script to package.json**
```json
{
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}
```

4. **Deploy**
```bash
npm run build
npm run deploy
```

5. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: `gh-pages` branch
   - Your site will be at: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

### Option 2: Using GitHub Actions

1. **Create workflow file** `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 🎨 Netlify Deployment

### Option 1: Deploy via Netlify CLI

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login and Deploy**
```bash
netlify login
netlify deploy --prod
```

### Option 2: Deploy via GitHub Integration

1. **Go to [netlify.com](https://netlify.com)**
2. **Click "Add new site" → "Import an existing project"**
3. **Connect to GitHub and select your repository**
4. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **Click "Deploy site"**

---

## 📦 Railway Deployment

1. **Go to [railway.app](https://railway.app)**
2. **Click "New Project" → "Deploy from GitHub repo"**
3. **Select your repository**
4. **Railway will auto-detect Node.js**
5. **Add environment variables if needed**
6. **Deploy**

---

## 🔧 Platform-Specific Configurations

### Environment Variables

If you need environment variables, create:
- `.env.production` - For production builds
- `.env.development` - For development

Example:
```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=Cinematic iOS App
```

### Large File Handling (Git LFS)

If video files are too large for Git (>100MB):

1. **Install Git LFS**
```bash
git lfs install
```

2. **Track large files**
```bash
git lfs track "*.MOV"
git lfs track "*.mp4"
git lfs track "*.mp3"
```

3. **Update .gitattributes** (already created)
```
*.MOV filter=lfs diff=lfs merge=lfs -text
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.mp3 filter=lfs diff=lfs merge=lfs -text
```

4. **Commit and push**
```bash
git add .gitattributes
git commit -m "Configure Git LFS for media files"
```

---

## 🚨 Common Deployment Issues

### Issue: 404 on page refresh (SPA routing)

**Solution**: Already fixed in `vercel.json` with rewrites configuration.

For other platforms, add `_redirects` file in `public/`:
```
/*    /index.html   200
```

### Issue: Assets not loading

**Solution**: Check `base` path in `vite.config.ts`:
- Vercel/Netlify: `base: '/'`
- GitHub Pages: `base: '/repo-name/'`

### Issue: Videos not playing

**Solutions**:
1. Check video file paths are correct
2. Verify videos are in `src/assets/videos/`
3. For large videos, use Git LFS or host externally
4. Check browser console for CORS errors

### Issue: Build fails

**Solutions**:
1. Run `npm run type-check` to find TypeScript errors
2. Run `npm run build` locally to test
3. Check Node.js version (18+ required)
4. Clear cache: `rm -rf node_modules dist && npm install`

---

## ✅ Post-Deployment Checklist

- [ ] Site loads without errors
- [ ] All videos play correctly
- [ ] Controls work on mobile and desktop
- [ ] Auto-play functions properly
- [ ] Download buttons work
- [ ] No console errors
- [ ] SSL certificate is active (HTTPS)
- [ ] Custom domain configured (optional)
- [ ] Environment variables set (if any)

---

## 🔗 Quick Deploy Links

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/YOUR_REPO)

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/YOUR_USERNAME/YOUR_REPO)

---

## 📞 Support

Having deployment issues? 
- Check the [README.md](README.md)
- Open an [Issue](https://github.com/YOUR_USERNAME/YOUR_REPO/issues)
- Review platform-specific documentation

**Happy Deploying! 🎉**
