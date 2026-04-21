import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Navbar } from "./components/Navbar";
import { MenuOverlay } from "./components/MenuOverlay";
import { Hero } from "./components/Hero";
import { Footer } from "./components/Footer";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { VideoCard } from "./components/VideoCard";
import { Volume2, VolumeX } from "lucide-react";
import backgroundImage from "../assets/images/dreamina_2026_03_08_6140_ard_id=_51794_}_{_action_dalle_text_.png";
import audioFile from "../assets/audio/speech-25184.mp3";
import {
  listenAuthState,
  postCommunityComment,
  postCommunityReply,
  subscribeCommunityComments,
  type CommunityComment,
} from "./lib/firebaseAuth";

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
type ReactionMap = { like: number; fire: number; wow: number };

// Videos are in public folder to avoid bundling.
const videos: VideoItem[] = [
  { id: "img-0859", src: "/videos/IMG_0859.mp4", title: "IMG_0859.MOV", durationLabel: "1:09", tags: ["cinematic", "street"], createdAt: "2026-03-08" },
  { id: "img-0950", src: "/videos/IMG_0950.mp4", title: "IMG_0950.MOV", durationLabel: "0:59", tags: ["cinematic", "portrait"], createdAt: "2026-03-08" },
  { id: "img-0949", src: "/videos/IMG_0949.mp4", title: "IMG_0949.MOV", durationLabel: "1:03", tags: ["night", "urban"], createdAt: "2026-03-08" },
  { id: "img-1718", src: "/videos/Img 1718.mp4", title: "Img 1718.mp4", durationLabel: "1:24", tags: ["cinematic", "travel"], createdAt: "2026-04-21" },
];

const ALL_TAG = "all";
const MUTE_KEY = "ifong:pref:muted";
const SPEED_KEY = "ifong:pref:speed";
const LAST_VIDEO_KEY = "ifong:last:video";
const FAVORITES_KEY = "ifong:favorites";
const HISTORY_KEY = "ifong:history";
const AUTONEXT_KEY = "ifong:autoplay-next";
const REACTIONS_KEY = "ifong:reactions";
const WATCH_SECONDS_KEY = "ifong:watch-seconds";
const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === "true";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ACCENT = "#DFFF00";
const ACCENT_BORDER = "rgba(223,255,0,0.5)";
const BG_AUDIO_VOLUME = 0.8;
const BG_AUDIO_DUCKED_VOLUME = 0.35;
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
  "img-1718": {
    qualities: [{ label: "Auto", src: "/videos/Img 1718.mp4" }, { label: "High", src: "/videos/Img 1718.mp4" }, { label: "Medium", src: "/videos/Img 1718.mp4" }],
    transcript: [
      { at: 0, text: "New cinematic opening sequence." },
      { at: 20, text: "Subject movement through natural light." },
      { at: 48, text: "Final frame with smooth handheld motion." },
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
  const [authUser, setAuthUser] = useState<{ name: string; email: string } | null>(null);
  const [communityComments, setCommunityComments] = useState<CommunityComment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [aiBusyId, setAiBusyId] = useState<string | null>(null);
  const [reactionsByVideo, setReactionsByVideo] = useState<Record<string, ReactionMap>>({});
  const [watchSecondsByVideo, setWatchSecondsByVideo] = useState<Record<string, number>>({});
  const [isBgAudioMuted, setIsBgAudioMuted] = useState(false);
  const [bgAudioNeedsTap, setBgAudioNeedsTap] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgAudioUnlockedRef = useRef(false);
  const isBgAudioMutedRef = useRef(false);

  useEffect(() => {
    isBgAudioMutedRef.current = isBgAudioMuted;
  }, [isBgAudioMuted]);

  const tryPlayBackgroundAudio = useCallback(async (targetVolume = BG_AUDIO_VOLUME) => {
    if (!audioRef.current || isBgAudioMutedRef.current) return false;
    audioRef.current.volume = targetVolume;
    try {
      await audioRef.current.play();
      bgAudioUnlockedRef.current = true;
      setBgAudioNeedsTap(false);
      return true;
    } catch {
      setBgAudioNeedsTap(true);
      return false;
    }
  }, []);

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

  // Keep background music audible by ducking volume when video plays.
  const handleVideoPlay = useCallback(() => {
    if (audioRef.current) {
      if (isBgAudioMuted) return;
      audioRef.current.volume = BG_AUDIO_DUCKED_VOLUME;
      if (audioRef.current.paused) {
        void tryPlayBackgroundAudio(BG_AUDIO_DUCKED_VOLUME);
      }
      console.log("🎵 Background music ducked while video plays");
    }
  }, [isBgAudioMuted, tryPlayBackgroundAudio]);

  // Restore volume when no videos are actively playing.
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
      if (!anyVideoPlaying && !isBgAudioMuted) {
        audioRef.current.volume = BG_AUDIO_VOLUME; // Restore volume
        void tryPlayBackgroundAudio(BG_AUDIO_VOLUME).then((ok) => {
          if (ok) {
            console.log("🎵 Background music restored after video exited viewport");
          }
        });
      }
    }
  }, [isBgAudioMuted, tryPlayBackgroundAudio]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedMuted = window.localStorage.getItem(MUTE_KEY);
    const savedSpeed = window.localStorage.getItem(SPEED_KEY);
    const urlId = new URLSearchParams(window.location.search).get("v");
    const savedVideoId = window.localStorage.getItem(LAST_VIDEO_KEY);
    const savedFavorites = window.localStorage.getItem(FAVORITES_KEY);
    const savedHistory = window.localStorage.getItem(HISTORY_KEY);
    const savedAutoNext = window.localStorage.getItem(AUTONEXT_KEY);
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
    window.localStorage.setItem(REACTIONS_KEY, JSON.stringify(reactionsByVideo));
  }, [reactionsByVideo]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WATCH_SECONDS_KEY, JSON.stringify(watchSecondsByVideo));
  }, [watchSecondsByVideo]);

  useEffect(() => {
    // Create audio element once; avoid resetting playback on state updates.
    audioRef.current = new Audio(audioFile);
    audioRef.current.loop = true;
    audioRef.current.preload = "auto";
    audioRef.current.volume = BG_AUDIO_VOLUME;

    const timer = setTimeout(() => {
      void tryPlayBackgroundAudio(BG_AUDIO_VOLUME);
    }, 1200);

    const unlockOnInteract = () => {
      if (bgAudioUnlockedRef.current || isBgAudioMutedRef.current) return;
      void tryPlayBackgroundAudio(BG_AUDIO_VOLUME);
    };
    document.addEventListener("pointerdown", unlockOnInteract);
    document.addEventListener("keydown", unlockOnInteract);
    document.addEventListener("touchstart", unlockOnInteract, { passive: true });

    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      document.removeEventListener("pointerdown", unlockOnInteract);
      document.removeEventListener("keydown", unlockOnInteract);
      document.removeEventListener("touchstart", unlockOnInteract);
    };
  }, [tryPlayBackgroundAudio]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isBgAudioMuted) {
      audioRef.current.pause();
      audioRef.current.volume = 0;
      return;
    }
    audioRef.current.volume = BG_AUDIO_VOLUME;
    void tryPlayBackgroundAudio(BG_AUDIO_VOLUME);
  }, [isBgAudioMuted, tryPlayBackgroundAudio]);

  const handleToggleBackgroundAudio = useCallback(() => {
    const nextMuted = !isBgAudioMuted;
    setIsBgAudioMuted(nextMuted);
    if (!audioRef.current) return;
    if (nextMuted) {
      audioRef.current.pause();
      audioRef.current.volume = 0;
      return;
    }
    bgAudioUnlockedRef.current = false;
    audioRef.current.volume = BG_AUDIO_VOLUME;
    const anyVideoPlaying = Array.from(document.querySelectorAll("video")).some(
      (video) => !video.paused && !video.ended,
    );
    if (!anyVideoPlaying) {
      void tryPlayBackgroundAudio(BG_AUDIO_VOLUME);
    }
  }, [isBgAudioMuted, tryPlayBackgroundAudio]);

  const handleStartBackgroundAudio = useCallback(() => {
    setIsBgAudioMuted(false);
    if (!audioRef.current) return;
    audioRef.current.volume = BG_AUDIO_VOLUME;
    void tryPlayBackgroundAudio(BG_AUDIO_VOLUME);
  }, [tryPlayBackgroundAudio]);

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
  useEffect(() => {
    const unsubscribe = listenAuthState((user) => {
      if (!user) {
        setAuthUser(null);
        return;
      }
      setAuthUser({
        name: user.displayName || "Viewer",
        email: user.email || "",
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeCommunityComments(activeVideoId, setCommunityComments);
    return unsubscribe;
  }, [activeVideoId]);

  const handleAddComment = useCallback(async () => {
    const text = commentInput.trim();
    if (!text || !authUser) return;
    await postCommunityComment({
      videoId: activeVideoId,
      text,
      authorName: authUser.name,
      authorEmail: authUser.email,
    });
    setCommentInput("");
  }, [activeVideoId, commentInput, authUser]);
  const handleReply = useCallback(
    async (commentId: string) => {
      const text = (replyInputs[commentId] || "").trim();
      if (!text || !authUser) return;
      await postCommunityReply({
        commentId,
        text,
        authorName: authUser.name,
        authorEmail: authUser.email,
      });
      setReplyInputs((prev) => ({ ...prev, [commentId]: "" }));
    },
    [replyInputs, authUser],
  );
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
  const activeComments = communityComments;
  const activeReactions = reactionsByVideo[activeVideoId] ?? { like: 0, fire: 0, wow: 0 };
  const totalViews = Object.keys(watchSecondsByVideo).length;
  const totalWatchMinutes = (Object.values(watchSecondsByVideo).reduce((a, b) => a + b, 0) / 60).toFixed(1);

  useEffect(() => {
    if (!ENABLE_ANALYTICS || typeof window === "undefined") return;
    const maybeVa = (window as Window & { va?: (...args: unknown[]) => void }).va;
    maybeVa?.("event", { name: "page_view", url: window.location.pathname + window.location.search });
  }, [activeVideoId]);

  const handleGenerateAiReply = useCallback(
    async (commentId: string, originalText: string) => {
      if (!authUser || !GEMINI_API_KEY) return;
      setAiBusyId(commentId);
      try {
        const prompt = `Write a short friendly reply (max 1 sentence) to this user comment for a cinematic video community: "${originalText}"`;
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          },
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!text) return;
        await postCommunityReply({
          commentId,
          text,
          authorName: `${authUser.name} (AI)`,
          authorEmail: authUser.email,
        });
      } finally {
        setAiBusyId(null);
      }
    },
    [authUser],
  );

  return (
    <ErrorBoundary onError={(error) => console.error(error)}>
      <div
        className="min-h-screen overflow-x-hidden"
        style={{ background: "#000000" }}
      >
        {/* Fixed Navbar */}
        <Navbar onMenuToggle={() => setIsMenuOpen((o) => !o)} isMenuOpen={isMenuOpen} />
        {bgAudioNeedsTap && !isBgAudioMuted && (
          <button
            type="button"
            onClick={handleStartBackgroundAudio}
            className="fixed bottom-20 right-4 z-40 rounded-full border bg-black/80 px-3 py-2 text-xs font-semibold backdrop-blur-md transition hover:bg-black/90 sm:bottom-24 sm:right-6"
            style={{ borderColor: ACCENT_BORDER, color: ACCENT }}
          >
            Tap to start music
          </button>
        )}
        <button
          type="button"
          onClick={handleToggleBackgroundAudio}
          className="fixed bottom-5 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border bg-black/70 backdrop-blur-md transition hover:bg-black/85 sm:bottom-6 sm:right-6"
          style={{ borderColor: ACCENT_BORDER, color: ACCENT }}
          aria-label={isBgAudioMuted ? "Turn on background audio" : "Turn off background audio"}
          title={isBgAudioMuted ? "Turn on background audio" : "Turn off background audio"}
        >
          {isBgAudioMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

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
            <div className="mt-4 w-full max-w-[760px] rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white/90">Comments & Reactions</div>
                  <div className="text-[11px] text-white/50">Community feedback for {activeVideo.title}</div>
                </div>
                <div className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] text-white/65">
                  {activeComments.length} comments
                </div>
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleReaction("like")}
                  className="rounded-xl border border-white/15 bg-black/40 px-2 py-2 text-xs text-white/85 transition hover:border-[#DFFF00]/40 hover:bg-[#DFFF00]/10"
                >
                  <span className="mr-1">👍</span>{activeReactions.like}
                </button>
                <button
                  type="button"
                  onClick={() => handleReaction("fire")}
                  className="rounded-xl border border-white/15 bg-black/40 px-2 py-2 text-xs text-white/85 transition hover:border-[#DFFF00]/40 hover:bg-[#DFFF00]/10"
                >
                  <span className="mr-1">🔥</span>{activeReactions.fire}
                </button>
                <button
                  type="button"
                  onClick={() => handleReaction("wow")}
                  className="rounded-xl border border-white/15 bg-black/40 px-2 py-2 text-xs text-white/85 transition hover:border-[#DFFF00]/40 hover:bg-[#DFFF00]/10"
                >
                  <span className="mr-1">😮</span>{activeReactions.wow}
                </button>
              </div>

              <div className="mb-3 flex gap-2">
                <input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddComment();
                  }}
                  placeholder="Write a comment..."
                  className="w-full rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#DFFF00]/50"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!authUser}
                  className="rounded-xl border px-3 py-2 text-sm font-medium transition hover:bg-[#DFFF00]/10"
                  style={{ borderColor: ACCENT_BORDER, color: ACCENT }}
                >
                  Post
                </button>
              </div>
              {!authUser && (
                <div className="mb-2 text-[11px] text-amber-300/90">
                  Please login first to post comments and replies.
                </div>
              )}

              <div className="max-h-44 space-y-2 overflow-auto pr-1">
                {activeComments.map((c) => (
                  <div key={c.id} className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-[#DFFF00]">{c.authorName}</span>
                      <span className="text-[10px] text-white/45">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-xs text-white/80">{c.text}</div>
                    {c.replies.length > 0 && (
                      <div className="mt-2 space-y-1 rounded-lg border border-white/10 bg-black/30 p-2">
                        {c.replies.map((r) => (
                          <div key={r.id} className="text-[11px] text-white/75">
                            <span className="text-[#DFFF00]">{r.authorName}</span>: {r.text}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <input
                        value={replyInputs[c.id] || ""}
                        onChange={(e) => setReplyInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            void handleReply(c.id);
                          }
                        }}
                        placeholder="Reply..."
                        disabled={!authUser}
                        className="w-full rounded-lg border border-white/10 bg-black/45 px-2 py-1 text-[11px] text-white placeholder:text-white/35"
                      />
                      <button
                        type="button"
                        onClick={() => void handleReply(c.id)}
                        disabled={!authUser}
                        className="rounded-lg border border-white/20 px-2 py-1 text-[11px] text-white/80"
                      >
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleGenerateAiReply(c.id, c.text)}
                        disabled={!authUser || !GEMINI_API_KEY || aiBusyId === c.id}
                        className="rounded-lg border border-[#DFFF00]/40 px-2 py-1 text-[11px] text-[#DFFF00]"
                      >
                        {aiBusyId === c.id ? "AI..." : "AI Reply"}
                      </button>
                    </div>
                  </div>
                ))}
                {activeComments.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 bg-black/25 px-3 py-5 text-center text-xs text-white/45">
                    No comments yet. Be the first to react.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
