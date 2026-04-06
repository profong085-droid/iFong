import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface HeroProps {
  backgroundImage: string;
}

const NEON = "#DFFF00";

const speedLines = [
  { top: "22%", width: 140, delay: 0.0, opacity: 0.45, duration: 1.6 },
  { top: "38%", width: 90,  delay: 0.4, opacity: 0.3,  duration: 1.4 },
  { top: "52%", width: 220, delay: 0.9, opacity: 0.55, duration: 1.2 },
  { top: "63%", width: 70,  delay: 0.2, opacity: 0.25, duration: 1.8 },
  { top: "74%", width: 170, delay: 0.7, opacity: 0.4,  duration: 1.5 },
  { top: "84%", width: 110, delay: 1.1, opacity: 0.35, duration: 1.3 },
];

export function Hero({ backgroundImage }: HeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const bgY     = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const contentY       = useTransform(scrollYProgress, [0, 0.6], ["0%", "12%"]);

  return (
    <div ref={ref} className="relative h-screen w-full overflow-hidden bg-black">

      {/* ── Parallax background ── */}
      <motion.div
        style={{ y: bgY, scale: bgScale }}
        className="absolute inset-0 w-full h-full origin-center"
      >
        {/* Ken Burns slow zoom */}
        <motion.div
          className="absolute inset-0"
          animate={{ scale: [1, 1.06] }}
          transition={{ duration: 22, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        >
          {!imageError ? (
            <ImageWithFallback
              src={backgroundImage}
              alt="Hero background"
              className="w-full h-full"
              style={{
                objectFit: "cover",
                objectPosition: "center",
                filter: "brightness(0.45) saturate(1.1)",
              }}
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)",
                filter: "brightness(0.45) saturate(1.1)",
              }}
            />
          )}
        </motion.div>
        {/* Gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
      </motion.div>

      {/* ── Neon ambient orb ── */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          left: "-15%",
          bottom: "5%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(223,255,0,0.18) 0%, rgba(223,255,0,0.06) 40%, transparent 70%)`,
          filter: "blur(40px)",
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── Large watermark number ── */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 select-none pointer-events-none"
        style={{
          fontSize: "clamp(260px, 55vw, 520px)",
          fontFamily: "Inter, sans-serif",
          fontWeight: 900,
          fontStyle: "italic",
          color: "transparent",
          WebkitTextStroke: `1px rgba(223,255,0,0.06)`,
          lineHeight: 1,
          userSelect: "none",
          letterSpacing: "-0.06em",
          transform: "translateY(-50%) translateX(10%)",
        }}
      >
        4
      </div>

      {/* ── Animated speed lines ── */}
      {speedLines.map((line, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: line.top,
            left: 0,
            height: 1.5,
            width: line.width,
            background: `linear-gradient(90deg, transparent, ${NEON}, transparent)`,
            opacity: line.opacity,
            filter: `blur(0.5px) drop-shadow(0 0 4px ${NEON})`,
          }}
          animate={{ x: ["-100%", "110vw"] }}
          transition={{
            duration: line.duration,
            delay: line.delay,
            repeat: Infinity,
            repeatDelay: 4 + i * 0.7,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        />
      ))}

      {/* ── Vertical left neon edge ── */}
      <div
        className="absolute left-0 top-0 bottom-0 w-px pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, transparent, ${NEON}, transparent)`,
          opacity: 0.35,
          boxShadow: `0 0 12px 2px rgba(223,255,0,0.25)`,
        }}
      />

      {/* ── P1 status chip ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
        className="absolute top-24 left-6 flex items-center gap-2"
      >
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="w-2 h-2 rounded-full"
          style={{ background: NEON, boxShadow: `0 0 8px 2px rgba(223,255,0,0.7)` }}
        />
        <span
          className="text-xs tracking-widest uppercase"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontStyle: "italic", color: NEON, letterSpacing: "0.2em" }}
        >
          PHO CHAIFONG
        </span>
      </motion.div>

      {/* ── Main content ── */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="absolute inset-0 flex flex-col justify-end px-6 pb-24 z-10"
      >
        {/* Race number badge */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 120, damping: 20 }}
          className="mb-4 w-fit"
        >
          <div
            className="px-3 py-1 rounded-lg flex items-center gap-2"
            style={{
              background: "rgba(223,255,0,0.1)",
              border: "1px solid rgba(223,255,0,0.35)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="text-xs tracking-widest"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontStyle: "italic", color: NEON, letterSpacing: "0.15em" }}
            >
              KIMCHI ESPOTR
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <div className="overflow-hidden mb-1">
          <motion.h1
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-white leading-none select-none"
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: "clamp(72px, 20vw, 120px)",
              letterSpacing: "-0.04em",
              lineHeight: 0.92,
              textShadow: "0 8px 40px rgba(0,0,0,0.8)",
            }}
          >
            CHAI
          </motion.h1>
        </div>
        <div className="overflow-hidden mb-8">
          <motion.h1
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: "clamp(72px, 20vw, 120px)",
              letterSpacing: "-0.04em",
              lineHeight: 0.92,
              color: NEON,
              textShadow: `
                0 0 30px rgba(223,255,0,0.7),
                0 0 60px rgba(223,255,0,0.4),
                0 0 100px rgba(223,255,0,0.2),
                0 8px 40px rgba(0,0,0,0.8)
              `,
            }}
          >
            FONG
          </motion.h1>
        </div>

        {/* Sub label */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9, ease: "easeOut" }}
          className="mb-8 text-xs tracking-widest"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontStyle: "italic", color: "#71717A", letterSpacing: "0.22em" }}
        >
          FORMULA 1 · WORLD CHAMPION · 2026
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.05, ease: "easeOut" }}
          className="relative w-fit"
        >
          {/* Pulse rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-2xl"
              style={{ border: `1px solid rgba(223,255,0,0.5)` }}
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut",
              }}
            />
          ))}

          <motion.a
            href="https://kimchicom.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{
              scale: 1.04,
              boxShadow: `0 0 40px rgba(223,255,0,0.65), 0 0 80px rgba(223,255,0,0.3), 0 12px 40px rgba(0,0,0,0.5)`,
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="relative px-10 py-4 rounded-2xl overflow-hidden inline-block"
            style={{
              background: NEON,
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: 14,
              letterSpacing: "0.14em",
              color: "#000",
              boxShadow: `0 0 24px rgba(223,255,0,0.45), 0 8px 32px rgba(0,0,0,0.4)`,
              textDecoration: "none",
            }}
          >
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0"
              style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)" }}
              initial={{ x: "-150%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.8, ease: [0.25, 0.1, 0.25, 1] }}
            />
            <span className="relative z-10 uppercase tracking-widest">SHOP NOW</span>
          </motion.a>
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.6 }}
        style={{ opacity: contentOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span
          className="text-xs tracking-widest"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontStyle: "italic", color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em" }}
        >
          SCROLL
        </span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-9 rounded-full flex items-start justify-center pt-2"
          style={{ border: "1.5px solid rgba(255,255,255,0.2)" }}
        >
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 rounded-full"
            style={{ background: "rgba(255,255,255,0.5)" }}
          />
        </motion.div>
      </motion.div>

      {/* ── Bottom speed stripe ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${NEON} 30%, rgba(255,255,255,0.6) 50%, ${NEON} 70%, transparent 100%)`,
          opacity: 0.5,
          boxShadow: `0 0 20px 2px rgba(223,255,0,0.4)`,
        }}
      />
    </div>
  );
}
