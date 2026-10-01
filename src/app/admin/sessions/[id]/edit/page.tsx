"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchSessionByIdOrSlug } from "@/lib/db";
import { PhotoSession } from "@/types";
import { SessionForm } from "@/components/admin/SessionForm";

interface EditSessionPageProps {
  params: Promise<{ id: string }>;
}

export default function EditSessionPage({ params }: EditSessionPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [session, setSession] = useState<PhotoSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/admin/login");
      return;
    }

    async function load() {
      const data = await fetchSessionByIdOrSlug(id);
      setSession(data);
      setLoading(false);
    }

    load();
  }, [id, isAdmin, authLoading, router]);

  if (authLoading || loading) {
    return <div className="p-12 text-center text-xs font-mono text-zinc-500">불러오는 중...</div>;
  }

  if (!session) {
    return (
      <div className="p-12 text-center text-xs font-mono text-rose-400">
        해당 출사 기록을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="font-serif-book text-3xl text-zinc-100 mb-8 border-b border-zinc-800 pb-4">
        출사 기록 수정: {session.title}
      </h1>
      <SessionForm initialSession={session} isEdit />
    </div>
  );
}
