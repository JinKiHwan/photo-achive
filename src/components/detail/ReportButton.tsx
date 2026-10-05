"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { membershipEnabled } from "@/lib/community-config";
import { reportSession, REPORT_REASONS } from "@/lib/membership";
export function ReportButton({ sessionId }: { sessionId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  if (!membershipEnabled) return null;
  return <div className="mt-6 text-xs text-zinc-400" onKeyDown={e => e.stopPropagation()}>
    <button type="button" className="underline" onClick={() => setOpen(!open)}>게시물 신고</button>
    {open && <div className="mt-3 space-y-3 rounded-lg bg-zinc-950/90 p-3">
      {!user ? <Link href="/login" className="underline">로그인 후 신고하기</Link> : <>
        <label className="block">신고 사유<select value={reason} onChange={e => setReason(e.target.value)} className="mt-2 block w-full bg-zinc-900 p-2">{REPORT_REASONS.map(item => <option key={item}>{item}</option>)}</select></label>
        <button disabled={busy || message === "신고가 접수되었습니다."} type="button" className="rounded border border-zinc-500 p-2 disabled:opacity-40" onClick={async () => { setBusy(true); try { await reportSession(sessionId, reason); setMessage("신고가 접수되었습니다."); } catch (error) { setMessage(error instanceof Error ? error.message : "신고 접수에 실패했습니다."); } finally { setBusy(false); } }}>신고 접수</button>
        <p role="status">{message}</p>
      </>}
    </div>}
  </div>;
}
