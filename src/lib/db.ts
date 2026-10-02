import { PhotoSession, PhotoItem } from "@/types";
import { INITIAL_MOCK_SESSIONS } from "./mock-data";
import { withDemoCoordinates } from "./demo-locations";
import { db, storage, isFirebaseConfigured } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { CompressedImageSet } from "./image-processor";

const LOCAL_STORAGE_KEY = "photo_archive_sessions_v2";

// Helper for LocalStorage fallback
function getLocalSessions(): PhotoSession[] {
  if (typeof window === "undefined") return INITIAL_MOCK_SESSIONS;
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_SESSIONS));
    return INITIAL_MOCK_SESSIONS;
  }
  try {
    const sessions: PhotoSession[] = JSON.parse(stored);
    const seeded = sessions.map(withDemoCoordinates);
    if (seeded.some((session, index) => session !== sessions[index])) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seeded));
    }
    return seeded;
  } catch {
    return INITIAL_MOCK_SESSIONS;
  }
}

function saveLocalSessions(sessions: PhotoSession[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
  }
}

// Fetch all sessions
export async function fetchSessions(onlyPublished = false): Promise<PhotoSession[]> {
  if (isFirebaseConfigured && !db) throw new Error("Firebase 데이터베이스 연결에 실패했습니다.");
  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, "sessions");
      const q = onlyPublished
        ? query(colRef, where("isPublished", "==", true), orderBy("date", "desc"))
        : query(colRef, orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      const list: PhotoSession[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as PhotoSession);
      });
      return list;
    } catch (err) {
      throw err;
    }
  }

  // Fallback to local storage / mock data
  const local = getLocalSessions();
  const sorted = [...local].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return onlyPublished ? sorted.filter((s) => s.isPublished) : sorted;
}

// Fetch single session by id or slug
export async function fetchSessionByIdOrSlug(idOrSlug: string): Promise<PhotoSession | null> {
  if (isFirebaseConfigured && !db) throw new Error("Firebase 데이터베이스 연결에 실패했습니다.");
  if (isFirebaseConfigured && db) {
    try {
      // 1. Try doc by ID
      const docRef = doc(db, "sessions", idOrSlug);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as PhotoSession;
      }
      // 2. Query doc by slug
      const q = query(collection(db, "sessions"), where("slug", "==", idOrSlug), where("isPublished", "==", true));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const first = qSnap.docs[0];
        return { id: first.id, ...first.data() } as PhotoSession;
      }
      return null;
    } catch (err) {
      throw err;
    }
  }

  // Local fallback
  const local = getLocalSessions();
  return local.find((s) => s.id === idOrSlug || s.slug === idOrSlug) || null;
}

// Save or Update Session
export async function saveSession(session: PhotoSession): Promise<void> {
  const updatedSession = {
    ...session,
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && !db) throw new Error("Firebase 데이터베이스 연결에 실패했습니다.");
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "sessions", updatedSession.id);
      await setDoc(docRef, updatedSession, { merge: true });
      return;
    } catch (err) {
      throw err;
    }
  }

  // Local storage save
  const local = getLocalSessions();
  const existingIndex = local.findIndex((s) => s.id === updatedSession.id);
  if (existingIndex >= 0) {
    local[existingIndex] = updatedSession;
  } else {
    local.unshift(updatedSession);
  }
  saveLocalSessions(local);
}

// Delete Session
export async function deleteSession(id: string): Promise<void> {
  if (isFirebaseConfigured && !db) throw new Error("Firebase 데이터베이스 연결에 실패했습니다.");
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "sessions", id));
      return;
    } catch (err) {
      throw err;
    }
  }

  const local = getLocalSessions();
  const filtered = local.filter((s) => s.id !== id);
  saveLocalSessions(filtered);
}

// Upload compressed photo set (Thumb, Medium, Large) to Firebase Storage or create ObjectURL in mock mode
export async function uploadPhotoImages(
  sessionId: string,
  photoId: string,
  compressed: CompressedImageSet
): Promise<{ urls: PhotoItem["urls"]; storagePaths: PhotoItem["storagePaths"] }> {
  if (isFirebaseConfigured && !storage) throw new Error("Firebase 사진 저장소 연결에 실패했습니다.");
  if (isFirebaseConfigured && storage) {
    const basePath = `sessions/${sessionId}/${photoId}`;
    const thumbRef = ref(storage, `${basePath}/thumb.webp`);
    const medRef = ref(storage, `${basePath}/medium.webp`);
    const largeRef = ref(storage, `${basePath}/large.webp`);

    // Each upload gets a new photoId, so replacements use new URLs.
    const metadata = { contentType: "image/webp", cacheControl: "private, max-age=2678400, immutable" };
    await uploadBytes(thumbRef, compressed.thumb, metadata);
    await uploadBytes(medRef, compressed.medium, metadata);
    await uploadBytes(largeRef, compressed.large, metadata);

    const thumbUrl = await getDownloadURL(thumbRef);
    const medUrl = await getDownloadURL(medRef);
    const largeUrl = await getDownloadURL(largeRef);

    return {
      urls: {
        thumb: thumbUrl,
        medium: medUrl,
        large: largeUrl,
      },
      storagePaths: {
        thumb: thumbRef.fullPath,
        medium: medRef.fullPath,
        large: largeRef.fullPath,
      },
    };
  }

  // Local Data URL / ObjectURL fallback
  const thumbUrl = URL.createObjectURL(compressed.thumb);
  const medUrl = URL.createObjectURL(compressed.medium);
  const largeUrl = URL.createObjectURL(compressed.large);

  return {
    urls: {
      thumb: thumbUrl,
      medium: medUrl,
      large: largeUrl,
    },
    storagePaths: {
      thumb: `mock/${sessionId}/${photoId}/thumb.webp`,
      medium: `mock/${sessionId}/${photoId}/medium.webp`,
      large: `mock/${sessionId}/${photoId}/large.webp`,
    },
  };
}
