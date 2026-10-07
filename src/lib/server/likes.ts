import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { voterKey } from "./like-identity";

export class LikeError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const validSessionId = (id: unknown): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(id);
export type LikeState = { count: number; liked: boolean };

export async function readLikes(db: Firestore, ids: string[], ip: string, secret: string): Promise<Record<string, LikeState>> {
  const posts = await db.getAll(...ids.map(id => db.doc(`sessions/${id}`)));
  const published = posts.filter(post => post.data()?.isPublished === true);
  if (!published.length) return {};
  const refs = published.flatMap(post => [db.doc(`likeStats/${post.id}`), db.doc(`likeVotes/${post.id}/voters/${voterKey(ip, post.id, secret)}`)]);
  const snapshots = await db.getAll(...refs);
  return Object.fromEntries(published.map((post, i) => [post.id, {
    count: snapshots[i * 2].data()?.count ?? 0,
    liked: snapshots[i * 2 + 1].data()?.liked === true,
  }]));
}

export async function setLike(db: Firestore, id: string, ip: string, secret: string, liked: boolean): Promise<LikeState> {
  const post = db.doc(`sessions/${id}`);
  const stat = db.doc(`likeStats/${id}`);
  const vote = db.doc(`likeVotes/${id}/voters/${voterKey(ip, id, secret)}`);
  return db.runTransaction(async transaction => {
    const [postDoc, statDoc, voteDoc] = await transaction.getAll(post, stat, vote);
    if (postDoc.data()?.isPublished !== true) throw new LikeError(404, "공개된 글을 찾을 수 없습니다.");
    const previous = voteDoc.data();
    const count = statDoc.data()?.count ?? 0;
    const wasLiked = previous?.liked === true;
    // Desired state rather than a toggle makes retries and simultaneous clicks idempotent.
    if (wasLiked === liked) return { count, liked };
    const now = Date.now();
    if (previous?.updatedAt?.toMillis() > now - 1000) throw new LikeError(429, "잠시 후 다시 눌러 주세요.");
    const nextCount = Math.max(0, count + (liked ? 1 : -1));
    transaction.set(stat, { count: nextCount });
    // A short-lived unliked tombstone preserves throttling. Configure Firestore TTL on expiresAt.
    transaction.set(vote, { liked, updatedAt: Timestamp.fromMillis(now), ...(liked ? {} : { expiresAt: Timestamp.fromMillis(now + 86400000) }) });
    return { count: nextCount, liked };
  });
}
