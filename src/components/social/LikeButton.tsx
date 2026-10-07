"use client";
import { useRef, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { LikeState, useLikes } from "@/hooks/useLikes";

export function LikeButton({ sessionId, state, unavailable, onChange }: {
  sessionId: string; state?: LikeState; unavailable?: string; onChange: (id: string, state: LikeState) => void;
}) {
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState("");
  async function toggle() {
    if (!state || locked.current || unavailable) return;
    locked.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, liked: !state.liked }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "좋아요를 저장하지 못했습니다.");
      onChange(sessionId, data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "다시 시도해 주세요."); }
    finally { locked.current = false; setBusy(false); }
  }
  return <div className="space-y-1">
    <button type="button" aria-label={state?.liked ? "좋아요 취소" : "좋아요"} aria-pressed={state?.liked ?? false}
      disabled={busy || !state || Boolean(unavailable)} title={unavailable || "비회원도 참여할 수 있어요 · 같은 IP에서 글마다 하나"}
      onClick={event => { event.stopPropagation(); void toggle(); }}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition disabled:cursor-default disabled:opacity-50 ${state?.liked ? "border-rose-400/50 bg-rose-400/10 text-rose-500" : "border-current/20 text-current opacity-75 hover:opacity-100"}`}>
      {busy ? <Loader2 size={15} className="animate-spin" /> : <Heart size={15} fill={state?.liked ? "currentColor" : "none"} />}
      <span>좋아요 {state ? state.count.toLocaleString("ko-KR") : "—"}</span>
    </button>
    {error && <p role="alert" className="max-w-64 text-xs text-rose-500">{error}</p>}
  </div>;
}
export function PostLikeButton({ sessionId }: { sessionId: string }) {
  const { likes, update, error } = useLikes([sessionId]);
  return <div className="space-y-2"><LikeButton sessionId={sessionId} state={likes[sessionId]} onChange={update} unavailable={error} />{error && <p role="status" className="text-xs text-zinc-400">{error}</p>}</div>;
}
