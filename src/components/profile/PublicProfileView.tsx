"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import { fetchPublicSessionsByOwner } from "@/lib/db";
import { fetchPublicProfile } from "@/lib/profiles";
import type { PhotoSession, PublicProfile } from "@/types";

export function PublicProfileView({ uid }: { uid: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [sessions, setSessions] = useState<PhotoSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetchPublicProfile(uid), fetchPublicSessionsByOwner(uid)]).then(([nextProfile, nextSessions]) => {
      if (cancelled) return;
      setProfile(nextProfile); setSessions(nextSessions);
    }).catch(() => { if (!cancelled) setError("프로필을 불러오지 못했습니다."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [uid]);

  if (loading) return <p className="p-12 text-center text-zinc-400">프로필 불러오는 중…</p>;
  if (error) return <p role="alert" className="p-12 text-center text-rose-300">{error}</p>;
  return <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
    <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={16} /> 출사 목록</Link>
    <section className="mb-12 flex flex-col items-center gap-5 text-center">
      <div className="relative h-28 w-28 overflow-hidden rounded-full border border-white/15 bg-zinc-900 shadow-2xl">
        {profile?.photoURL ? <Image src={profile.photoURL} alt={`${profile.displayName} 프로필 사진`} fill sizes="112px" className="object-cover" /> : <span className="grid h-full place-items-center"><Camera className="text-zinc-500" size={34} /></span>}
      </div>
      <div><h1 className="text-3xl font-medium">{profile?.displayName || "이름 미등록"}</h1>{profile?.bio && <p className="mx-auto mt-3 max-w-xl whitespace-pre-wrap text-sm leading-7 text-zinc-300">{profile.bio}</p>}</div>
      <p className="text-xs text-zinc-500">공개 사진집 {sessions.length}개</p>
    </section>
    {!sessions.length ? <p className="text-center text-zinc-400">공개한 사진집이 없습니다.</p> : <section className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3" aria-label="공개 사진집">
      {sessions.map(session => {
        const cover = session.coverImageUrl || session.photos[0]?.urls.medium;
        return <Link key={session.id} href={`/sessions/${session.slug || session.id}`} className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-950/60 p-3 transition hover:-translate-y-1 hover:border-white/25">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-900">{cover ? <Image src={cover} alt={session.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" /> : <span className="grid h-full place-items-center text-zinc-600">사진 없음</span>}</div>
          <div className="px-1 pb-2 pt-4"><h2 className="text-lg">{session.title}</h2><p className="mt-1 text-xs text-zinc-400">{session.date}{session.shareLocation ? ` · ${session.location}` : ""}</p></div>
        </Link>;
      })}
    </section>}
  </main>;
}
