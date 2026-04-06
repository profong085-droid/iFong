import { useRef, useEffect, useState, useCallback } from "react";
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
  Settings,
  Film
} from "lucide-react";

interface VideoCardProps {
  videoSrc: string;
  videoName: string;
  onVideoPlay: () => void;
  onVideoStop?: () => void;
}

const NEON_ACCENT = "#DFFF00";

export function VideoCard({ videoSrc, videoName, onVideoPlay, onVideoStop }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [doubleTapPosition, setDoubleTapPosition] = useState<'left' | 'right' | null>(null);
  const lastTapRef = useRef<number>(0);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showInitialLoader, setShowInitialLoader] = useState(true);

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
  }, []);

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

  // Avoid endless spinner on slow mobile networks
  useEffect(() => {
    setShowInitialLoader(true);
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
      onVideoPlay();
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        resetControlsTimeout();
      }).catch((err) => {
        console.log('Play failed:', err);
      });
    }
  }, [isPlaying, onVideoPlay, resetControlsTimeout]);

  // Handle mute toggle
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const newMutedState = !videoRef.current.muted;
    videoRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
  }, []);

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
    }
  }, []);

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
  const handleLoaded = () => {
    setVideoLoaded(true);
    setError(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Handle video error
  const handleError = () => {
    setError(true);
    setVideoLoaded(false);
    console.error(`❌ Failed to load video: ${videoSrc}`);
    console.error('Video element error:', videoRef.current?.error);
  };

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
      className="relative mb-10 sm:mb-12 md:mb-14 last:mb-0"
    >
      {/* Video container with cinematic border */}
      <div 
        className="relative mx-auto w-full max-w-[760px] rounded-2xl sm:rounded-3xl overflow-hidden group"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(15,15,15,0.95) 100%)',
          boxShadow: `
            0 20px 60px rgba(0,0,0,0.8),
            0 0 0 1px rgba(255,255,255,0.05),
            inset 0 1px 0 rgba(255,255,255,0.05)
          `,
        }}
        onMouseMove={() => {
          setIsHovering(true);
          resetControlsTimeout();
        }}
        onMouseLeave={() => {
          setIsHovering(false);
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
              loop={!isMobile}
              muted={isMuted}
              preload="metadata"
              crossOrigin="anonymous"
              onLoadedMetadata={handleLoaded}
              onError={handleError}
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
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <motion.div
              className="relative w-20 h-20"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            >
              {/* Neon ring spinner */}
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
                  stroke={NEON_ACCENT}
                  strokeWidth="3"
                  strokeDasharray="283"
                  strokeDashoffset="200"
                  strokeLinecap="round"
                  style={{
                    filter: `drop-shadow(0 0 8px ${NEON_ACCENT})`,
                  }}
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
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle, ${NEON_ACCENT}30 0%, transparent 70%)`,
                  backdropFilter: 'blur(20px)',
                  border: `2px solid ${NEON_ACCENT}50`,
                  boxShadow: `0 0 30px ${NEON_ACCENT}40`,
                }}
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
        {videoLoaded && (
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                {/* Top gradient overlay */}
                <div 
                  className="absolute top-0 left-0 right-0 h-32"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
                  }}
                />

                {/* Bottom gradient overlay */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-48"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                  }}
                />

                {/* Video title at top */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-3 sm:top-4 md:top-6 left-3 sm:left-4 md:left-6 right-3 sm:right-4 md:right-6"
                >
                  <h3 
                    className="text-white text-xs sm:text-sm md:text-base font-bold truncate drop-shadow-2xl"
                    style={{
                      textShadow: '0 2px 20px rgba(0,0,0,0.8)',
                    }}
                  >
                    {videoName}
                  </h3>
                </motion.div>

                {/* Center play button - Gaming style */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full pointer-events-auto flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle, ${NEON_ACCENT}40 0%, ${NEON_ACCENT}20 50%, transparent 100%)`,
                      backdropFilter: 'blur(20px)',
                      border: `2px solid ${NEON_ACCENT}60`,
                      boxShadow: `
                        0 0 40px ${NEON_ACCENT}40,
                        0 0 80px ${NEON_ACCENT}20,
                        inset 0 0 30px ${NEON_ACCENT}10
                      `,
                    }}
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                  >
                    <motion.div
                      animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {isPlaying ? (
                        <Pause className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white drop-shadow-lg" fill="white" strokeWidth={0} />
                      ) : (
                        <Play className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white drop-shadow-lg ml-0.5 sm:ml-1" fill="white" strokeWidth={0} />
                      )}
                    </motion.div>
                  </motion.button>
                </div>

                {/* Floating Control Pods - Bottom */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-3 sm:left-4 md:left-6 right-3 sm:right-4 md:right-6"
                >
                  {/* Progress Bar - Interactive */}
                  <div 
                    ref={progressRef}
                    className="mb-2 sm:mb-3 md:mb-4 cursor-pointer group/progress relative h-6 sm:h-7 md:h-8 flex items-center"
                    onClick={handleSeek}
                  >
                    {/* Track background */}
                    <div className="absolute w-full h-1 sm:h-1.5 rounded-full bg-white/10 overflow-hidden">
                      {/* Buffered */}
                      <motion.div 
                        className="h-full bg-white/20"
                        style={{ width: `${buffered}%` }}
                      />
                    </div>
                    
                    {/* Progress fill */}
                    <motion.div 
                      className="absolute h-1 sm:h-1.5 rounded-full"
                      style={{ 
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${NEON_ACCENT} 0%, ${NEON_ACCENT}CC 100%)`,
                        boxShadow: `0 0 10px ${NEON_ACCENT}80, 0 0 20px ${NEON_ACCENT}40`,
                      }}
                    />
                    
                    {/* Hover expansion */}
                    <motion.div
                      className="absolute h-2 sm:h-2.5 rounded-full bg-white/5 opacity-0 group-hover/progress:opacity-100 transition-opacity"
                      style={{ width: `${progress}%` }}
                    />

                    {/* Glowing thumb */}
                    <motion.div
                      className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
                      style={{
                        left: `${progress}%`,
                        transform: 'translateX(-50%)',
                        background: NEON_ACCENT,
                        boxShadow: `0 0 15px ${NEON_ACCENT}, 0 0 30px ${NEON_ACCENT}80`,
                      }}
                    />
                  </div>

                  {/* Control buttons in floating pod */}
                  <div 
                    className="flex items-center justify-between px-2 sm:px-4 md:px-5 py-1.5 sm:py-2.5 md:py-3 rounded-lg sm:rounded-2xl"
                    style={{
                      background: 'rgba(20, 20, 20, 0.6)',
                      backdropFilter: 'blur(30px) saturate(150%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: `
                        0 8px 32px rgba(0,0,0,0.4),
                        inset 0 1px 0 rgba(255,255,255,0.05)
                      `,
                    }}
                  >
                    {/* Left controls */}
                    <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                      {/* Play/Pause */}
                      <motion.button
                        onClick={togglePlay}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-md sm:rounded-xl flex items-center justify-center transition-all"
                        style={{
                          background: isPlaying ? `${NEON_ACCENT}20` : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isPlaying ? `${NEON_ACCENT}40` : 'rgba(255,255,255,0.1)'}`,
                        }}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="white" />
                        ) : (
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="white" />
                        )}
                      </motion.button>

                      {/* Skip Back */}
                      <motion.button
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                          }
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="hidden sm:flex w-10 h-10 md:w-11 md:h-11 rounded-xl items-center justify-center bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                      >
                        <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                      </motion.button>

                      {/* Skip Forward */}
                      <motion.button
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
                          }
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="hidden sm:flex w-10 h-10 md:w-11 md:h-11 rounded-xl items-center justify-center bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                      >
                        <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                      </motion.button>

                      {/* Volume */}
                      <motion.button
                        onClick={toggleMute}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-md sm:rounded-xl flex items-center justify-center transition-all"
                        style={{
                          background: isMuted ? 'rgba(255,100,100,0.15)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isMuted ? 'rgba(255,100,100,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        }}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                        ) : (
                          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                        )}
                      </motion.button>

                      {/* Time display */}
                      <div className="text-white/70 text-[10px] sm:text-xs font-mono tracking-wide hidden sm:block">
                        <span className="text-white/90 font-semibold">{formatTime(currentTime)}</span>
                        <span className="mx-0.5 sm:mx-1 text-white/40">/</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                      {/* Speed control */}
                      <div className="relative">
                        <motion.button
                          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-md sm:rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                        >
                          <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                        </motion.button>

                        {/* Speed menu - Mobile app style */}
                        <AnimatePresence>
                          {showSpeedMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-12 sm:bottom-14 right-0 w-28 sm:w-32 rounded-lg sm:rounded-xl overflow-hidden"
                              style={{
                                background: 'rgba(15, 15, 15, 0.95)',
                                backdropFilter: 'blur(30px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                              }}
                            >
                              {speedOptions.map((speed) => (
                                <motion.button
                                  key={speed}
                                  onClick={() => handleSpeedChange(speed)}
                                  whileHover={{ backgroundColor: `${NEON_ACCENT}20` }}
                                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-colors ${
                                    playbackSpeed === speed ? 'text-white' : 'text-white/60'
                                  }`}
                                  style={{
                                    background: playbackSpeed === speed ? `${NEON_ACCENT}15` : 'transparent',
                                  }}
                                >
                                  {speed}x
                                  {playbackSpeed === speed && (
                                    <motion.span
                                      className="ml-1"
                                      style={{ color: NEON_ACCENT }}
                                    >
                                      ✓
                                    </motion.span>
                                  )}
                                </motion.button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Download */}
                      <motion.button
                        onClick={handleDownload}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-md sm:rounded-xl flex items-center justify-center transition-all"
                        style={{
                          background: `${NEON_ACCENT}15`,
                          border: `1px solid ${NEON_ACCENT}30`,
                        }}
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: NEON_ACCENT }} />
                      </motion.button>

                      {/* Fullscreen */}
                      <motion.button
                        onClick={() => {
                          if (containerRef.current) {
                            if (!document.fullscreenElement) {
                              containerRef.current.requestFullscreen();
                            } else {
                              document.exitFullscreen();
                            }
                          }
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="hidden sm:flex w-10 h-10 md:w-11 md:h-11 rounded-xl items-center justify-center bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                      >
                        <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* Playing indicator - Top right */}
                {isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full"
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${NEON_ACCENT}30`,
                    }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                      style={{ 
                        background: NEON_ACCENT,
                        boxShadow: `0 0 10px ${NEON_ACCENT}`,
                      }}
                    />
                    <span className="text-white text-[10px] sm:text-xs font-bold tracking-wide">
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
}
