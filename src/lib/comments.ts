import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { PhotoComment } from "@/types";

export async function fetchComments(sessionId: string): Promise<PhotoComment[]> {
  if (!db) throw new Error("댓글 데이터에 연결할 수 없습니다.");
  const snapshot = await getDocs(query(collection(db, "sessions", sessionId, "comments"), orderBy("createdAt", "asc")));
  return snapshot.docs.map(item => item.data() as PhotoComment);
}

export async function addComment(sessionId: string, bodyValue: string): Promise<void> {
  const user = auth?.currentUser;
  if (!db || !user) throw new Error("로그인 후 댓글을 작성할 수 있습니다.");
  const body = bodyValue.trim();
  if (!body || body.length > 500) throw new Error("댓글은 1~500자로 입력해 주세요.");
  const target = doc(collection(db, "sessions", sessionId, "comments"));
  await setDoc(target, {id: target.id, sessionId, authorId: user.uid, body, createdAt: serverTimestamp(), updatedAt: serverTimestamp()});
}

export async function updateComment(sessionId: string, commentId: string, bodyValue: string): Promise<void> {
  if (!db || !auth?.currentUser) throw new Error("다시 로그인해 주세요.");
  const body = bodyValue.trim();
  if (!body || body.length > 500) throw new Error("댓글은 1~500자로 입력해 주세요.");
  await updateDoc(doc(db, "sessions", sessionId, "comments", commentId), {body, updatedAt: serverTimestamp()});
}

export async function deleteComment(sessionId: string, commentId: string): Promise<void> {
  if (!db || !auth?.currentUser) throw new Error("다시 로그인해 주세요.");
  await deleteDoc(doc(db, "sessions", sessionId, "comments", commentId));
}
