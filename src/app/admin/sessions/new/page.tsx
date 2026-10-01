"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SessionForm } from "@/components/admin/SessionForm";

export default function NewSessionPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/admin/login");
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return <div className="p-12 text-center text-xs font-mono text-zinc-500">인증 확인 중...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="font-serif-book text-3xl text-zinc-100 mb-8 border-b border-zinc-800 pb-4">
        새 출사 기록 작성
      </h1>
      <SessionForm />
    </div>
  );
}
