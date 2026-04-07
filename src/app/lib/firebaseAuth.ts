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
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
  const result = await signInWithPopup(authInstance, provider);
  return result.user;
}

export async function signOutGoogle() {
  if (!authInstance) return;
  await signOut(authInstance);
}

export type CommunityReply = {
  id: string;
  text: string;
  authorUid: string;
  authorName: string;
  authorEmail: string;
  createdAt: number;
};

export type CommunityComment = {
  id: string;
  videoId: string;
  text: string;
  authorUid: string;
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
        authorUid: String(data.authorUid ?? ""),
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
  authorUid: string;
  authorName: string;
  authorEmail: string;
}) {
  if (!dbInstance) throw new Error("Firestore not configured");
  await addDoc(collection(dbInstance, "comments"), {
    videoId: params.videoId,
    text: params.text,
    authorUid: params.authorUid,
    authorName: params.authorName,
    authorEmail: params.authorEmail,
    createdAt: serverTimestamp(),
    replies: [],
  });
}

export async function postCommunityReply(params: {
  commentId: string;
  text: string;
  authorUid: string;
  authorName: string;
  authorEmail: string;
}) {
  if (!dbInstance) throw new Error("Firestore not configured");
  const ref = doc(dbInstance, "comments", params.commentId);
  await updateDoc(ref, {
    replies: arrayUnion({
      id: crypto.randomUUID(),
      text: params.text,
      authorUid: params.authorUid,
      authorName: params.authorName,
      authorEmail: params.authorEmail,
      createdAt: Date.now(),
    }),
  });
}

export async function updateCommunityComment(params: {
  commentId: string;
  text: string;
}) {
  if (!dbInstance) throw new Error("Firestore not configured");
  await updateDoc(doc(dbInstance, "comments", params.commentId), {
    text: params.text,
  });
}

export async function deleteCommunityComment(params: { commentId: string }) {
  if (!dbInstance) throw new Error("Firestore not configured");
  await deleteDoc(doc(dbInstance, "comments", params.commentId));
}

export async function updateCommunityReply(params: {
  commentId: string;
  replyId: string;
  text: string;
}) {
  if (!dbInstance) throw new Error("Firestore not configured");
  const ref = doc(dbInstance, "comments", params.commentId);
  const snap = await getDoc(ref);
  const data = snap.data() as { replies?: CommunityReply[] } | undefined;
  const replies = Array.isArray(data?.replies) ? data!.replies : [];
  const updated = replies.map((reply) =>
    reply.id === params.replyId ? { ...reply, text: params.text } : reply,
  );
  await updateDoc(ref, { replies: updated });
}

export async function deleteCommunityReply(params: {
  commentId: string;
  replyId: string;
}) {
  if (!dbInstance) throw new Error("Firestore not configured");
  const ref = doc(dbInstance, "comments", params.commentId);
  const snap = await getDoc(ref);
  const data = snap.data() as { replies?: CommunityReply[] } | undefined;
  const replies = Array.isArray(data?.replies) ? data!.replies : [];
  const updated = replies.filter((reply) => reply.id !== params.replyId);
  await updateDoc(ref, { replies: updated });
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

export async function generateAiCommentReply(params: {
  commentText: string;
  videoTitle: string;
}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is missing");
  }

  const prompt = `You are Phochaifong AI assistant for ChaiFong website.\nReply to this user comment in a friendly short style (1-2 sentences), Khmer-first with simple English if helpful.\nVideo: ${params.videoTitle}\nComment: ${params.commentText}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 120,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() ||
    "សូមអរគុណចំពោះមតិយោបល់! Thanks for your feedback.";
  return text;
}
