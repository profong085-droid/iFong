import { memo, useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Download, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Maximize,
  Gauge,
  Film,
  Share2,
  ListPlus,
  Heart
} from "lucide-react";

interface VideoCardProps {
  videoId?: string;
  videoSrc: string;
  videoName: string;
  isActive?: boolean;
  onActivate?: (videoId: string) => void;
  onPlayNow?: (videoId: string) => void;
  onQueueAdd?: (videoId: string) => void;
  onShare?: (videoId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (videoId: string) => void;
  resumeTime?: number;
  onTimePersist?: (videoId: string, time: number) => void;
  onVideoEnded?: (videoId: string) => void;
  initialMuted?: boolean;
  initialSpeed?: number;
  onPreferenceChange?: (payload: { muted?: boolean; speed?: number }) => void;
  onVideoPlay: () => void;
  onVideoStop?: () => void;
}

/** Site brand neon (same as Navbar / Hero / Footer) */
const ACCENT = "#DFFF00";
const ACCENT_SOFT = "rgba(223, 255, 0, 0.28)";

export const VideoCard = memo(function VideoCard({
  videoId,
  videoSrc,
  videoName,
  isActive = false,
  onActivate,
  onPlayNow,
  onQueueAdd,
  onShare,
  isFavorite = false,
  onToggleFavorite,
  resumeTime = 0,
  onTimePersist,
  onVideoEnded,
  initialMuted = true,
  initialSpeed = 1,
  onPreferenceChange,
  onVideoPlay,
  onVideoStop,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(initialSpeed);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [doubleTapPosition, setDoubleTapPosition] = useState<'left' | 'right' | null>(null);
  const lastTapRef = useRef<number>(0);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showInitialLoader, setShowInitialLoader] = useState(true);
  const [preloadMode, setPreloadMode] = useState<"metadata" | "auto">("metadata");
  const lastPersistRef = useRef(0);

  useEffect(() => {
    setIsMuted(initialMuted);
  }, [initialMuted]);

  useEffect(() => {
    setPlaybackSpeed(initialSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = initialSpeed;
    }
  }, [initialSpeed]);

  // Auto-hide controls logic
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Update progress bar
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100 || 0);
      if (videoId && onTimePersist) {
        const now = Date.now();
        if (now - lastPersistRef.current > 2000) {
          lastPersistRef.current = now;
          onTimePersist(videoId, video.currentTime);
        }
      }
    };

    const updateBuffered = () => {
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('progress', updateBuffered);
    
    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('progress', updateBuffered);
    };
  }, [videoId, onTimePersist]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resumeTime || resumeTime < 2) return;
    const applyResume = () => {
      const maxResume = Math.max(0, (video.duration || 0) - 2);
      video.currentTime = Math.min(resumeTime, maxResume || resumeTime);
    };
    video.addEventListener("loadedmetadata", applyResume, { once: true });
    return () => video.removeEventListener("loadedmetadata", applyResume);
  }, [resumeTime, videoSrc]);

  // Detect mobile screen to lighten behavior on phones
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Intersection Observer for auto-play when visible (desktop / large screens only)
  useEffect(() => {
    if (isMobile) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current
            .play()
            .then(() => {
              setIsPlaying(true);
              onVideoPlay(); // Stop background music
              resetControlsTimeout();
            })
            .catch((err) => {
              console.log("Auto-play prevented:", err);
            });
        } else if (!entry.isIntersecting && videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
          }
          // Notify parent to resume background music
          if (onVideoStop) {
            onVideoStop();
          }
        }
      },
      { threshold: 0.6 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isMobile, onVideoPlay, onVideoStop, resetControlsTimeout]);

  // Avoid endless spinner on slow mobile networks and ensure loader always settles.
  useEffect(() => {
    setVideoLoaded(false);
    setError(false);
    setShowInitialLoader(true);
    setPreloadMode("metadata");
    const timer = setTimeout(() => {
      setShowInitialLoader(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [videoSrc]);

  // Double-tap to skip
  const handleDoubleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const relativeX = x - rect.left;
    const isLeft = relativeX < rect.width / 2;

    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setDoubleTapPosition(isLeft ? 'left' : 'right');
      setTimeout(() => setDoubleTapPosition(null), 600);
      
      const video = videoRef.current;
      if (video) {
        video.currentTime = isLeft 
          ? Math.max(0, video.currentTime - 10) 
          : Math.min(video.duration, video.currentTime + 10);
      }
    }
    lastTapRef.current = now;
  }, []);

  // Handle video play/pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      if (videoId && onActivate) {
        onActivate(videoId);
      }
      onVideoPlay();
      if (isMobile) {
        setPreloadMode("auto");
      }
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        resetControlsTimeout();
      }).catch((err) => {
        console.log('Play failed:', err);
      });
    }
  }, [isMobile, isPlaying, onActivate, onVideoPlay, resetControlsTimeout, videoId]);

  // Handle mute toggle
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const newMutedState = !videoRef.current.muted;
    videoRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
    onPreferenceChange?.({ muted: newMutedState });
  }, [onPreferenceChange]);

  // Handle seek
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = (percentage / 100) * videoRef.current.duration;
    }
  }, []);

  // Handle speed change
  const handleSpeedChange = useCallback((speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
      onPreferenceChange?.({ speed });
    }
  }, [onPreferenceChange]);

  // Handle video download
  const handleDownload = useCallback(() => {
    if (!videoSrc) return;
    const link = document.createElement('a');
    link.href = videoSrc;
    link.download = videoName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [videoSrc, videoName]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle video loaded
  const handleLoaded = useCallback(() => {
    setVideoLoaded(true);
    setShowInitialLoader(false);
    setError(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  // Handle video error
  const handleError = useCallback(() => {
    setError(true);
    setVideoLoaded(false);
    setShowInitialLoader(false);
    console.error(`❌ Failed to load video: ${videoSrc}`);
    console.error('Video element error:', videoRef.current?.error);
  }, [videoSrc]);

  // Speed options
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const videoExtension = videoSrc.split('.').pop()?.toLowerCase();
  const videoType =
    videoExtension === "mp4"
      ? "video/mp4"
      : videoExtension === "mov"
        ? "video/quicktime"
        : videoExtension === "webm"
          ? "video/webm"
          : "video/mp4";

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative mx-auto mb-5 w-full max-w-[22.5rem] last:mb-0 min-[400px]:max-w-[24rem] sm:mb-10 sm:max-w-xl md:mb-12 md:max-w-2xl lg:max-w-[760px]"
    >
      {/* Video card — compact on phone (iOS-style tile), wider on tablet+ */}
      <div 
        className="group relative mx-auto w-full overflow-hidden rounded-[18px] bg-zinc-950 ring-1 ring-white/15 sm:rounded-[1.35rem]"
        style={{
          boxShadow: `
            0 0 0 2px ${ACCENT},
            0 0 22px ${ACCENT_SOFT},
            0 18px 50px rgba(0,0,0,0.52),
            inset 0 0 0 1px rgba(255,255,255,0.06)
          `,
        }}
        onMouseMove={resetControlsTimeout}
        onMouseLeave={() => {
          if (isPlaying) {
            setShowControls(false);
          }
        }}
        onClick={handleDoubleTap}
      >
        {/* Video element */}
        {!error ? (
          <div className="relative w-full aspect-video bg-black">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full cursor-pointer"
              playsInline
              loop={false}
              muted={isMuted}
              preload={isMobile ? preloadMode : "auto"}
              crossOrigin="anonymous"
              onLoadedData={handleLoaded}
              onCanPlay={handleLoaded}
              onError={handleError}
              onEnded={() => {
                setIsPlaying(false);
                if (videoId && onVideoEnded) {
                  onVideoEnded(videoId);
                }
              }}
              style={{
                objectFit: 'cover',
              }}
            >
              <source src={videoSrc} type={videoType} />
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <div className="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center px-4">
              <Film className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 text-sm">Failed to load video</p>
              <p className="text-white/30 text-xs mt-2">{videoName}</p>
            </div>
          </div>
        )}

        {/* Custom Loading Spinner */}
        {!videoLoaded && !error && showInitialLoader && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
            <motion.div
              className="relative w-14 h-14 sm:w-16 sm:h-16"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            >
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={ACCENT}
                  strokeWidth="2.5"
                  strokeDasharray="283"
                  strokeDashoffset="200"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>
          </div>
        )}

        {/* Double-tap skip overlay */}
        <AnimatePresence>
          {doubleTapPosition && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className={`absolute top-1/2 -translate-y-1/2 ${
                doubleTapPosition === 'left' ? 'left-1/4' : 'right-1/4'
              } -translate-x-1/2 pointer-events-none`}
            >
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/15 shadow-lg"
              >
                {doubleTapPosition === 'left' ? (
                  <SkipBack className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" strokeWidth={2.5} />
                ) : (
                  <SkipForward className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" strokeWidth={2.5} />
                )}
              </div>
              <p className="text-white text-[10px] sm:text-xs font-bold text-center mt-1 sm:mt-2 drop-shadow-lg">
                {doubleTapPosition === 'left' ? '-10s' : '+10s'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls overlay */}
        {!error && (
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-28 sm:h-32 pointer-events-none"
                  style={{
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
                  }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 h-40 sm:h-52 pointer-events-none"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)",
                  }}
                />

                {/* Title row — app-style header */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-2 top-2 right-12 flex flex-col gap-0.5 sm:left-4 sm:top-4 sm:right-16 sm:gap-1"
                >
                  <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-black/40 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white/65 backdrop-blur-sm sm:px-2 sm:text-[10px]">
                    Video
                  </span>
                  <h3 className="truncate text-xs font-semibold tracking-tight text-white drop-shadow-md sm:text-sm md:text-base">
                    {videoName}
                  </h3>
                  {isActive && (
                    <span className="inline-flex w-fit items-center rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#DFFF00] sm:px-2 sm:text-[10px]">
                      Selected
                    </span>
                  )}
                </motion.div>

                {/* Center play — OTT primary action */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_10px_28px_rgba(0,0,0,0.4)] ring-2 ring-black/25 sm:h-[4.25rem] sm:w-[4.25rem] sm:shadow-[0_12px_40px_rgba(0,0,0,0.45)] sm:ring-4 md:h-20 md:w-20"
                    style={{ backgroundColor: isPlaying ? "rgba(255,255,255,0.92)" : ACCENT }}
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 text-zinc-900 sm:h-8 sm:w-8" fill="currentColor" strokeWidth={0} />
                    ) : (
                      <Play className="ml-0.5 h-5 w-5 text-white sm:h-8 sm:w-8" fill="currentColor" strokeWidth={0} />
                    )}
                  </motion.button>
                </div>

                {/* Floating Control Pods - Bottom */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 md:bottom-5 md:left-5 md:right-5"
                >
                  <div
                    ref={progressRef}
                    className="group/progress relative mb-1 flex h-5 cursor-pointer touch-none items-center sm:mb-3 sm:h-9 md:h-10"
                    onClick={handleSeek}
                  >
                    <div className="absolute w-full overflow-hidden rounded-full bg-white/12 h-1 sm:h-1.5 md:h-2">
                      <motion.div className="h-full bg-white/18" style={{ width: `${buffered}%` }} />
                    </div>
                    <motion.div
                      className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full sm:h-1.5 md:h-2"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: ACCENT,
                        boxShadow: `0 0 12px ${ACCENT_SOFT}`,
                      }}
                    />
                    <motion.div
                      className="absolute top-1/2 h-2 w-2 rounded-full border border-white opacity-100 shadow-md sm:h-3 sm:w-3 sm:border-2 sm:opacity-0 sm:group-hover/progress:opacity-100 md:h-3.5 md:w-3.5"
                      style={{
                        left: `${progress}%`,
                        transform: "translate(-50%, -50%)",
                        backgroundColor: ACCENT,
                        borderColor: "rgba(255,255,255,0.95)",
                      }}
                    />
                  </div>

                  <div className="flex flex-row flex-wrap items-center justify-between gap-x-1 gap-y-1 rounded-lg border border-white/[0.1] bg-black/50 px-1.5 py-1 backdrop-blur-md sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3 sm:backdrop-blur-xl">
                    <div className="flex min-w-0 flex-1 items-center gap-0.5 sm:gap-2">
                      <motion.button
                        type="button"
                        onClick={togglePlay}
                        whileTap={{ scale: 0.94 }}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/12 text-white active:bg-white/22 sm:h-11 sm:w-11"
                      >
                        {isPlaying ? (
                          <Pause className="h-3.5 w-3.5 sm:h-5 sm:w-5" fill="currentColor" strokeWidth={0} />
                        ) : (
                          <Play className="ml-px h-3.5 w-3.5 sm:h-5 sm:w-5" fill="currentColor" strokeWidth={0} />
                        )}
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                          }
                        }}
                        whileTap={{ scale: 0.94 }}
                        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/15 sm:flex"
                      >
                        <SkipBack className="h-5 w-5" />
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
                          }
                        }}
                        whileTap={{ scale: 0.94 }}
                        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/15 sm:flex"
                      >
                        <SkipForward className="h-5 w-5" />
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={toggleMute}
                        whileTap={{ scale: 0.94 }}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/85 active:bg-white/15 sm:h-10 sm:w-10"
                      >
                        {isMuted ? (
                          <VolumeX className="h-3.5 w-3.5 text-white/55 sm:h-5 sm:w-5" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                        )}
                      </motion.button>

                      <div className="hidden min-w-0 font-mono text-[11px] font-medium tabular-nums text-white/60 sm:block sm:text-xs">
                        <span className="text-white/90">{formatTime(currentTime)}</span>
                        <span className="mx-0.5 text-white/35">/</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    <div className="flex w-auto shrink-0 items-center gap-1 sm:gap-2">
                      <div className="font-mono text-[9px] tabular-nums text-white/50 sm:hidden">
                        {formatTime(currentTime)}/{formatTime(duration)}
                      </div>
                      <div className="relative flex items-center gap-1 sm:gap-2">
                        <motion.button
                          type="button"
                          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                          whileTap={{ scale: 0.94 }}
                          className="flex h-7 min-w-[1.85rem] items-center justify-center gap-px rounded-full bg-white/10 px-1 text-[9px] font-semibold leading-none text-white/90 active:bg-white/15 sm:h-10 sm:min-w-[2.75rem] sm:gap-1 sm:px-2.5 sm:text-xs"
                        >
                          <Gauge className="h-3 w-3 shrink-0 opacity-[0.85] sm:h-4 sm:w-4" />
                          <span>{playbackSpeed}x</span>
                        </motion.button>

                        <AnimatePresence>
                          {showSpeedMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-10 right-0 w-[4.75rem] overflow-hidden rounded-md sm:bottom-12 sm:w-[5.25rem] sm:rounded-lg"
                              style={{
                                background: 'rgba(15, 15, 15, 0.95)',
                                backdropFilter: 'blur(30px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
                              }}
                            >
                              {speedOptions.map((speed) => (
                                <motion.button
                                  key={speed}
                                  onClick={() => handleSpeedChange(speed)}
                                  whileHover={{ backgroundColor: `${ACCENT}20` }}
                                  className={`w-full px-1.5 py-1 text-[10px] font-semibold leading-tight transition-colors sm:px-2 sm:py-1.5 sm:text-[11px] ${
                                    playbackSpeed === speed ? 'text-white' : 'text-white/60'
                                  }`}
                                  style={{
                                    background: playbackSpeed === speed ? `${ACCENT}15` : 'transparent',
                                  }}
                                >
                                  {speed}x
                                  {playbackSpeed === speed && (
                                    <motion.span
                                      className="ml-0.5 text-[9px] sm:text-[10px]"
                                      style={{ color: ACCENT }}
                                    >
                                      ✓
                                    </motion.span>
                                  )}
                                </motion.button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <motion.button
                          type="button"
                          onClick={handleDownload}
                          whileTap={{ scale: 0.94 }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/90 active:bg-white/15 sm:h-10 sm:w-10"
                          aria-label="Download video"
                        >
                          <Download className="h-3.5 w-3.5 sm:h-5 sm:w-5" style={{ color: ACCENT }} />
                        </motion.button>
                        {videoId && onShare && (
                          <motion.button
                            type="button"
                            onClick={() => onShare(videoId)}
                            whileTap={{ scale: 0.94 }}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/90 active:bg-white/15 sm:h-10 sm:w-10"
                            aria-label="Share video"
                          >
                            <Share2 className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                          </motion.button>
                        )}
                        {videoId && onToggleFavorite && (
                          <motion.button
                            type="button"
                            onClick={() => onToggleFavorite(videoId)}
                            whileTap={{ scale: 0.94 }}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/90 active:bg-white/15 sm:h-10 sm:w-10"
                            aria-label="Favorite video"
                          >
                            <Heart
                              className="h-3.5 w-3.5 sm:h-5 sm:w-5"
                              style={{ color: isFavorite ? ACCENT : undefined }}
                              fill={isFavorite ? ACCENT : "none"}
                            />
                          </motion.button>
                        )}
                        {videoId && onQueueAdd && (
                          <motion.button
                            type="button"
                            onClick={() => onQueueAdd(videoId)}
                            whileTap={{ scale: 0.94 }}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/90 active:bg-white/15 sm:h-10 sm:w-10"
                            aria-label="Add to queue"
                          >
                            <ListPlus className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                          </motion.button>
                        )}
                        {videoId && onPlayNow && (
                          <motion.button
                            type="button"
                            onClick={() => onPlayNow(videoId)}
                            whileTap={{ scale: 0.94 }}
                            className="hidden h-7 items-center justify-center rounded-full bg-white/10 px-2 text-[10px] font-semibold uppercase tracking-wide text-white/90 active:bg-white/15 sm:flex sm:h-10 sm:px-3"
                            style={{ color: ACCENT }}
                            aria-label="Play now"
                          >
                            Play now
                          </motion.button>
                        )}

                        <motion.button
                          type="button"
                          onClick={() => {
                            if (containerRef.current) {
                              if (!document.fullscreenElement) {
                                containerRef.current.requestFullscreen();
                              } else {
                                document.exitFullscreen();
                              }
                            }
                          }}
                          whileTap={{ scale: 0.94 }}
                          className="hidden h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/85 active:bg-white/15 sm:flex sm:h-10 sm:w-10"
                          aria-label="Fullscreen"
                        >
                          <Maximize className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Playing indicator - Top right */}
                {isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2 py-0.5 backdrop-blur-md sm:right-4 sm:top-4 sm:gap-1.5 sm:px-2.5 sm:py-1"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(223,255,0,0.65)]"
                      style={{ backgroundColor: ACCENT }}
                    />
                    <span className="text-[10px] font-semibold tabular-nums text-white/90 sm:text-xs">
                      {playbackSpeed}x
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
});
