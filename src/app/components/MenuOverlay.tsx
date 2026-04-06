import { motion, AnimatePresence } from "motion/react";
import { Instagram, Twitter, Youtube } from "lucide-react";

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const NEON = "#DFFF00";

const menuItems = [
  { label: "HOME",    href: "#home",    number: "01" },
  { label: "RACING",  href: "#racing",  number: "02" },
  { label: "ABOUT",   href: "#about",   number: "03" },
  { label: "GALLERY", href: "#gallery", number: "04" },
  { label: "SHOP",    href: "#shop",    number: "05" },
];

const socials = [
  { Icon: Instagram, label: "Instagram", href: "#" },
  { Icon: Twitter,   label: "Twitter",   href: "#" },
  { Icon: Youtube,   label: "YouTube",   href: "#" },
];

export function MenuOverlay({ isOpen, onClose }: MenuOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-40 overflow-hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.97)" }}
        >
          {/* Circuit grid background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(223,255,0,0.025) 1px, transparent 1px),
                linear-gradient(90deg, rgba(223,255,0,0.025) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
            }}
          />

          {/* Large #4 background watermark */}
          <div
            className="absolute right-[-8%] top-1/2 -translate-y-1/2 pointer-events-none select-none"
            style={{
              fontSize: "clamp(340px, 70vw, 680px)",
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontStyle: "italic",
              color: "transparent",
              WebkitTextStroke: "1.5px rgba(223,255,0,0.04)",
              lineHeight: 1,
              letterSpacing: "-0.06em",
            }}
          >
            4
          </div>

          {/* Neon top edge */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.7 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            style={{
              background: `linear-gradient(90deg, transparent, ${NEON} 30%, rgba(255,255,255,0.8) 50%, ${NEON} 70%, transparent)`,
              boxShadow: `0 0 16px 2px rgba(223,255,0,0.4)`,
              transformOrigin: "left",
            }}
          />

          {/* Side glow */}
          <div
            className="absolute left-0 top-0 bottom-0 w-px pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, transparent, ${NEON} 40%, ${NEON} 60%, transparent)`,
              opacity: 0.3,
              boxShadow: `0 0 20px 4px rgba(223,255,0,0.2)`,
            }}
          />

          {/* Content */}
          <motion.div
            className="relative h-full flex flex-col items-start justify-center px-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Boot label */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-10 flex items-center gap-3"
            >
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: NEON, boxShadow: `0 0 8px ${NEON}` }}
              />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 800,
                  fontStyle: "italic",
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  color: NEON,
                }}
              >
                NAVIGATION SYSTEM ONLINE
              </span>
            </motion.div>

            {/* Menu items */}
            <nav className="flex flex-col gap-1 w-full mb-14">
              {menuItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -60 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 20,
                    delay: 0.08 + index * 0.07,
                  }}
                  whileHover={{ x: 12 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative flex items-center gap-4 py-3"
                  style={{ textDecoration: "none" }}
                >
                  {/* Item number */}
                  <span
                    className="text-xs tabular-nums"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 700,
                      fontStyle: "italic",
                      color: "rgba(255,255,255,0.2)",
                      letterSpacing: "0.08em",
                      minWidth: 24,
                    }}
                  >
                    {item.number}
                  </span>

                  {/* Accent slash */}
                  <motion.div
                    className="w-6 h-px"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                    whileHover={{ scaleX: 1.5, background: NEON }}
                  />

                  {/* Label */}
                  <motion.span
                    whileHover={{ color: NEON }}
                    transition={{ duration: 0.15 }}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 900,
                      fontStyle: "italic",
                      fontSize: "clamp(36px, 10vw, 52px)",
                      letterSpacing: "-0.03em",
                      color: "#fff",
                      lineHeight: 1,
                      textShadow: "none",
                    }}
                  >
                    {item.label}
                  </motion.span>

                  {/* Neon underline on hover */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-px"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    style={{
                      width: "100%",
                      background: `linear-gradient(90deg, ${NEON}, transparent)`,
                      transformOrigin: "left",
                    }}
                    transition={{ duration: 0.25 }}
                  />
                </motion.a>
              ))}
            </nav>

            {/* Social icons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex items-center gap-6"
            >
              <span
                className="text-xs mr-2"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  fontStyle: "italic",
                  color: "rgba(255,255,255,0.2)",
                  letterSpacing: "0.18em",
                }}
              >
                FOLLOW
              </span>
              {socials.map(({ Icon, label, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  whileHover={{ scale: 1.22, color: NEON }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 16 }}
                  className="text-white/40 transition-colors"
                  aria-label={label}
                  style={{ display: "flex" }}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </motion.a>
              ))}
            </motion.div>

            {/* iFONG bottom brand */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute bottom-8 right-8"
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontStyle: "italic",
                fontSize: 13,
                color: "rgba(255,255,255,0.12)",
                letterSpacing: "0.06em",
              }}
            >
              iFONG
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}