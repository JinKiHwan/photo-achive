import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { auth, db } from "./firebase";
import type { PublicProfile } from "@/types";

export async function fetchPublicProfile(uid: string): Promise<PublicProfile | null> {
  if (!db) throw new Error("프로필 데이터에 연결할 수 없습니다.");
  const snapshot = await getDoc(doc(db, "publicProfiles", uid));
  return snapshot.exists() ? snapshot.data() as PublicProfile : null;
}

export async function savePublicProfile(
  user: User,
  values: { displayName: string; bio: string; useGooglePhoto: boolean },
): Promise<void> {
  if (!db || !auth?.currentUser || auth.currentUser.uid !== user.uid) throw new Error("다시 로그인해 주세요.");
  const displayName = values.displayName.trim();
  const bio = values.bio.trim();
  if (!displayName || displayName.length > 40) throw new Error("활동 이름은 1~40자로 입력해 주세요.");
  if (bio.length > 300) throw new Error("소개는 300자 이내로 입력해 주세요.");
  const photoURL = values.useGooglePhoto && user.photoURL?.startsWith("https://") ? user.photoURL : "";
  const target = doc(db, "publicProfiles", user.uid);
  const existing = await getDoc(target);
  await setDoc(target, {
    uid: user.uid,
    displayName,
    bio,
    photoURL,
    createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePublicProfile(uid: string): Promise<void> {
  if (!db || !auth?.currentUser || auth.currentUser.uid !== uid) throw new Error("다시 로그인해 주세요.");
  await deleteDoc(doc(db, "publicProfiles", uid));
}
