
# Cinematic iOS App Design (iFong)

A premium video platform with cinematic design, featuring glassmorphic video controls, neon accents, and mobile-optimized responsive layout. Built with React, Vite, Tailwind CSS, and Framer Motion.

**Live Demo**: [View on Vercel](https://ifong.vercel.app)  
**Repository**: [github.com/profong085-droid/iFong](https://github.com/profong085-droid/iFong)  
**Full Analysis**: [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md)

## ✨ Features

- 🎬 **Premium Video Player** with glassmorphic controls
- ✨ **Neon Accent Design** (#DFFF00) with gaming-inspired aesthetics
- 📱 **Mobile-Optimized** responsive controls
- ⚡ **Auto-play** when videos scroll into view
- 🎮 **Interactive Controls**: Play/pause, skip, mute, speed adjustment
- ⏩ **Double-tap to skip** ±10 seconds
- 🔄 **Playback speed control** (0.5x - 2x)
- 💾 **Download capability** for videos
- 🎨 **Framer Motion animations** for smooth transitions
- 🌙 **Auto-hide controls** with smart timeout

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Modern web browser

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The development server will start at `http://localhost:5173`.

## 📁 Project Structure

```
Cinematic iOS App Design/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── VideoCard.tsx          # Premium video player component
│   │   │   ├── Hero.tsx               # Hero section with parallax
│   │   │   ├── Navbar.tsx             # Navigation bar
│   │   │   ├── Footer.tsx             # Footer component
│   │   │   └── ui/                    # UI components
│   │   ├── App.tsx                    # Main application component
│   │   └── hooks/                     # Custom React hooks
│   ├── assets/
│   │   ├── videos/                    # Video files (.MOV, .mp4)
│   │   ├── images/                    # Image assets
│   │   └── audio/                     # Audio files
│   ├── styles/                        # Global styles
│   └── main.tsx                       # Entry point
├── public/                            # Static assets
├── dist/                              # Production build
├── package.json                       # Dependencies and scripts
├── vite.config.ts                     # Vite configuration
├── tailwind.config.js                 # Tailwind CSS configuration
└── README.md                          # This file
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **MUI** - Material-UI components

## 🌐 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Vercel will auto-detect Vite configuration
4. Click Deploy

**Build Settings** (auto-detected):
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Deploy to GitHub Pages

1. Update `vite.config.ts` with your base path:
```typescript
export default defineConfig({
  base: '/YOUR_REPO_NAME/',
  // ... rest of config
})
```

2. Add deploy script to `package.json`:
```json
{
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}
```

3. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

4. Deploy:
```bash
npm run deploy
```

### Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/YOUR_REPO)

Build settings:
- Build command: `npm run build`
- Publish directory: `dist`

## 🎨 Customization

### Change Neon Accent Color

Update the `NEON_ACCENT` constant in `src/app/components/VideoCard.tsx`:

```typescript
const NEON_ACCENT = "#DFFF00"; // Change to your brand color
```

### Add/Remove Videos

Edit `src/app/App.tsx`:

```typescript
import video1 from "../assets/videos/your-video.mov";

const videos = [
  { src: video1, name: "Your Video Name" },
  // Add more videos here
];
```

### Modify Video Player

The main video player component is located at:
`src/app/components/VideoCard.tsx`

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, open an issue in the GitHub repository.

---

**Built with ❤️ using React, Vite, and Framer Motion**