"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchReports, resolveReport, type PhotoReport } from "@/lib/membership";
export default function ReportsPage() {
  const { isAdmin, loading } = useAuth();
  const [reports, setReports] = useState<PhotoReport[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (isAdmin) void fetchReports().then(setReports).catch(() => setError("신고 목록을 불러오지 못했습니다.")); }, [isAdmin]);
  if (loading) return <p className="p-12">불러오는 중…</p>;
  if (!isAdmin) return <p className="p-12"><Link href="/admin/login">관리자 로그인이 필요합니다.</Link></p>;
  return <div className="mx-auto max-w-4xl px-6 py-12 space-y-6"><h1 className="text-3xl">신고 관리</h1><Link href="/admin" className="underline">사진집 관리</Link>
    {error && <p role="alert">{error}</p>}{!reports.length && <p>접수된 신고가 없습니다.</p>}
    {reports.map(report => <article key={report.id} className="border border-zinc-700 bg-zinc-950 p-5 rounded-xl space-y-3"><p>{report.reason} · {report.status === "open" ? "검토 대기" : "처리 완료"}</p>
      <div className="flex gap-4 text-sm"><Link href={`/sessions/${report.sessionId}`} className="underline">게시물 보기</Link><Link href={`/admin/sessions/${report.sessionId}/edit`} className="underline">게시물 관리</Link>
      {report.status === "open" && <button disabled={busy} onClick={async () => { setBusy(true); try { await resolveReport(report.id); setReports(await fetchReports()); } catch { setError("처리 상태를 저장하지 못했습니다."); } finally { setBusy(false); } }}>처리 완료로 표시</button>}</div>
    </article>)}
  </div>;
}
