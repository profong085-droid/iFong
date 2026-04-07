import { initializeApp } from "firebase/app";
import emailjs from "@emailjs/browser";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithRedirect,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

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
let dbInstance: ReturnType<typeof getFirestore> | null = null;

if (hasFirebaseConfig) {
  const app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
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
  try {
    const result = await signInWithPopup(authInstance, provider);
    return result.user;
  } catch (error) {
    const code = (error as { code?: string })?.code ?? "";
    // Mobile browsers and strict popup policies often reject popup login.
    const shouldRedirect =
      code === "auth/popup-blocked" ||
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request" ||
      code === "auth/operation-not-supported-in-this-environment";
    if (shouldRedirect) {
      await signInWithRedirect(authInstance, provider);
      return null;
    }
    throw error;
  }
}

export async function signOutGoogle() {
  if (!authInstance) return;
  await signOut(authInstance);
}

export type CommunityReply = {
  id: string;
  text: string;
  authorName: string;
  authorEmail: string;
  createdAt: number;
};

export type CommunityComment = {
  id: string;
  videoId: string;
  text: string;
  authorName: string;
  authorEmail: string;
  createdAt: number;
  replies: CommunityReply[];
};

export function subscribeCommunityComments(
  videoId: string,
  callback: (comments: CommunityComment[]) => void,
): Unsubscribe {
  if (!dbInstance) {
    callback([]);
    return () => undefined;
  }
  const q = query(
    collection(dbInstance, "comments"),
    where("videoId", "==", videoId),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(q, (snapshot) => {
    const rows: CommunityComment[] = snapshot.docs.map((row) => {
      const data = row.data() as Record<string, unknown>;
      const createdAtRaw = data.createdAt as { toMillis?: () => number } | number | undefined;
      const createdAt =
        typeof createdAtRaw === "number"
          ? createdAtRaw
          : typeof createdAtRaw?.toMillis === "function"
            ? createdAtRaw.toMillis()
            : Date.now();
      return {
        id: row.id,
        videoId: String(data.videoId ?? videoId),
        text: String(data.text ?? ""),
        authorName: String(data.authorName ?? "Viewer"),
        authorEmail: String(data.authorEmail ?? ""),
        createdAt,
        replies: Array.isArray(data.replies) ? (data.replies as CommunityReply[]) : [],
      };
    });
    callback(rows);
  });
}

export async function postCommunityComment(params: {
  videoId: string;
  text: string;
  authorName: string;
  authorEmail: string;
}) {
  if (!dbInstance) throw new Error("Firestore not configured");
  await addDoc(collection(dbInstance, "comments"), {
    videoId: params.videoId,
    text: params.text,
    authorName: params.authorName,
    authorEmail: params.authorEmail,
    createdAt: serverTimestamp(),
    replies: [],
  });
}

export async function postCommunityReply(params: {
  commentId: string;
  text: string;
  authorName: string;
  authorEmail: string;
}) {
  if (!dbInstance) throw new Error("Firestore not configured");
  const ref = doc(dbInstance, "comments", params.commentId);
  await updateDoc(ref, {
    replies: arrayUnion({
      id: crypto.randomUUID(),
      text: params.text,
      authorName: params.authorName,
      authorEmail: params.authorEmail,
      createdAt: Date.now(),
    }),
  });
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
