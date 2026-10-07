import { PhotoSession, PhotoItem } from "@/types";
import { INITIAL_MOCK_SESSIONS } from "./mock-data";
import { withDemoCoordinates } from "./demo-locations";
import { auth, db, storage, isFirebaseConfigured } from "./firebase";
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
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { applyLocationPrivacy } from "./session-privacy";
import { removeStorageTree } from "./storage-cleanup";
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

// Existing administrator posts keep their embedded photos. Member photos are
// validated independently in a subcollection to avoid the rules expression limit.
async function hydrateSession(session: PhotoSession): Promise<PhotoSession> {
  if (!db || !session.ownerId) return session;
  const photosRef = collection(db, "sessions", session.id, "photos");
  const own = auth?.currentUser?.uid === session.ownerId || auth?.currentUser?.uid === process.env.NEXT_PUBLIC_ADMIN_UID;
  const photosQuery = session.shareLocation === false && !own ? query(photosRef, where("gps", "==", null)) : photosRef;
  const snapshot = await getDocs(photosQuery);
  return { ...session, photos: snapshot.docs.map(item => item.data() as PhotoItem).sort((a, b) => a.order - b.order) };
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
      return Promise.all(list.map(hydrateSession));
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
        return hydrateSession({ ...docSnap.data(), id: docSnap.id } as PhotoSession);
      }
      // 2. Query doc by slug
      const q = query(collection(db, "sessions"), where("slug", "==", idOrSlug), where("isPublished", "==", true));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const first = qSnap.docs[0];
        return hydrateSession({ ...first.data(), id: first.id } as PhotoSession);
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
    ...applyLocationPrivacy(session),
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && !db) throw new Error("Firebase 데이터베이스 연결에 실패했습니다.");
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "sessions", updatedSession.id);
      if (updatedSession.ownerId) {
        const existing = await getDoc(docRef);
        const oldPhotos = existing.exists() ? await getDocs(collection(db, "sessions", session.id, "photos")) : null;
        const batch = writeBatch(db);
        batch.set(docRef, { ...updatedSession, photos: [], photoCount: updatedSession.photos.length });
        for (const photo of updatedSession.photos) batch.set(doc(db, "sessions", session.id, "photos", photo.id), photo);
        for (const old of oldPhotos?.docs || []) {
          if (!updatedSession.photos.some(photo => photo.id === old.id)) batch.delete(old.ref);
        }
        await batch.commit();
      } else {
        await setDoc(docRef, updatedSession, { merge: true });
      }
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
      const target = doc(db, "sessions", id);
      const existing = await getDoc(target);
      if (!existing.exists()) return;
      const session = existing.data() as PhotoSession;
      if (!auth?.currentUser || (session.ownerId !== auth.currentUser.uid && auth.currentUser.uid !== process.env.NEXT_PUBLIC_ADMIN_UID)) throw new Error("삭제 권한이 없습니다.");
      if (!storage) throw new Error("사진 저장소에 연결할 수 없습니다.");
      // Delete the full folder, including removed photos and incomplete uploads.
      const folder = session.ownerId ? `members/${session.ownerId}/sessions/${id}` : `sessions/${id}`;
      if (session.ownerId) {
        await removeStorageTree(ref(storage, folder));
      } else {
        // Legacy rules already permit exact admin-owned paths; no recursive list required.
        for (const photo of session.photos || []) {
          for (const size of ["thumb", "medium", "large"]) {
            try { await deleteObject(ref(storage, `${folder}/${photo.id}/${size}.webp`)); }
            catch (error) { if ((error as { code?: string }).code !== "storage/object-not-found") throw error; }
          }
        }
      }
      if (session.ownerId) {
        const photoDocs = await getDocs(collection(db, "sessions", id, "photos"));
        for (let i = 0; i < photoDocs.docs.length; i += 400) {
          const batch = writeBatch(db);
          photoDocs.docs.slice(i, i + 400).forEach(photo => batch.delete(photo.ref));
          await batch.commit();
        }
      }
      const commentDocs = await getDocs(collection(db, "sessions", id, "comments"));
      for (let i = 0; i < commentDocs.docs.length; i += 400) {
        const batch = writeBatch(db);
        commentDocs.docs.slice(i, i + 400).forEach(comment => batch.delete(comment.ref));
        await batch.commit();
      }
      await deleteDoc(target);
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
  compressed: CompressedImageSet,
  ownerId?: string
): Promise<{ urls: PhotoItem["urls"]; storagePaths: PhotoItem["storagePaths"] }> {
  if (isFirebaseConfigured && !storage) throw new Error("Firebase 사진 저장소 연결에 실패했습니다.");
  if (isFirebaseConfigured && storage) {
    const basePath = ownerId ? `members/${ownerId}/sessions/${sessionId}/${photoId}` : `sessions/${sessionId}/${photoId}`;
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

// Owner-filtered query: never fetch all private posts in the member interface.
export async function fetchOwnedSessions(ownerId: string): Promise<PhotoSession[]> {
  if (!db) throw new Error("회원 데이터에 연결할 수 없습니다.");
  const snapshot = await getDocs(query(collection(db, "sessions"), where("ownerId", "==", ownerId)));
  const sessions = await Promise.all(snapshot.docs.map(item => hydrateSession({ ...item.data(), id: item.id } as PhotoSession)));
  return sessions.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function fetchPublicSessionsByOwner(ownerId: string): Promise<PhotoSession[]> {
  if (!db) throw new Error("사진집 데이터에 연결할 수 없습니다.");
  const snapshot = await getDocs(query(collection(db, "sessions"), where("ownerId", "==", ownerId), where("isPublished", "==", true)));
  const sessions = await Promise.all(snapshot.docs.map(item => hydrateSession({ ...item.data(), id: item.id } as PhotoSession)));
  return sessions.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
