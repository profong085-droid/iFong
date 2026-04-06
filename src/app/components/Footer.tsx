import { motion } from "motion/react";
import { Facebook, Send } from "lucide-react";
import { useState } from "react";
import type { ComponentType } from "react";

// Custom TikTok Icon Component
function TikTokIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

const NEON = "#DFFF00";

interface SocialLink {
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  href: string;
}

const socialLinks: SocialLink[] = [
  { Icon: Facebook,  label: "Facebook",  href: "https://www.facebook.com/Bongfong088/" },
  { Icon: TikTokIcon, label: "TikTok",   href: "https://www.tiktok.com/@ceyjomesprocute?lang=km-KH" },
  { Icon: Send,      label: "Telegram",  href: "https://t.me/meOnlyFong" },
];

function SocialIcon({ Icon, label, href }: SocialLink) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.a
      href={href}
      aria-label={label}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.22, y: -3 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 16 }}
      className="relative flex items-center justify-center"
      style={{ width: 44, height: 44 }}
    >
      {/* Glow burst */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{
          boxShadow: hovered
            ? `0 0 20px 6px rgba(223,255,0,0.35), 0 0 40px 12px rgba(223,255,0,0.15)`
            : `0 0 0px 0px rgba(223,255,0,0)`,
        }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        animate={{
          background: hovered ? "rgba(223,255,0,0.12)" : "rgba(255,255,255,0.04)",
          borderColor: hovered ? "rgba(223,255,0,0.35)" : "rgba(255,255,255,0.08)",
        }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 rounded-full"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      />
      <div style={{ color: hovered ? NEON : "rgba(255,255,255,0.45)", display: "flex", position: "relative", zIndex: 10 }}>
        <Icon
          className="w-5 h-5 transition-none"
          strokeWidth={1.5}
        />
      </div>
    </motion.a>
  );
}

export function Footer() {
  return (
    <footer className="relative bg-black overflow-hidden pt-12 pb-10 px-6">
      {/* Racing stripe top border */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 h-px origin-left"
        style={{
          background: `linear-gradient(90deg, transparent, ${NEON} 20%, rgba(255,255,255,0.6) 50%, ${NEON} 80%, transparent)`,
          boxShadow: `0 0 16px 2px rgba(223,255,0,0.35)`,
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse, rgba(223,255,0,0.08) 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      <div className="relative max-w-7xl mx-auto flex flex-col items-center gap-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="select-none"
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: 28,
              letterSpacing: "-0.03em",
              color: NEON,
              textShadow: `0 0 20px rgba(223,255,0,0.6), 0 0 40px rgba(223,255,0,0.3)`,
            }}
          >
            iFONG
          </span>
        </motion.div>

        {/* Social icons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          {socialLinks.map((link) => (
            <SocialIcon key={link.label} {...link} />
          ))}
        </motion.div>

        {/* Nav links */}
        <motion.nav
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center gap-6 flex-wrap justify-center"
        >
          {["HOME", "RACING", "ABOUT", "GALLERY", "SHOP"].map((item) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase()}`}
              whileHover={{ color: NEON }}
              transition={{ duration: 0.2 }}
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontStyle: "italic",
                fontSize: 11,
                letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.3)",
                textDecoration: "none",
              }}
            >
              {item}
            </motion.a>
          ))}
        </motion.nav>

        {/* Divider */}
        <div
          className="w-full h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
          }}
        />

        {/* Copyright */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "0.14em",
            color: "#71717A",
            textAlign: "center",
          }}
        >
          © 2026 CHAI FONG. ALL RIGHTS RESERVED.
        </motion.p>
      </div>
    </footer>
  );
}