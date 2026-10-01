"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchSessions, deleteSession, saveSession } from "@/lib/db";
import { PhotoSession } from "@/types";
import {
  Plus,
  Edit,
  Trash2,
  Globe,
  EyeOff,
  ExternalLink,
  Calendar,
  MapPin,
  Camera,
  Images,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<PhotoSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/admin/login");
      return;
    }

    loadSessions();
  }, [isAdmin, authLoading, router]);

  const loadSessions = async () => {
    setLoading(true);
    const data = await fetchSessions(false); // Fetch ALL including unpublished drafts
    setSessions(data);
    setLoading(false);
  };

  const handleTogglePublish = async (session: PhotoSession) => {
    const updated = { ...session, isPublished: !session.isPublished };
    await saveSession(updated);
    loadSessions();
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`'${title}' 출사 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      await deleteSession(id);
      loadSessions();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-xs text-zinc-500 font-mono">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="font-serif-book text-3xl text-zinc-100">출사 사진집 관리</h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            등록된 전체 출사목록 관리, 대표 사진 및 사진 순서 수정
          </p>
        </div>

        <Link
          href="/admin/sessions/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold font-mono transition"
        >
          <Plus className="w-4 h-4" />
          <span>새 출사 등록</span>
        </Link>
      </div>

      {/* Sessions Table / Cards */}
      <div className="space-y-4">
        {sessions.map((session) => {
          const coverUrl =
            session.coverImageUrl ||
            (session.photos && session.photos[0]?.urls.medium) ||
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=500";

          return (
            <div
              key={session.id}
              className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition"
            >
              {/* Left Info */}
              <div className="flex items-center gap-5">
                <div className="relative w-24 h-20 rounded-lg overflow-hidden bg-black shrink-0 border border-zinc-800">
                  <Image
                    src={coverUrl}
                    alt={session.title}
                    fill
                    sizes="100px"
                    className="object-cover"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
                        session.isPublished
                          ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-300"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400"
                      }`}
                    >
                      {session.isPublished ? (
                        <>
                          <Globe className="w-3 h-3" /> 공개
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> 임시 저장
                        </>
                      )}
                    </span>

                    <span className="text-xs text-zinc-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {session.date}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono flex items-center gap-1">
                      <Images className="w-3 h-3" /> {session.photos?.length || 0} 장
                    </span>
                  </div>

                  <h2 className="font-serif-book text-xl text-zinc-200">{session.title}</h2>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-500" /> {session.location}
                    </span>
                    {session.camera && (
                      <span className="flex items-center gap-1 text-zinc-500">
                        <Camera className="w-3 h-3" /> {session.camera}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <Link
                  href={`/sessions/${session.slug || session.id}`}
                  target="_blank"
                  className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition"
                  title="미리보기 (새창)"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => handleTogglePublish(session)}
                  className={`px-3 py-2 rounded-lg border text-xs font-mono transition ${
                    session.isPublished
                      ? "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                      : "bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40"
                  }`}
                >
                  {session.isPublished ? "비공개로 전환" : "공개하기"}
                </button>

                <Link
                  href={`/admin/sessions/${session.id}/edit`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>수정</span>
                </Link>

                <button
                  onClick={() => handleDelete(session.id, session.title)}
                  className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
                  title="출사 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
