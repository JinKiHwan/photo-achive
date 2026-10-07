"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type LikeState = { count: number; liked: boolean };

function getLocalLikes(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("photo_archive_user_likes") || "{}");
  } catch {
    return {};
  }
}

export function saveLocalLike(id: string, liked: boolean) {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalLikes();
    if (liked) current[id] = true;
    else delete current[id];
    localStorage.setItem("photo_archive_user_likes", JSON.stringify(current));
  } catch {}
}

export function useLikes(ids: string[]) {
  const key = [...ids].sort().join(",");
  const [likes, setLikes] = useState<Record<string, LikeState>>({});
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const revision = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    let refreshId = 0;
    async function refresh() {
      const requestId = ++refreshId;
      const startedRevision = revision.current;
      const all = key ? key.split(",") : [];
      if (!all.length) return;

      try {
        const next: Record<string, LikeState> = {};
        const localLiked = getLocalLikes();

        try {
          for (let i = 0; i < all.length; i += 60) {
            const batch = all.slice(i, i + 60);
            const response = await fetch(`/api/likes?ids=${encodeURIComponent(batch.join(","))}`, { cache: "no-store", signal: controller.signal });
            if (!response.ok) throw new Error("API fallback");
            const result = await response.json();
            Object.assign(next, result.likes);
          }
        } catch {
          const firestoreDb = db;
          if (firestoreDb) {
            await Promise.all(all.map(async (id) => {
              const snap = await getDoc(doc(firestoreDb, "likeStats", id));
              const count = snap.exists() ? (snap.data().count ?? 0) : 0;
              next[id] = { count, liked: Boolean(localLiked[id]) };
            }));
          }
        }

        if (!controller.signal.aborted && requestId === refreshId && startedRevision === revision.current) {
          setLikes(next); setError(""); setReady(true);
        }
      } catch (reason) {
        if (!controller.signal.aborted && requestId === refreshId) {
          setError(reason instanceof Error ? reason.message : "좋아요를 불러오지 못했습니다.");
          setReady(false);
        }
      }
    }
    void refresh();
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); window.removeEventListener("focus", refresh); };
  }, [key]);

  const update = useCallback((id: string, state: LikeState) => {
    revision.current += 1;
    saveLocalLike(id, state.liked);
    setLikes(current => ({ ...current, [id]: state }));
  }, []);

  return { likes, update, ready, error };
}
