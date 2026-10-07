"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { deleteSession, fetchOwnedSessions } from "@/lib/db";
import { withdrawMembership } from "@/lib/membership";
import { membershipEnabled } from "@/lib/community-config";
import type { PhotoSession } from "@/types";
import { ProfileEditor } from "@/components/profile/ProfileEditor";

export default function MyPhotosPage() {
  const { user, loading, isAdmin } = useAuth();
  const uid = user && "uid" in user ? user.uid : undefined;
  const [sessions, setSessions] = useState<PhotoSession[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [withdrawText, setWithdrawText] = useState("");
  const [complete, setComplete] = useState(false);
  const reload = useCallback(async () => {
    if (!uid || isAdmin) return;
    try { setSessions(await fetchOwnedSessions(uid)); }
    catch { setError("내 사진을 불러오지 못했습니다. 다시 시도해 주세요."); }
  }, [uid, isAdmin]);
  useEffect(() => {
    if (!uid || isAdmin) return;
    let cancelled = false;
    void fetchOwnedSessions(uid).then(items => { if (!cancelled) setSessions(items); })
      .catch(() => { if (!cancelled) setError("내 사진을 불러오지 못했습니다. 다시 시도해 주세요."); });
    return () => { cancelled = true; };
  }, [uid, isAdmin]);
  async function remove(session: PhotoSession) {
    if (!confirm(`‘${session.title}’ 글과 사진 파일을 삭제할까요? 삭제 후 복구할 수 없습니다.`)) return;
    setBusy(true); setError("");
    try { await deleteSession(session.id); await reload(); }
    catch { setError("삭제를 완료하지 못했습니다. 다시 시도해 주세요."); }
    finally { setBusy(false); }
  }
  async function withdraw() {
    if (withdrawText !== "탈퇴" || busy) return;
    setBusy(true); setError("");
    try { await withdrawMembership(); setComplete(true); }
    catch { setError("탈퇴를 완료하지 못했습니다. Google 계정 확인이나 연결 상태를 확인하고 다시 시도해 주세요. 일부 삭제가 진행됐을 수 있으며, 다시 실행하면 남은 데이터를 정리합니다."); }
    finally { setBusy(false); }
  }
  if (complete) return <div className="p-12 space-y-4"><p>계정과 업로드한 사진을 삭제했습니다.</p><Link href="/">사진 둘러보기</Link></div>;
  if (loading) return <p className="p-12">불러오는 중…</p>;
  if (!uid) return <p className="p-12"><Link href="/login" className="underline">로그인해 주세요.</Link></p>;
  if (isAdmin) return <p className="p-12"><Link href="/admin" className="underline">관리자 사진 관리로 이동</Link></p>;
  return <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">
    <div className="flex items-center justify-between"><h1 className="text-3xl">내 사진</h1>{membershipEnabled && <Link href="/my/new" className="rounded bg-white px-4 py-2 text-black text-sm">새 출사 기록</Link>}</div>
    {membershipEnabled && user && "uid" in user && <ProfileEditor user={user} />}
    {error && <div role="alert" className="text-rose-300 text-sm">{error} <button onClick={() => void reload()} className="underline">다시 불러오기</button></div>}
    {!sessions.length && <p className="text-zinc-400">아직 저장한 사진집이 없습니다.</p>}
    {sessions.filter(session => session.ownerId === uid).map(session => <article key={session.id} className="rounded-xl bg-zinc-950/80 border border-zinc-700 p-5 flex flex-wrap justify-between gap-4">
      <div><h2 className="text-lg">{session.title}</h2><p className="text-xs text-zinc-400 mt-2">{session.isPublished ? "공개" : "비공개"} · 촬영일 {session.date}</p></div>
      <div className="flex items-center gap-4 text-sm">{session.isPublished && <Link href={`/sessions/${session.id}`}>보기</Link>}<Link href={`/my/${session.id}/edit`}>수정</Link><button disabled={busy} onClick={() => void remove(session)} className="text-rose-300 disabled:opacity-40">삭제</button></div>
    </article>)}
    <details className="border-t border-zinc-700 pt-6 text-sm space-y-4"><summary className="cursor-pointer text-zinc-400">회원 탈퇴</summary>
      <p>계정, 내 사진집·사진 파일, 공개 프로필, 작성 댓글, 신고 내역과 약관 확인 기록을 삭제합니다. 복구할 수 없습니다. 계속하려면 아래에 ‘탈퇴’를 입력하세요. Google 계정 자체는 삭제되지 않습니다.</p>
      <label className="block">탈퇴 확인<input value={withdrawText} onChange={e => setWithdrawText(e.target.value)} className="block mt-2 rounded bg-zinc-900 border border-zinc-600 p-2" /></label>
      <button disabled={busy || withdrawText !== "탈퇴"} onClick={() => void withdraw()} className="rounded bg-rose-950 border border-rose-700 px-4 py-2 disabled:opacity-40">{busy ? "처리 중…" : "Google 계정 확인 후 탈퇴"}</button>
    </details>
  </div>;
}
