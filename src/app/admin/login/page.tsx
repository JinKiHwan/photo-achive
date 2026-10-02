"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import { Lock, LogIn, Sparkles, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAdmin, loading: authLoading } = useAuth();
  const [email, setEmail] = useState(isFirebaseConfigured ? "" : "admin@photoarchive.kr");
  const [password, setPassword] = useState(isFirebaseConfigured ? "" : "admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && isAdmin) router.replace("/admin");
  }, [authLoading, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || isAdmin) return null;

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-800 p-8 rounded-2xl space-y-6 shadow-2xl relative">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-300">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="font-serif-book text-2xl text-zinc-100">관리자 로그인</h1>
          <p className="text-xs text-zinc-400 font-mono">
            새로운 출사 기록 등록 및 사진 관리를 위한 인증
          </p>
        </div>

        {!isFirebaseConfigured && (
          <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-xs text-amber-200 font-mono space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>로컬 데모 인증 모드 활성화</span>
            </div>
            <p className="text-[11px] text-amber-300/80 font-sans">
              Firebase 환경변수가 설정되지 않아 즉시 테스트용 관리자 계정으로 로그인할 수 있습니다.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">이메일 계정</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">비밀번호</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold font-mono flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? "인증 확인 중..." : "관리자 로그인"}</span>
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-zinc-500 font-mono flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
          <span>보안 권한: 관리자 전용 쓰기/편집 기능</span>
        </div>
      </div>
    </div>
  );
}
