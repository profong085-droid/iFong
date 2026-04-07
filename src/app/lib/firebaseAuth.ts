import { initializeApp } from "firebase/app";
import emailjs from "@emailjs/browser";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

let authInstance: ReturnType<typeof getAuth> | null = null;
let provider: GoogleAuthProvider | null = null;

if (hasFirebaseConfig) {
  const app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  provider = new GoogleAuthProvider();
}

export function isGoogleAuthEnabled() {
  return hasFirebaseConfig && !!authInstance && !!provider;
}

export function listenAuthState(callback: (user: User | null) => void) {
  if (!authInstance) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(authInstance, callback);
}

export async function signInWithGoogle() {
  if (!authInstance || !provider) return null;
  const result = await signInWithPopup(authInstance, provider);
  return result.user;
}

export async function signOutGoogle() {
  if (!authInstance) return;
  await signOut(authInstance);
}

export async function sendLoginSuccessEmail(params: {
  toEmail: string;
  userName: string;
}) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  if (!serviceId || !templateId || !publicKey) return false;

  await emailjs.send(
    serviceId,
    templateId,
    {
      to_email: params.toEmail,
      user_name: params.userName,
      message:
        "បានចូលក្នុងវេបសាយ ChaiFong បានជោគជ័យ (Login successful).",
    },
    { publicKey },
  );
  return true;
}
