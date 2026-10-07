"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { doc, increment, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LikeState, saveLocalLike, useLikes } from "@/hooks/useLikes";

async function syncLike(sessionId: string, liked: boolean, nextCount: number): Promise<LikeState> {
  try {
    const response = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, liked }),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch {}

  const firestoreDb = db;
  if (!firestoreDb) throw new Error("데이터베이스 연결 실패");
  const statRef = doc(firestoreDb, "likeStats", sessionId);
  await setDoc(statRef, { count: increment(liked ? 1 : -1) }, { merge: true });
  return { count: nextCount, liked };
}

export function LikeButton({ sessionId, state, unavailable, onChange }: {
  sessionId: string; state?: LikeState; unavailable?: string; onChange: (id: string, state: LikeState) => void;
}) {
  const [error, setError] = useState("");
  const [isPopping, setIsPopping] = useState(false);

  const currentState = state || { count: 0, liked: false };

  function handleClick(event: React.MouseEvent) {
    event.stopPropagation();
    if (unavailable) return;

    setError("");
    const originalState = { ...currentState };
    const targetLiked = !currentState.liked;
    const optimisticCount = Math.max(0, currentState.count + (targetLiked ? 1 : -1));
    const optimisticState = { count: optimisticCount, liked: targetLiked };

    // 1. INSTANT OPTIMISTIC UPDATE (0ms)
    saveLocalLike(sessionId, targetLiked);
    onChange(sessionId, optimisticState);

    // Heart pop animation
    if (targetLiked) {
      setIsPopping(true);
      setTimeout(() => setIsPopping(false), 300);
    }

    // 2. BACKGROUND SYNC (Non-blocking)
    syncLike(sessionId, targetLiked, optimisticCount)
      .then((serverResult) => {
        onChange(sessionId, serverResult);
      })
      .catch(() => {
        // Rollback on error
        saveLocalLike(sessionId, originalState.liked);
        onChange(sessionId, originalState);
        setError("좋아요 업데이트 실패");
      });
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        aria-label={currentState.liked ? "좋아요 취소" : "좋아요"}
        aria-pressed={currentState.liked}
        disabled={Boolean(unavailable)}
        title={unavailable || "클릭하면 즉시 마음이 전달됩니다"}
        onClick={handleClick}
        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${
          currentState.liked
            ? "border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 shadow-sm"
            : "border-zinc-700/80 bg-zinc-900/60 text-zinc-300 hover:border-zinc-500 hover:text-white"
        }`}
      >
        <Heart
          size={15}
          className={`transition-all duration-200 ${
            isPopping ? "scale-125 text-rose-500" : ""
          }`}
          fill={currentState.liked ? "currentColor" : "none"}
        />
        <span>좋아요 {currentState.count.toLocaleString("ko-KR")}</span>
      </button>
      {error && <p role="alert" className="max-w-64 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

export function PostLikeButton({ sessionId }: { sessionId: string }) {
  const { likes, update, error } = useLikes([sessionId]);
  return (
    <div className="space-y-2">
      <LikeButton
        sessionId={sessionId}
        state={likes[sessionId] || { count: 0, liked: false }}
        onChange={update}
        unavailable={error}
      />
      {error && <p role="status" className="text-xs text-zinc-400">{error}</p>}
    </div>
  );
}
