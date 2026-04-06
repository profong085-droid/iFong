import { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { MenuOverlay } from "./components/MenuOverlay";
import { Hero } from "./components/Hero";
import { Footer } from "./components/Footer";
import { ErrorBoundary } from "./components/ErrorBoundary";
import backgroundImage from "../assets/images/dreamina_2026_03_08_6140_ard_id=_51794_}_{_action_dalle_text_.png";
import audioFile from "../assets/audio/ក្មេងក្បាលខូច.mp3";

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  console.log('Background image path:', backgroundImage);

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
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
