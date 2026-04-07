import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Navbar } from "./components/Navbar";
import { MenuOverlay } from "./components/MenuOverlay";
import { Hero } from "./components/Hero";
import { Footer } from "./components/Footer";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { VideoCard } from "./components/VideoCard";
import backgroundImage from "../assets/images/dreamina_2026_03_08_6140_ard_id=_51794_}_{_action_dalle_text_.png";
import audioFile from "../assets/audio/ក្មេងក្បាលខូច.mp3";

type VideoItem = {
  id: string;
  src: string;
  title: string;
  durationLabel: string;
  tags: string[];
  createdAt: string;
};

// Videos are in public folder to avoid bundling.
const videos: VideoItem[] = [
  { id: "img-0859", src: "/videos/IMG_0859.mp4", title: "IMG_0859.MOV", durationLabel: "1:09", tags: ["cinematic", "street"], createdAt: "2026-03-08" },
  { id: "img-0950", src: "/videos/IMG_0950.mp4", title: "IMG_0950.MOV", durationLabel: "0:59", tags: ["cinematic", "portrait"], createdAt: "2026-03-08" },
  { id: "img-0949", src: "/videos/IMG_0949.mp4", title: "IMG_0949.MOV", durationLabel: "1:03", tags: ["night", "urban"], createdAt: "2026-03-08" },
];

const ALL_TAG = "all";
const MUTE_KEY = "ifong:pref:muted";
const SPEED_KEY = "ifong:pref:speed";
const LAST_VIDEO_KEY = "ifong:last:video";
const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === "true";
const ACCENT = "#DFFF00";
const ACCENT_BORDER = "rgba(223,255,0,0.5)";

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTag, setActiveTag] = useState(ALL_TAG);
  const [queue, setQueue] = useState<string[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string>(videos[0].id);
  const [initialMuted, setInitialMuted] = useState(true);
  const [initialSpeed, setInitialSpeed] = useState(1);
  const [shareStatus, setShareStatus] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tags = useMemo(() => {
    const allTags = new Set<string>();
    videos.forEach((v) => v.tags.forEach((tag) => allTags.add(tag)));
    return [ALL_TAG, ...Array.from(allTags)];
  }, []);

  const filteredVideos = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    return videos.filter((video) => {
      const inTag = activeTag === ALL_TAG || video.tags.includes(activeTag);
      const inSearch =
        normalized.length === 0 ||
        video.title.toLowerCase().includes(normalized) ||
        video.tags.some((tag) => tag.includes(normalized));
      return inTag && inSearch;
    });
  }, [activeTag, searchText]);

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
    if (typeof window === "undefined") return;
    const savedMuted = window.localStorage.getItem(MUTE_KEY);
    const savedSpeed = window.localStorage.getItem(SPEED_KEY);
    const urlId = new URLSearchParams(window.location.search).get("v");
    const savedVideoId = window.localStorage.getItem(LAST_VIDEO_KEY);

    if (savedMuted !== null) {
      setInitialMuted(savedMuted === "true");
    }
    if (savedSpeed) {
      const parsed = Number(savedSpeed);
      if (Number.isFinite(parsed) && parsed > 0) {
        setInitialSpeed(parsed);
      }
    }
    if (urlId && videos.some((video) => video.id === urlId)) {
      setActiveVideoId(urlId);
      return;
    }
    if (savedVideoId && videos.some((video) => video.id === savedVideoId)) {
      setActiveVideoId(savedVideoId);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LAST_VIDEO_KEY, activeVideoId);
    const url = new URL(window.location.href);
    url.searchParams.set("v", activeVideoId);
    window.history.replaceState({}, "", url.toString());
  }, [activeVideoId]);

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

  const handleQueueAdd = useCallback((videoId: string) => {
    setQueue((prev) => (prev.includes(videoId) ? prev : [...prev, videoId]));
  }, []);
  const handleQueuePlayNow = useCallback((videoId: string) => {
    setActiveVideoId(videoId);
    setQueue((prev) => prev.filter((id) => id !== videoId));
  }, []);

  const handleShare = useCallback(async (videoId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("v", videoId);
    try {
      if (navigator.share) {
        await navigator.share({ title: "iFong Video", url: url.toString() });
        setShareStatus("Share dialog opened.");
      } else {
        await navigator.clipboard.writeText(url.toString());
        setShareStatus("Copied deep link to clipboard.");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url.toString());
        setShareStatus("Copied deep link to clipboard.");
      } catch {
        setShareStatus("Unable to copy link on this device.");
      }
    }
  }, []);

  const handlePreferenceChange = useCallback((payload: { muted?: boolean; speed?: number }) => {
    if (typeof window === "undefined") return;
    if (typeof payload.muted === "boolean") {
      window.localStorage.setItem(MUTE_KEY, String(payload.muted));
    }
    if (typeof payload.speed === "number") {
      window.localStorage.setItem(SPEED_KEY, String(payload.speed));
    }
  }, []);

  const activeVideo = videos.find((video) => video.id === activeVideoId) ?? videos[0];
  const queueItems = queue.map((id) => videos.find((video) => video.id === id)).filter(Boolean) as VideoItem[];

  useEffect(() => {
    if (!ENABLE_ANALYTICS || typeof window === "undefined") return;
    const maybeVa = (window as Window & { va?: (...args: unknown[]) => void }).va;
    maybeVa?.("event", { name: "page_view", url: window.location.pathname + window.location.search });
  }, [activeVideoId]);

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
            <div className="mb-4 w-full max-w-[760px] rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:mb-8 sm:p-4">
              <div className="flex flex-col gap-3 sm:gap-4">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search videos or tags..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
                  style={{ boxShadow: `0 0 0 1px transparent`, borderColor: "rgba(255,255,255,0.1)" }}
                />
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag(tag)}
                      className="rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide transition"
                      style={{
                        borderColor: activeTag === tag ? ACCENT : "rgba(255,255,255,0.2)",
                        color: activeTag === tag ? ACCENT : "rgba(255,255,255,0.75)",
                        background: activeTag === tag ? "rgba(223,255,0,0.1)" : "rgba(255,255,255,0.02)",
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-white/60">
                  Now selected: <span className="text-white/90">{activeVideo.title}</span>
                  {" · "}
                  {activeVideo.durationLabel}
                </div>
                {shareStatus && (
                  <div className="rounded-lg border px-2 py-1 text-[11px]" style={{ borderColor: ACCENT_BORDER, color: ACCENT }}>
                    {shareStatus}
                  </div>
                )}
                {queueItems.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/75">
                    <div className="mb-2 text-white/60">Up next queue</div>
                    <div className="flex flex-col gap-1.5">
                      {queueItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleQueuePlayNow(item.id)}
                          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-left transition"
                          style={{ borderColor: "rgba(255,255,255,0.1)" }}
                        >
                          <span>{item.title}</span>
                          <span className="text-[10px] uppercase tracking-wide" style={{ color: ACCENT }}>
                            Play now
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                videoId={video.id}
                videoSrc={video.src}
                videoName={video.title}
                isActive={video.id === activeVideoId}
                onActivate={setActiveVideoId}
                onPlayNow={handleQueuePlayNow}
                onQueueAdd={handleQueueAdd}
                onShare={handleShare}
                onVideoPlay={handleVideoPlay}
                onVideoStop={handleVideoStop}
                initialMuted={initialMuted}
                initialSpeed={initialSpeed}
                onPreferenceChange={handlePreferenceChange}
              />
            ))}
            {filteredVideos.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-black/40 px-5 py-8 text-center text-sm text-white/60">
                No videos found for your current search/filter.
              </div>
            )}
          </div>
        </section>
        
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
