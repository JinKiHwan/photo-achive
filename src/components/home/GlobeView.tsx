"use client";

import { Component, ReactNode, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { PhotoSession } from "@/types";
import { sessionGps } from "@/lib/geo";
import { SessionStrip } from "./SessionStrip";

const GlobeScene = dynamic(() => import("./GlobeScene"), { ssr: false, loading: () => <div className="flex h-96 items-center justify-center text-sm text-zinc-400">지구본 불러오는 중…</div> });
class GlobeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert" className="p-12 text-center text-sm text-zinc-400">이 환경에서는 3D 지구본을 표시할 수 없습니다. 아래 위치 링크로 촬영 장소를 확인하세요.</p> : this.props.children; }
}

export default function GlobeView({ sessions }: { sessions: PhotoSession[] }) {
  const points = useMemo(() => sessions.flatMap(session => {
    const gps = sessionGps(session);
    return gps ? [{ ...gps, id: session.id, title: session.title }] : [];
  }), [sessions]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = sessions.find(session => session.id === activeId);
  const gps = active ? sessionGps(active) : undefined;
  return <section id="globe-panel" role="tabpanel" aria-labelledby="globe-tab" className="w-full space-y-5">
    <p className="text-xs text-zinc-400">사진글을 선택하면 촬영 장소로 이동합니다 · {points.length}개의 위치</p>
    <SessionStrip>
      {sessions.map(session => {
        const located = Boolean(sessionGps(session));
        const selected = activeId === session.id;
        const cover = session.coverImageUrl || session.photos[0]?.urls.thumb;
        return <button key={session.id} type="button" aria-pressed={selected} onClick={() => setActiveId(session.id)} className={`w-64 shrink-0 snap-start overflow-hidden rounded-xl border text-left transition ${selected ? "border-orange-400 bg-orange-400/10 ring-1 ring-orange-400" : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-500"}`}>
          <div className="relative h-32 bg-zinc-900">{cover && <Image src={cover} alt={session.title} fill sizes="256px" className="object-cover" />}</div>
          <div className="space-y-1 p-3"><h2 className="truncate text-sm text-zinc-100">{session.title}</h2><p className="truncate text-xs text-zinc-400">{session.location}</p><p className="text-[11px] text-zinc-500">{located ? session.date : "촬영 좌표 미등록"}</p></div>
        </button>;
      })}
    </SessionStrip>
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/35 shadow-[0_20px_70px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
      <div className="relative isolate">
        <GlobeBoundary><GlobeScene points={points} activeId={activeId} onSelect={setActiveId} /></GlobeBoundary>
        <button type="button" onClick={() => setActiveId(null)} className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-xs text-zinc-200 backdrop-blur-md transition hover:border-white/40 hover:bg-black/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-5 sm:top-5">지구 전체 보기</button>
      </div>
      <div aria-live="polite" className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/10 p-5">
        <div><p className="text-sm text-zinc-100">{active?.title ?? "사진으로 기록한 지구"}</p><p className="mt-1 text-xs text-zinc-400">{active ? gps ? `${active.location} · ${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}${gps.source === "demo" ? " · 임시 예시 좌표" : ""}` : "이 사진글에는 GPS가 없습니다. 편집 화면에서 위치를 추가해 주세요." : points.length ? "사진글을 선택하면 해당 장소까지 확대합니다. 드래그와 스크롤로 이동할 수 있습니다." : "등록된 촬영 좌표가 없습니다. 사진 업로드 또는 글 편집에서 위치를 추가해 주세요."}</p></div>
        {active && <div className="flex gap-4 text-xs">{gps && <a href={`https://www.google.com/maps/search/?api=1&query=${gps.latitude},${gps.longitude}`} target="_blank" rel="noreferrer" className="text-zinc-300 underline">지도 보기</a>}<Link href={`/sessions/${active.slug || active.id}`} className="rounded-full bg-zinc-100 px-4 py-2 text-black">사진글 열기 →</Link></div>}
      </div>
    </div>
  </section>;
}
