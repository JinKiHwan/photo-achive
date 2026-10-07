"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export type LikeState = { count: number; liked: boolean };
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
      try {
        const all = key ? key.split(",") : [];
        const next: Record<string, LikeState> = {};
        for (let i = 0; i < all.length; i += 60) {
          const response = await fetch(`/api/likes?ids=${encodeURIComponent(all.slice(i, i + 60).join(","))}`, { cache: "no-store", signal: controller.signal });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "좋아요를 불러오지 못했습니다.");
          Object.assign(next, result.likes);
        }
        if (!controller.signal.aborted && requestId === refreshId && startedRevision === revision.current) {
          setLikes(next); setError(""); setReady(true);
        }
      } catch (reason) {
        if (!controller.signal.aborted && requestId === refreshId) { setError(reason instanceof Error ? reason.message : "좋아요를 불러오지 못했습니다."); setReady(false); }
      }
    }
    void refresh();
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); window.removeEventListener("focus", refresh); };
  }, [key]);
  const update = useCallback((id: string, state: LikeState) => {
    revision.current += 1;
    setLikes(current => ({ ...current, [id]: state }));
  }, []);
  return { likes, update, ready, error };
}
