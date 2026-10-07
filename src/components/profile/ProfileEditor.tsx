"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { User } from "firebase/auth";
import { deletePublicProfile, fetchPublicProfile, savePublicProfile } from "@/lib/profiles";

export function ProfileEditor({ user }: { user: User }) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [bio, setBio] = useState("");
  const [useGooglePhoto, setUseGooglePhoto] = useState(Boolean(user.photoURL));
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetchPublicProfile(user.uid).then(profile => {
      if (cancelled || !profile) return;
      setDisplayName(profile.displayName);
      setBio(profile.bio);
      setUseGooglePhoto(Boolean(profile.photoURL));
      setSaved(true);
    }).catch(() => {
      if (!cancelled) setError("프로필을 불러오지 못했습니다.");
    }).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [user.uid]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await savePublicProfile(user, {displayName, bio, useGooglePhoto});
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "프로필을 저장하지 못했습니다.");
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!confirm("공개 프로필의 이름, 소개와 사진을 삭제할까요? 공개 사진집은 유지됩니다.")) return;
    setBusy(true); setError("");
    try {
      await deletePublicProfile(user.uid);
      setDisplayName(user.displayName || ""); setBio(""); setUseGooglePhoto(Boolean(user.photoURL)); setSaved(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "프로필을 삭제하지 못했습니다.");
    } finally { setBusy(false); }
  }

  return <section className="rounded-2xl border border-white/10 bg-zinc-950/65 p-6 shadow-xl backdrop-blur-md">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl">공개 프로필</h2><p className="mt-1 text-xs text-zinc-400">활동 이름, 소개와 선택한 Google 사진만 공개됩니다. 이메일은 공개하지 않습니다.</p></div>
      {saved && <Link href={`/profiles/${user.uid}`} className="text-sm text-zinc-300 underline">내 공개 프로필 보기</Link>}
    </div>
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-[96px_1fr]">
      <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/15 bg-zinc-900">
        {useGooglePhoto && user.photoURL ? <Image src={user.photoURL} alt="Google 프로필 사진" fill sizes="96px" className="object-cover" /> : <span className="grid h-full place-items-center text-3xl text-zinc-500">{displayName.trim().slice(0, 1) || "-"}</span>}
      </div>
      <div className="space-y-4">
        <label className="block text-xs text-zinc-400">활동 이름
          <input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={40} required className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white" />
        </label>
        <label className="block text-xs text-zinc-400">소개
          <textarea value={bio} onChange={event => setBio(event.target.value)} maxLength={300} rows={3} placeholder="어떤 사진을 찍는지 간단히 소개해 주세요." className="mt-1.5 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm leading-relaxed text-white" />
          <span className="mt-1 block text-right text-[11px] text-zinc-500">{bio.length}/300</span>
        </label>
        {user.photoURL && <label className="flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={useGooglePhoto} onChange={event => setUseGooglePhoto(event.target.checked)} /> Google 프로필 사진 공개</label>}
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        <div className="flex flex-wrap items-center gap-4"><button disabled={busy} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-40">{busy ? "처리 중…" : saved ? "프로필 저장" : "공개 프로필 만들기"}</button>{saved && <button type="button" disabled={busy} onClick={() => void remove()} className="text-xs text-zinc-400 underline disabled:opacity-40">공개 프로필 삭제</button>}</div>
      </div>
    </form>
  </section>;
}
