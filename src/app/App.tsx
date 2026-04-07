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
type TranscriptItem = { at: number; text: string };
type VideoMeta = {
  qualities: Array<{ label: "Auto" | "High" | "Medium"; src: string }>;
  transcript: TranscriptItem[];
};
type CommentItem = { id: string; text: string; createdAt: number };
type ReactionMap = { like: number; fire: number; wow: number };

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
const FAVORITES_KEY = "ifong:favorites";
const HISTORY_KEY = "ifong:history";
const AUTONEXT_KEY = "ifong:autoplay-next";
const COMMENTS_KEY = "ifong:comments";
const REACTIONS_KEY = "ifong:reactions";
const WATCH_SECONDS_KEY = "ifong:watch-seconds";
const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === "true";
const ACCENT = "#DFFF00";
const ACCENT_BORDER = "rgba(223,255,0,0.5)";
const videoMetaById: Record<string, VideoMeta> = {
  "img-0859": {
    qualities: [{ label: "Auto", src: "/videos/IMG_0859.mp4" }, { label: "High", src: "/videos/IMG_0859.mp4" }, { label: "Medium", src: "/videos/IMG_0859.mp4" }],
    transcript: [
      { at: 0, text: "Opening cinematic scene." },
      { at: 12, text: "Camera moves into the street lights." },
      { at: 28, text: "Subject passes through frame." },
      { at: 45, text: "Final motion and fade." },
    ],
  },
  "img-0950": {
    qualities: [{ label: "Auto", src: "/videos/IMG_0950.mp4" }, { label: "High", src: "/videos/IMG_0950.mp4" }, { label: "Medium", src: "/videos/IMG_0950.mp4" }],
    transcript: [
      { at: 0, text: "Portrait composition starts." },
      { at: 15, text: "Close-up detail appears." },
      { at: 35, text: "Background bokeh transition." },
    ],
  },
  "img-0949": {
    qualities: [{ label: "Auto", src: "/videos/IMG_0949.mp4" }, { label: "High", src: "/videos/IMG_0949.mp4" }, { label: "Medium", src: "/videos/IMG_0949.mp4" }],
    transcript: [
      { at: 0, text: "Night urban atmosphere." },
      { at: 18, text: "Neon highlights and motion." },
      { at: 40, text: "End shot with slow drift." },
    ],
  },
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTag, setActiveTag] = useState(ALL_TAG);
  const [queue, setQueue] = useState<string[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string>(videos[0].id);
  const [initialMuted, setInitialMuted] = useState(true);
  const [initialSpeed, setInitialSpeed] = useState(1);
  const [shareStatus, setShareStatus] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [historyMap, setHistoryMap] = useState<Record<string, number>>({});
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [miniPlayerDismissed, setMiniPlayerDismissed] = useState(false);
  const [commentsByVideo, setCommentsByVideo] = useState<Record<string, CommentItem[]>>({});
  const [commentInput, setCommentInput] = useState("");
  const [reactionsByVideo, setReactionsByVideo] = useState<Record<string, ReactionMap>>({});
  const [watchSecondsByVideo, setWatchSecondsByVideo] = useState<Record<string, number>>({});
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
      const inFavorites = !showFavoritesOnly || favorites.includes(video.id);
      return inTag && inSearch && inFavorites;
    });
  }, [activeTag, searchText, showFavoritesOnly, favorites]);

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
    const savedFavorites = window.localStorage.getItem(FAVORITES_KEY);
    const savedHistory = window.localStorage.getItem(HISTORY_KEY);
    const savedAutoNext = window.localStorage.getItem(AUTONEXT_KEY);
    const savedComments = window.localStorage.getItem(COMMENTS_KEY);
    const savedReactions = window.localStorage.getItem(REACTIONS_KEY);
    const savedWatch = window.localStorage.getItem(WATCH_SECONDS_KEY);

    if (savedMuted !== null) {
      setInitialMuted(savedMuted === "true");
    }
    if (savedSpeed) {
      const parsed = Number(savedSpeed);
      if (Number.isFinite(parsed) && parsed > 0) {
        setInitialSpeed(parsed);
      }
    }
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites) as string[];
        if (Array.isArray(parsed)) setFavorites(parsed);
      } catch {
        setFavorites([]);
      }
    }
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory) as Record<string, number>;
        setHistoryMap(parsed);
      } catch {
        setHistoryMap({});
      }
    }
    if (savedAutoNext !== null) {
      setAutoPlayNext(savedAutoNext === "true");
    }
    if (savedComments) {
      try { setCommentsByVideo(JSON.parse(savedComments) as Record<string, CommentItem[]>); } catch {}
    }
    if (savedReactions) {
      try { setReactionsByVideo(JSON.parse(savedReactions) as Record<string, ReactionMap>); } catch {}
    }
    if (savedWatch) {
      try { setWatchSecondsByVideo(JSON.parse(savedWatch) as Record<string, number>); } catch {}
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
    if (typeof window === "undefined") return;
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(historyMap));
  }, [historyMap]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AUTONEXT_KEY, String(autoPlayNext));
  }, [autoPlayNext]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COMMENTS_KEY, JSON.stringify(commentsByVideo));
  }, [commentsByVideo]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(REACTIONS_KEY, JSON.stringify(reactionsByVideo));
  }, [reactionsByVideo]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WATCH_SECONDS_KEY, JSON.stringify(watchSecondsByVideo));
  }, [watchSecondsByVideo]);

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
  const handleToggleFavorite = useCallback((videoId: string) => {
    setFavorites((prev) => (prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]));
  }, []);
  const handleTimePersist = useCallback((videoId: string, time: number) => {
    setHistoryMap((prev) => {
      const last = prev[videoId] ?? 0;
      if (Math.abs(last - time) < 1.5) return prev;
      return { ...prev, [videoId]: time };
    });
  }, []);
  const handleVideoEnded = useCallback((videoId: string) => {
    if (!autoPlayNext) return;
    setQueue((prev) => {
      if (prev.length > 0) {
        const [nextId, ...rest] = prev;
        setActiveVideoId(nextId);
        return rest;
      }
      const visible = filteredVideos.length > 0 ? filteredVideos : videos;
      const currentIndex = visible.findIndex((v) => v.id === videoId);
      if (currentIndex >= 0 && currentIndex < visible.length - 1) {
        setActiveVideoId(visible[currentIndex + 1].id);
      }
      return prev;
    });
  }, [autoPlayNext, filteredVideos]);
  const handleAddComment = useCallback(() => {
    const text = commentInput.trim();
    if (!text) return;
    setCommentsByVideo((prev) => {
      const existing = prev[activeVideoId] ?? [];
      return {
        ...prev,
        [activeVideoId]: [...existing, { id: crypto.randomUUID(), text, createdAt: Date.now() }],
      };
    });
    setCommentInput("");
  }, [activeVideoId, commentInput]);
  const handleReaction = useCallback((kind: keyof ReactionMap) => {
    setReactionsByVideo((prev) => {
      const current = prev[activeVideoId] ?? { like: 0, fire: 0, wow: 0 };
      return { ...prev, [activeVideoId]: { ...current, [kind]: current[kind] + 1 } };
    });
  }, [activeVideoId]);
  const handleWatchProgress = useCallback((videoId: string, currentTime: number) => {
    setWatchSecondsByVideo((prev) => {
      const previous = prev[videoId] ?? 0;
      if (currentTime <= previous) return prev;
      return { ...prev, [videoId]: currentTime };
    });
  }, []);

  const activeVideo = videos.find((video) => video.id === activeVideoId) ?? videos[0];
  const queueItems = queue.map((id) => videos.find((video) => video.id === id)).filter(Boolean) as VideoItem[];
  const activeComments = commentsByVideo[activeVideoId] ?? [];
  const activeReactions = reactionsByVideo[activeVideoId] ?? { like: 0, fire: 0, wow: 0 };
  const totalViews = Object.keys(watchSecondsByVideo).length;
  const totalWatchMinutes = (Object.values(watchSecondsByVideo).reduce((a, b) => a + b, 0) / 60).toFixed(1);

  useEffect(() => {
    if (!ENABLE_ANALYTICS || typeof window === "undefined") return;
    const maybeVa = (window as Window & { va?: (...args: unknown[]) => void }).va;
    maybeVa?.("event", { name: "page_view", url: window.location.pathname + window.location.search });
  }, [activeVideoId]);

  useEffect(() => {
    const onScroll = () => {
      if (miniPlayerDismissed) return;
      const activeCard = document.querySelector(`[data-video-card-id="${activeVideoId}"]`) as HTMLElement | null;
      if (!activeCard) {
        setShowMiniPlayer(false);
        return;
      }
      const rect = activeCard.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const visible = rect.top < viewportH * 0.85 && rect.bottom > viewportH * 0.15;
      setShowMiniPlayer(!visible);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [activeVideoId, miniPlayerDismissed]);

  useEffect(() => {
    setMiniPlayerDismissed(false);
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
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFavoritesOnly((v) => !v)}
                    className="rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide transition"
                    style={{
                      borderColor: showFavoritesOnly ? ACCENT : "rgba(255,255,255,0.2)",
                      color: showFavoritesOnly ? ACCENT : "rgba(255,255,255,0.75)",
                    }}
                  >
                    Favorites only
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoPlayNext((v) => !v)}
                    className="rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide transition"
                    style={{
                      borderColor: autoPlayNext ? ACCENT : "rgba(255,255,255,0.2)",
                      color: autoPlayNext ? ACCENT : "rgba(255,255,255,0.75)",
                    }}
                  >
                    Autoplay next: {autoPlayNext ? "On" : "Off"}
                  </button>
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
                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/75">
                  Stats · Views: {totalViews} · Watch: {totalWatchMinutes}m · Favorites: {favorites.length}
                </div>
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
                isFavorite={favorites.includes(video.id)}
                onToggleFavorite={handleToggleFavorite}
                resumeTime={historyMap[video.id] ?? 0}
                onTimePersist={handleTimePersist}
                onVideoEnded={handleVideoEnded}
                transcript={videoMetaById[video.id]?.transcript ?? []}
                qualityOptions={videoMetaById[video.id]?.qualities ?? [{ label: "Auto", src: video.src }]}
                onWatchProgress={handleWatchProgress}
              />
            ))}
            {filteredVideos.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-black/40 px-5 py-8 text-center text-sm text-white/60">
                No videos found for your current search/filter.
              </div>
            )}
            <div className="mt-4 w-full max-w-[760px] rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
              <div className="mb-2 text-sm font-semibold text-white/85">Comments & Reactions</div>
              <div className="mb-2 flex gap-2">
                <button type="button" onClick={() => handleReaction("like")} className="rounded-full border border-white/15 px-2 py-1 text-xs text-white/80">👍 {activeReactions.like}</button>
                <button type="button" onClick={() => handleReaction("fire")} className="rounded-full border border-white/15 px-2 py-1 text-xs text-white/80">🔥 {activeReactions.fire}</button>
                <button type="button" onClick={() => handleReaction("wow")} className="rounded-full border border-white/15 px-2 py-1 text-xs text-white/80">😮 {activeReactions.wow}</button>
              </div>
              <div className="mb-2 flex gap-2">
                <input value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Write a comment..." className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40" />
                <button type="button" onClick={handleAddComment} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: ACCENT_BORDER, color: ACCENT }}>Post</button>
              </div>
              <div className="max-h-36 space-y-1 overflow-auto text-xs text-white/70">
                {activeComments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1">{c.text}</div>
                ))}
                {activeComments.length === 0 && <div className="text-white/45">No comments yet.</div>}
              </div>
            </div>
          </div>
        </section>
        
        <Footer />
        {showMiniPlayer && (
          <div className="fixed bottom-4 right-4 z-50 w-[220px] overflow-hidden rounded-xl border border-white/15 bg-black/75 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 px-2 py-1 text-[10px] text-white/75">
              <span>Mini player · {activeVideo.title}</span>
              <button
                type="button"
                onClick={() => {
                  setShowMiniPlayer(false);
                  setMiniPlayerDismissed(true);
                }}
                className="ml-2 rounded border border-white/15 px-1 text-[10px] leading-none text-white/80 hover:bg-white/10"
                aria-label="Close mini player"
              >
                X
              </button>
            </div>
            <video
              key={`mini-${activeVideo.id}`}
              src={activeVideo.src}
              className="aspect-video w-full"
              controls
              playsInline
              muted
              preload="metadata"
              style={{ objectFit: "cover" }}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
