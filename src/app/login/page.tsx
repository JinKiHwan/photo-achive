"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { membershipEnabled } from "@/lib/community-config";

export default function LoginPage() {
  const { loginWithGoogle, user, isAdmin } = useAuth();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signIn() {
    if (!agreed || busy) return;
    setBusy(true); setError("");
    try { await loginWithGoogle(); router.push("/my"); }
    catch (error) {
      const code = (error as { code?: string }).code;
      setError(code === "auth/popup-closed-by-user" ? "로그인 창을 닫았습니다. 다시 시도할 수 있습니다."
        : code === "auth/popup-blocked" ? "브라우저에서 팝업을 허용하고 다시 시도해 주세요."
        : code === "auth/operation-not-allowed" || code === "auth/unauthorized-domain" ? "Google 로그인 설정을 준비 중입니다. 잠시 후 다시 이용해 주세요."
        : error instanceof Error ? error.message : "로그인하지 못했습니다.");
    } finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-md px-6 py-16 space-y-6">
    <h1 className="text-3xl font-serif-book">사진으로 만나는 출사지</h1>
    <p className="text-sm text-zinc-300">Google 계정으로 로그인해 사진을 올리고 나만의 출사 기록을 공유하세요.</p>
    {!membershipEnabled && <p role="status" className="rounded-xl border border-amber-800 bg-zinc-950/80 p-4 text-sm text-amber-200">회원 서비스 오픈을 준비하고 있습니다. 공개 사진은 로그인 없이 감상할 수 있습니다.</p>}
    <div className="rounded-xl bg-zinc-950/80 border border-zinc-700 p-5 space-y-5">
      <p className="text-xs text-zinc-400">로그인에는 Google 계정의 기본 프로필과 이메일을 사용합니다. 비밀번호는 이 서비스에 전달되지 않습니다.</p>
      <div className="flex gap-4 text-sm underline"><Link href="/terms">이용약관</Link><Link href="/privacy">개인정보처리방침</Link></div>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1" />만 14세 이상이며 이용약관에 동의하고 개인정보처리방침을 확인했습니다.</label>
      <button type="button" disabled={!membershipEnabled || !agreed || busy} onClick={() => void signIn()} className="w-full rounded-lg bg-white px-4 py-3 text-zinc-950 disabled:opacity-40">{busy ? "로그인 중…" : "Google로 시작하기"}</button>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    </div>
    {user && <Link className="block underline text-sm" href={isAdmin ? "/admin" : "/my"}>내 사진 관리로 이동</Link>}
    <div className="flex justify-between rounded-lg bg-zinc-950/80 px-4 py-3 text-xs text-zinc-200"><Link href="/">사진 둘러보기</Link><Link href="/admin/login">관리자 로그인</Link></div>
  </div>;
}
