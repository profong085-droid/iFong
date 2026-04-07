import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { useState, useEffect } from "react";
import type { User } from "firebase/auth";
import { updateProfile } from "firebase/auth";
import {
  isGoogleAuthEnabled,
  listenAuthState,
  sendLoginSuccessEmail,
  signInWithGoogle,
  signOutGoogle,
} from "../lib/firebaseAuth";

interface NavbarProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

const NEON = "#DFFF00";
const PROFILE_STORE_KEY = "ifong:profile:data";

type EditableProfile = {
  displayName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  avatar: string;
};

export function Navbar({ onMenuToggle, isMenuOpen }: NavbarProps) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string>("");
  const [authNotice, setAuthNotice] = useState<string>("");
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [profile, setProfile] = useState<EditableProfile>({
    displayName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    avatar: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (v) => setScrolled(v > 40));
  }, [scrollY]);
  useEffect(() => {
    const unsubscribe = listenAuthState((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);
  useEffect(() => {
    if (!user) return;
    const raw = window.localStorage.getItem(PROFILE_STORE_KEY);
    const store = raw ? (JSON.parse(raw) as Record<string, EditableProfile>) : {};
    const saved = store[user.uid];
    setProfile({
      displayName: saved?.displayName || user.displayName || "",
      email: saved?.email || user.email || "",
      phone: saved?.phone || "",
      location: saved?.location || "",
      bio: saved?.bio || "",
      avatar: saved?.avatar || user.photoURL || "",
    });
  }, [user]);

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
            onClick={async () => {
              if (!isGoogleAuthEnabled() || authBusy) return;
              setAuthBusy(true);
              setAuthError("");
              setAuthNotice("");
              try {
                if (user) {
                  await signOutGoogle();
                  setShowProfileCard(false);
                } else {
                  const signedInUser = await signInWithGoogle();
                  if (signedInUser?.email) {
                    const emailSent = await sendLoginSuccessEmail({
                      toEmail: signedInUser.email,
                      userName: signedInUser.displayName ?? signedInUser.email,
                    });
                    setAuthNotice(
                      emailSent
                        ? "Login successful and confirmation email sent."
                        : "Login successful. Email service not configured yet.",
                    );
                  }
                }
              } catch (error) {
                const err = error as { code?: string; message?: string };
                const raw = err.code ?? err.message ?? "Google login failed";
                const message =
                  raw === "auth/configuration-not-found"
                    ? "Firebase Google Sign-In not enabled. Please enable Google provider in Firebase Console."
                    : raw === "auth/unauthorized-domain"
                      ? "This domain is not authorized in Firebase Auth. Add this domain in Firebase > Auth > Settings."
                      : raw;
                setAuthError(message);
                console.error("Google auth error:", error);
              } finally {
                setAuthBusy(false);
              }
            }}
            className="rounded-full border px-3 py-1 text-xs"
            style={{
              borderColor: "rgba(223,255,0,0.35)",
              color: NEON,
              background: "rgba(223,255,0,0.08)",
              opacity: isGoogleAuthEnabled() ? 1 : 0.55,
            }}
            title={
              isGoogleAuthEnabled()
                ? user?.email ?? "Sign in with Google"
                : "Set VITE_FIREBASE_* env vars to enable Google login"
            }
          >
            {authBusy
              ? "..."
              : user
                ? "Logout"
                : isGoogleAuthEnabled()
                  ? "Login"
                  : "Login*"}
          </button>
          {user && (
            <button
              type="button"
              onClick={() => setShowProfileCard((v) => !v)}
              className="rounded-full border px-3 py-1 text-xs"
              style={{
                borderColor: "rgba(255,255,255,0.25)",
                color: "rgba(255,255,255,0.88)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              Profile
            </button>
          )}
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
      {authError && (
        <div className="pointer-events-none absolute right-6 top-[64px] rounded-md border border-red-500/35 bg-black/80 px-2 py-1 text-[10px] text-red-300">
          {authError}
        </div>
      )}
      {authNotice && (
        <div className="pointer-events-none absolute right-6 top-[86px] rounded-md border border-emerald-500/35 bg-black/80 px-2 py-1 text-[10px] text-emerald-300">
          {authNotice}
        </div>
      )}
      {showProfileCard && user && (
        <div className="absolute right-6 top-[112px] w-[340px] rounded-2xl border border-white/15 bg-black/90 p-3 text-[11px] text-white/80 shadow-2xl backdrop-blur-md">
          <div className="mb-3 flex items-center gap-3">
            {profile.avatar ? (
              <img src={profile.avatar} alt="avatar" className="h-12 w-12 rounded-full border border-white/20 object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm">
                {profile.displayName?.slice(0, 1) || "U"}
              </div>
            )}
            <div>
              <div className="text-sm font-semibold text-white">My Profile</div>
              <div className="text-[10px] text-white/60">{user.uid}</div>
            </div>
          </div>
          <div className="mb-2 grid grid-cols-1 gap-2">
            <input
              value={profile.displayName}
              onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
              placeholder="Full name"
              className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-xs text-white outline-none"
            />
            <input
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email"
              className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-xs text-white outline-none"
            />
            <input
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              placeholder="Phone"
              className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-xs text-white outline-none"
            />
            <input
              value={profile.location}
              onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
              placeholder="Location"
              className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-xs text-white outline-none"
            />
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Bio"
              className="h-16 resize-none rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-xs text-white outline-none"
            />
            <label className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-xs text-white/80">
              Upload avatar
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-[10px]"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result;
                    if (typeof result === "string") {
                      setProfile((p) => ({ ...p, avatar: result }));
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-2 text-[10px] text-white/55">
            <div>Provider: {user.providerData.map((p) => p.providerId).join(", ") || "google.com"}</div>
            <div>Verified: {user.emailVerified ? "Yes" : "No"}</div>
            <div>Created: {user.metadata.creationTime ?? "-"}</div>
            <div>Last sign-in: {user.metadata.lastSignInTime ?? "-"}</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                if (!user || profileSaving) return;
                setProfileSaving(true);
                try {
                  const raw = window.localStorage.getItem(PROFILE_STORE_KEY);
                  const store = raw ? (JSON.parse(raw) as Record<string, EditableProfile>) : {};
                  store[user.uid] = profile;
                  window.localStorage.setItem(PROFILE_STORE_KEY, JSON.stringify(store));
                  await updateProfile(user, {
                    displayName: profile.displayName || user.displayName || "",
                    photoURL: profile.avatar || user.photoURL || "",
                  });
                  setAuthNotice("Profile updated successfully.");
                } catch {
                  setAuthError("Failed to save profile.");
                } finally {
                  setProfileSaving(false);
                }
              }}
              className="rounded-lg border px-3 py-1.5 text-xs"
              style={{ borderColor: "rgba(223,255,0,0.45)", color: NEON }}
            >
              {profileSaving ? "Saving..." : "Save profile"}
            </button>
            <button
              type="button"
              onClick={() => setShowProfileCard(false)}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/75"
            >
              Close
            </button>
          </div>
        </div>
      )}
      </div>
    </motion.nav>
  );
}
