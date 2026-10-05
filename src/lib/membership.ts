import { GoogleAuthProvider, reauthenticateWithPopup, deleteUser, type User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where, writeBatch } from "firebase/firestore";
import { ref } from "firebase/storage";
import { auth, db, storage } from "./firebase";
import { removeStorageTree } from "./storage-cleanup";
import { POLICY_VERSION } from "./community-config";
import { deleteSession, fetchOwnedSessions } from "./db";

export async function acceptMembership(user: User) {
  if (!db) throw new Error("회원 데이터에 연결할 수 없습니다.");
  const target = doc(db, "members", user.uid);
  const existing = await getDoc(target);
  if (existing.exists() && existing.data().deleting) throw new Error("탈퇴가 진행 중입니다. 내 사진에서 탈퇴를 다시 진행해 주세요.");
  if (existing.exists() && existing.data().policyVersion === POLICY_VERSION) return;
  await setDoc(target, { policyVersion: POLICY_VERSION, acceptedAt: serverTimestamp(), deleting: false });
}

export async function fetchMembership(uid: string): Promise<{ deleting: boolean } | null> {
  if (!db) return null;
  const snapshot = await getDoc(doc(db, "members", uid));
  return snapshot.exists() ? { deleting: snapshot.data().deleting === true } : null;
}

export async function withdrawMembership() {
  const user = auth?.currentUser;
  if (!user || !db || !storage) throw new Error("다시 로그인해 주세요.");
  if (user.uid === process.env.NEXT_PUBLIC_ADMIN_UID) throw new Error("관리자 계정은 회원 탈퇴 대상이 아닙니다.");
  // Verify identity before removing anything; leave the account until cleanup succeeds.
  await reauthenticateWithPopup(user, new GoogleAuthProvider());
  const memberRef = doc(db, "members", user.uid);
  const member = await getDoc(memberRef);
  if (member.exists()) await setDoc(memberRef, { deleting: true }, { merge: true });
  const sessions = await fetchOwnedSessions(user.uid);
  // Rules refuse further writes once deleting is true, including from another tab.
  for (const session of sessions) await deleteSession(session.id);
  await removeStorageTree(ref(storage, `members/${user.uid}`));
  const reports = await getDocs(query(collection(db, "reports"), where("reporterId", "==", user.uid)));
  for (let i = 0; i < reports.docs.length; i += 400) {
    const batch = writeBatch(db);
    reports.docs.slice(i, i + 400).forEach(report => batch.delete(report.ref));
    await batch.commit();
  }
  // A failure leaves the authenticated account available for a safe retry.
  await deleteDoc(memberRef);
  await deleteUser(user);
}

export const REPORT_REASONS = ["개인정보·위치 노출", "저작권 침해", "부적절한 사진·내용", "광고·스팸", "기타"] as const;
export type PhotoReport = { id: string; reporterId: string; sessionId: string; reason: string; status: "open" | "resolved" };
export async function reportSession(sessionId: string, reason: string) {
  const user = auth?.currentUser;
  if (!db || !user) throw new Error("로그인 후 신고할 수 있습니다.");
  if (!REPORT_REASONS.some(item => item === reason)) throw new Error("신고 사유를 선택해 주세요.");
  const target = doc(db, "reports", `${user.uid}_${sessionId}`);
  if ((await getDoc(target)).exists()) throw new Error("이미 신고한 게시물입니다.");
  await setDoc(target, { reporterId: user.uid, sessionId, reason, status: "open", createdAt: serverTimestamp() });
}
export async function fetchReports(): Promise<PhotoReport[]> {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, "reports"));
  return snapshot.docs.map(item => ({ ...item.data(), id: item.id } as PhotoReport));
}
export async function resolveReport(id: string) {
  if (!db) throw new Error("데이터베이스에 연결할 수 없습니다.");
  await setDoc(doc(db, "reports", id), { status: "resolved" }, { merge: true });
}
