"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { addComment, deleteComment, fetchComments, updateComment } from "@/lib/comments";
import { fetchPublicProfile } from "@/lib/profiles";
import { membershipEnabled } from "@/lib/community-config";
import type { PhotoComment } from "@/types";

function commentTime(value: unknown): string {
  const date = value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
    ? value.toDate() : value instanceof Date ? value : null;
  return date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("ko-KR", {dateStyle: "medium", timeStyle: "short"}).format(date) : "방금 전";
}

export function CommentsPanel({ sessionId }: { sessionId: string }) {
  const { user, isAdmin } = useAuth();
  const uid = user && "uid" in user ? user.uid : "";
  const [comments, setComments] = useState<PhotoComment[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingBody, setEditingBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const next = await fetchComments(sessionId);
    setComments(next);
    const authors = [...new Set(next.map(comment => comment.authorId))];
    const profiles = await Promise.all(authors.map(async authorId => [authorId, await fetchPublicProfile(authorId)] as const));
    setNames(Object.fromEntries(profiles.map(([authorId, profile]) => [authorId, profile?.displayName || "회원"])));
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    void fetchComments(sessionId).then(async next => {
      if (cancelled) return;
      setComments(next);
      const authors = [...new Set(next.map(comment => comment.authorId))];
      const profiles = await Promise.all(authors.map(async authorId => [authorId, await fetchPublicProfile(authorId)] as const));
      if (!cancelled) setNames(Object.fromEntries(profiles.map(([authorId, profile]) => [authorId, profile?.displayName || "회원"])));
    }).catch(() => { if (!cancelled) setError("댓글을 불러오지 못했습니다."); });
    return () => { cancelled = true; };
  }, [sessionId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try { await addComment(sessionId, body); setBody(""); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "댓글을 등록하지 못했습니다."); }
    finally { setBusy(false); }
  }

  async function saveEdit(commentId: string) {
    setBusy(true); setError("");
    try { await updateComment(sessionId, commentId, editingBody); setEditingId(""); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "댓글을 수정하지 못했습니다."); }
    finally { setBusy(false); }
  }

  async function remove(commentId: string) {
    if (!confirm("댓글을 삭제할까요?")) return;
    setBusy(true); setError("");
    try { await deleteComment(sessionId, commentId); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "댓글을 삭제하지 못했습니다."); }
    finally { setBusy(false); }
  }

  return <section className="flex flex-col flex-1 min-h-0 mt-3 border-t border-white/15 pt-3 overflow-hidden" aria-label="댓글">
    <h2 className="flex items-center gap-2 text-xs font-medium flex-shrink-0"><MessageCircle size={14} /> 댓글 {comments.length}</h2>
    {membershipEnabled ? uid ? <form onSubmit={submit} className="mt-2 space-y-1.5 flex-shrink-0"><textarea value={body} onChange={event => setBody(event.target.value)} maxLength={500} rows={2} placeholder="사진과 장소에 관한 이야기를 남겨보세요." className="w-full resize-y rounded-lg border border-white/15 bg-black/25 p-2.5 text-xs leading-relaxed text-white" /><div className="flex items-center justify-between text-[11px] text-zinc-400"><span>{body.length}/500</span><button disabled={busy || !body.trim()} className="rounded-full bg-white px-3 py-1 text-black text-[11px] font-medium disabled:opacity-40">등록</button></div></form> : <p className="mt-2 text-xs text-zinc-400 flex-shrink-0"><Link href="/login" className="underline">Google 로그인</Link> 후 댓글을 작성할 수 있습니다.</p> : <p className="mt-2 text-xs text-zinc-400 flex-shrink-0">댓글 작성을 준비하고 있습니다.</p>}
    {error && <p role="alert" className="mt-2 text-xs text-rose-300 flex-shrink-0">{error}</p>}
    <div className="mt-3 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pr-2">
      {comments.map(comment => <article key={comment.id} className="border-t border-white/10 pt-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2"><Link href={`/profiles/${comment.authorId}`} className="font-medium text-zinc-200 hover:underline">{names[comment.authorId] || "회원"}</Link><time className="text-[10px] text-zinc-500">{commentTime(comment.createdAt)}</time></div>
        {editingId === comment.id ? <div className="mt-2 space-y-2"><textarea value={editingBody} onChange={event => setEditingBody(event.target.value)} maxLength={500} rows={3} className="w-full rounded border border-white/15 bg-black/30 p-2" /><div className="flex gap-3"><button disabled={busy || !editingBody.trim()} onClick={() => void saveEdit(comment.id)}>저장</button><button onClick={() => setEditingId("")}>취소</button></div></div> : <p className="mt-2 whitespace-pre-wrap leading-6 text-zinc-300">{comment.body}</p>}
        {(uid === comment.authorId || isAdmin) && editingId !== comment.id && <div className="mt-2 flex gap-3 text-[10px] text-zinc-500">{uid === comment.authorId && <button onClick={() => {setEditingId(comment.id); setEditingBody(comment.body);}}>수정</button>}<button disabled={busy} onClick={() => void remove(comment.id)}>삭제</button></div>}
      </article>)}
    </div>
  </section>;
}
