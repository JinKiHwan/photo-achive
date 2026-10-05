"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchSessionByIdOrSlug } from "@/lib/db";
import { fetchMembership } from "@/lib/membership";
import { membershipEnabled } from "@/lib/community-config";
import type { PhotoSession } from "@/types";
import { SessionForm } from "./SessionForm";

export function MemberEditor({ id }: { id?: string }) {
  const { user, loading, isAdmin } = useAuth();
  const uid = user && "uid" in user ? user.uid : undefined;
  const [state, setState] = useState<{ uid?: string; ready: boolean; session?: PhotoSession; error?: string }>({ ready: false });
  useEffect(() => {
    if (!uid || !membershipEnabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const member = await fetchMembership(uid);
        if (!member || member.deleting) throw new Error(member?.deleting ? "탈퇴가 진행 중입니다. 내 사진에서 계속 진행해 주세요." : "회원 가입 절차를 완료해 주세요.");
        const session = id ? await fetchSessionByIdOrSlug(id) : undefined;
        if (id && (!session || session.ownerId !== uid)) throw new Error("수정할 수 있는 글이 아닙니다.");
        if (!cancelled) setState({ uid, ready: true, session: session ?? undefined });
      } catch (error) { if (!cancelled) setState({ ready: false, error: error instanceof Error ? error.message : "글을 불러오지 못했습니다." }); }
    })();
    return () => { cancelled = true; };
  }, [uid, id]);
  if (loading) return <p className="p-12">로그인 확인 중…</p>;
  if (!uid) return <p className="p-12"><Link href="/login" className="underline">로그인 후 사진을 올릴 수 있습니다.</Link></p>;
  if (isAdmin) return <p className="p-12"><Link href="/admin" className="underline">관리자 사진 관리로 이동</Link></p>;
  if (!membershipEnabled) return <p className="p-12">회원 서비스 준비 중입니다.</p>;
  if (state.error) return <div className="p-12 space-y-4"><p role="alert">{state.error}</p><Link href="/my" className="underline">내 사진</Link> · <Link href="/login" className="underline">가입 절차</Link></div>;
  if (!state.ready || state.uid !== uid) return <p className="p-12">불러오는 중…</p>;
  return <div className="px-6 py-10"><h1 className="mx-auto max-w-4xl text-3xl mb-8">{id ? "내 출사 수정" : "새 출사 기록"}</h1><SessionForm key={id || "new"} memberMode initialSession={state.session} /></div>;
}
