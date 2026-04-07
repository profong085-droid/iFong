import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { useState, useEffect } from "react";

interface NavbarProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

const NEON = "#DFFF00";

export function Navbar({ onMenuToggle, isMenuOpen }: NavbarProps) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [sessionName, setSessionName] = useState<string>("guest");

  useEffect(() => {
    return scrollY.on("change", (v) => setScrolled(v > 40));
  }, [scrollY]);
  useEffect(() => {
    const saved = window.localStorage.getItem("ifong:mock-session");
    if (saved) setSessionName(saved);
  }, []);

  // Spring-smoothed motion values
  const rawBg      = useTransform(scrollY, [0, 60], [0, 0.78]);
  const bgOpacity  = useSpring(rawBg,     { stiffness: 120, damping: 22 });
  const rawBlur    = useTransform(scrollY, [0, 60], [0, 22]);
  const blurAmount = useSpring(rawBlur,   { stiffness: 120, damping: 22 });
  const rawBorder  = useTransform(scrollY, [0, 60], [0, 0.1]);
  const borderOp   = useSpring(rawBorder, { stiffness: 120, damping: 22 });

  // Derived string transforms (must be at component level — not inside JSX)
  const backdropVal  = useTransform(blurAmount, (v) => `blur(${v}px)`);
  const bgColorVal   = useTransform(bgOpacity,  (v) => `rgba(0,0,0,${v})`);
  const borderColVal = useTransform(borderOp,   (v) => `rgba(255,255,255,${v})`);
  const neonBarOp    = useTransform(scrollY, [0, 80], [0, 0.65]);
  const progressSX   = useTransform(scrollY, [0, 2000], [0, 1]);
  const progressOp   = useTransform(scrollY, [0, 60], [0, 1]);

  return (
    <motion.nav className="fixed top-0 left-0 right-0 z-50">

      {/* Glassmorphism background layer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: backdropVal,
          WebkitBackdropFilter: backdropVal,
          backgroundColor: bgColorVal,
          borderBottom: "1px solid transparent",
          borderColor: borderColVal,
        }}
      />

      {/* Neon bottom glow line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${NEON} 30%, rgba(255,255,255,0.7) 50%, ${NEON} 70%, transparent)`,
          opacity: neonBarOp,
          boxShadow: `0 0 10px 1px rgba(223,255,0,0.35)`,
        }}
      />

      {/* Scroll progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-px origin-left pointer-events-none"
        style={{
          width: "100%",
          background: NEON,
          scaleX: progressSX,
          opacity: progressOp,
          boxShadow: `0 0 6px rgba(223,255,0,0.7)`,
        }}
      />

      <div className="relative mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="flex items-center gap-1 select-none"
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: 22,
              letterSpacing: "-0.03em",
              color: NEON,
              textShadow: scrolled
                ? `0 0 16px rgba(223,255,0,0.9), 0 0 32px rgba(223,255,0,0.5)`
                : `0 0 10px rgba(223,255,0,0.6)`,
              transition: "text-shadow 0.4s ease",
            }}
          >
            iFONG
          </span>

          {/* Live dot */}
          <motion.div
            animate={{ opacity: [1, 0.2, 1], scale: [1, 0.75, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: NEON,
              boxShadow: `0 0 6px 2px rgba(223,255,0,0.6)`,
              marginLeft: 4,
              marginBottom: 2,
              flexShrink: 0,
            }}
          />
        </motion.div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = sessionName === "guest" ? "signed-in" : "guest";
              setSessionName(next);
              window.localStorage.setItem("ifong:mock-session", next);
            }}
            className="rounded-full border px-3 py-1 text-xs"
            style={{
              borderColor: "rgba(223,255,0,0.35)",
              color: NEON,
              background: "rgba(223,255,0,0.08)",
            }}
          >
            {sessionName === "guest" ? "Login" : "Profile"}
          </button>
          <motion.button
            onClick={onMenuToggle}
            whileTap={{ scale: 0.91 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            aria-label="Toggle menu"
            style={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              background: isMenuOpen ? "rgba(223,255,0,0.08)" : "rgba(255,255,255,0.04)",
              border: isMenuOpen ? "1px solid rgba(223,255,0,0.28)" : "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(8px)",
              cursor: "pointer",
              transition: "background 0.3s, border 0.3s",
            }}
          >
            <div style={{ width: 20, height: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <motion.span
                animate={
                  isMenuOpen
                    ? { rotate: 45, y: 7, backgroundColor: NEON, width: "100%" }
                    : { rotate: 0, y: 0, backgroundColor: "#FFFFFF", width: "100%" }
                }
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                style={{ display: "block", height: 1.5, borderRadius: 2, transformOrigin: "center" }}
              />
              <motion.span
                animate={
                  isMenuOpen
                    ? { opacity: 0, scaleX: 0 }
                    : { opacity: 1, scaleX: 1, backgroundColor: "#FFFFFF" }
                }
                transition={{ duration: 0.18 }}
                style={{ display: "block", height: 1.5, borderRadius: 2, width: "72%", backgroundColor: "#FFFFFF" }}
              />
              <motion.span
                animate={
                  isMenuOpen
                    ? { rotate: -45, y: -7, backgroundColor: NEON, width: "100%" }
                    : { rotate: 0, y: 0, backgroundColor: "#FFFFFF", width: "100%" }
                }
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                style={{ display: "block", height: 1.5, borderRadius: 2, transformOrigin: "center" }}
              />
            </div>
          </motion.button>
      </div>
      </div>
    </motion.nav>
  );
}
