import { useState, useEffect, useRef, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { MenuOverlay } from "./components/MenuOverlay";
import { Hero } from "./components/Hero";
import { Footer } from "./components/Footer";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { VideoCard } from "./components/VideoCard";
import backgroundImage from "../assets/images/dreamina_2026_03_08_6140_ard_id=_51794_}_{_action_dalle_text_.png";
import audioFile from "../assets/audio/ក្មេងក្បាលខូច.mp3";

// Videos are in public folder to avoid bundling
// Using MP4 format for maximum browser compatibility
const videos = [
  { src: "/videos/IMG_0859.mp4", name: "IMG_0859.MOV" },
  { src: "/videos/IMG_0950.mp4", name: "IMG_0950.MOV" },
  { src: "/videos/IMG_0949.mp4", name: "IMG_0949.MOV" },
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Callback to stop background music when any video plays
  const handleVideoPlay = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset to beginning
      audioRef.current.volume = 0; // Mute completely
      console.log('✅ Background music STOPPED completely for video playback');
    }
  }, []);

  // Callback to resume background music when video exits viewport
  const handleVideoStop = useCallback(() => {
    if (audioRef.current) {
      // Check if any other video is still playing
      const videos = document.querySelectorAll('video');
      let anyVideoPlaying = false;
      
      videos.forEach((video) => {
        if (!video.paused && !video.ended) {
          anyVideoPlaying = true;
        }
      });

      // Only resume if no other videos are playing
      if (!anyVideoPlaying) {
        audioRef.current.volume = 0.5; // Restore volume
        audioRef.current.play().then(() => {
          console.log('🎵 Background music RESUMED after video exited viewport');
        }).catch((error) => {
          console.log('⚠️ Could not resume background music:', error);
        });
      }
    }
  }, []);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(audioFile);
    audioRef.current.loop = true; // Loop the audio
    audioRef.current.volume = 0.5; // Set volume to 50%

    // Try to play audio after 3 seconds
    const timer = setTimeout(async () => {
      try {
        await audioRef.current?.play();
        console.log('Audio playing successfully');
      } catch (error) {
        console.warn('Auto-play blocked by browser. User interaction required.', error);
        // Browser blocked autoplay - will try on first user interaction
        const enableAudio = () => {
          audioRef.current?.play();
          document.removeEventListener('click', enableAudio);
          document.removeEventListener('keydown', enableAudio);
        };
        document.addEventListener('click', enableAudio);
        document.addEventListener('keydown', enableAudio);
      }
    }, 3000);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <ErrorBoundary onError={(error) => console.error(error)}>
      <div
        className="min-h-screen overflow-x-hidden"
        style={{ background: "#000000" }}
      >
        {/* Fixed Navbar */}
        <Navbar onMenuToggle={() => setIsMenuOpen((o) => !o)} isMenuOpen={isMenuOpen} />

        {/* Full-screen Menu Overlay */}
        <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        {/* ── Sections ── */}
        <Hero backgroundImage={backgroundImage} />
        
        {/* Video Section - Multiple videos */}
        <section
          className="py-8 px-3 sm:py-14 sm:px-6"
          style={{ background: "#000000" }}
        >
          <div className="mx-auto flex max-w-[1920px] flex-col items-center">
            {videos.map((video, index) => (
              <VideoCard
                key={index}
                videoSrc={video.src}
                videoName={video.name}
                onVideoPlay={handleVideoPlay}
                onVideoStop={handleVideoStop}
              />
            ))}
          </div>
        </section>
        
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
