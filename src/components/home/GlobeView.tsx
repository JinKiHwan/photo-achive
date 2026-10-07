"use client";

import { Component, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { LocateFixed, Globe2, Loader2 } from "lucide-react";
import { GeoLocation, PhotoSession } from "@/types";
import { nearbySessions, sessionGps } from "@/lib/geo";
import { SessionStrip } from "./SessionStrip";

const GlobeScene = dynamic(() => import("./GlobeScene"), { ssr: false, loading: () => <div className="flex h-96 items-center justify-center text-sm text-zinc-400">지구본 불러오는 중…</div> });
class GlobeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert" className="p-12 text-center text-sm text-zinc-400">이 환경에서는 3D 지구본을 표시할 수 없습니다. 아래 위치 링크로 촬영 장소를 확인하세요.</p> : this.props.children; }
}

export default function GlobeView({ sessions }: { sessions: PhotoSession[] }) {
  const [mode, setMode] = useState<"nearby" | "world">("nearby");
  const [position, setPosition] = useState<GeoLocation | null>(null);
  const [consent, setConsent] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [radius, setRadius] = useState(50);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overviewRequest, setOverviewRequest] = useState(0);
  const requestVersion = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => () => { requestVersion.current += 1; }, []);
  useEffect(() => {
    const element = dialog.current;
    if (!consent || !element) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }); };
  }, [consent]);
  const located = useMemo(() => sessions.filter(session => session.isPublished && session.shareLocation !== false && sessionGps(session)?.source !== "demo" && sessionGps(session)), [sessions]);
  const nearby = useMemo(() => position ? nearbySessions(located, position, radius) : [], [located, position, radius]);
  const shown = useMemo(() => mode === "world" ? located : nearby.map(item => item.session), [mode, located, nearby]);
  const distances = useMemo(() => new Map(nearby.map(item => [item.session.id, item.distance])), [nearby]);
  const points = useMemo(() => shown.map(session => ({ ...sessionGps(session)!, id: session.id, title: session.title })), [shown]);
  const active = shown.find(session => session.id === activeId);
  const gps = active ? sessionGps(active) : undefined;

  function world() {
    requestVersion.current += 1; setLocating(false); setConsent(false); setMode("world"); setActiveId(null); setOverviewRequest(value => value + 1);
  }
  function locate() {
    setConsent(false); setMode("nearby"); setLocationError(""); setLocating(true); setActiveId(null);
    const version = ++requestVersion.current;
    if (!navigator.geolocation || !window.isSecureContext) { setLocationError("이 환경에서는 현재 위치를 확인할 수 없습니다. HTTPS로 접속하거나 지구 전체보기를 이용해 주세요."); setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(result => {
      if (version !== requestVersion.current) return;
      setPosition({ latitude: result.coords.latitude, longitude: result.coords.longitude, source: "manual" });
      setLocating(false); setOverviewRequest(value => value + 1);
    }, error => {
      if (version !== requestVersion.current) return;
      setLocating(false);
      setLocationError(error.code === 1 ? "위치 접근이 허용되지 않았습니다. 브라우저의 위치 권한을 허용한 뒤 다시 시도하거나 지구 전체보기를 이용해 주세요." : error.code === 3 ? "위치 확인 시간이 초과되었습니다. 다시 시도해 주세요." : "현재 위치를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 });
  }
  return <section id="globe-panel" role="tabpanel" aria-labelledby="globe-tab" className="w-full space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex gap-2">
        <button type="button" aria-pressed={mode === "nearby"} onClick={() => { if (position) { setMode("nearby"); setActiveId(null); setOverviewRequest(value => value + 1); } else setConsent(true); }} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${mode === "nearby" ? "bg-white text-black border-white" : "border-white/20 text-zinc-300"}`}><LocateFixed size={16} />내 주변</button>
        <button type="button" aria-pressed={mode === "world"} onClick={world} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${mode === "world" ? "bg-white text-black border-white" : "border-white/20 text-zinc-300"}`}><Globe2 size={16} />지구 전체보기</button>
      </div>
      {mode === "nearby" && position && <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
        <label>반경 <select aria-label="주변 검색 반경" value={radius} onChange={event => { setRadius(Number(event.target.value)); setActiveId(null); }} className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1">{[10, 25, 50, 100, 200].map(km => <option key={km} value={km}>{km}km</option>)}</select></label>
        <button type="button" onClick={() => setConsent(true)} className="underline">위치 다시 확인</button>
      </div>}
    </div>
    <div role="status" className="text-sm text-zinc-300">
      {locating ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} />현재 위치를 확인하는 중…</span> : mode === "nearby" ? locationError || (position ? `내 주변 ${radius}km · ${shown.length}개의 출사 기록 · 가까운 순` : "위치 사용에 동의하면 가까운 출사지를 볼 수 있습니다.") : `공개된 촬영 위치 ${shown.length}곳 · 지구 전체보기`}
    </div>
    {mode === "nearby" && !locating && !position && <button type="button" onClick={() => setConsent(true)} className="rounded-lg border border-white/30 px-4 py-2 text-sm text-white">위치 확인하고 주변 출사 찾기</button>}
    {mode === "nearby" && position && !shown.length && <p className="rounded-xl border border-white/10 bg-black/20 p-6 text-sm text-zinc-400">이 범위에 공개된 출사지가 아직 없습니다. 반경을 넓히거나 지구 전체보기를 선택해 주세요.</p>}
    {mode === "world" && !shown.length && <p className="text-sm text-zinc-400">공개된 촬영 위치가 아직 없습니다.</p>}
    {shown.length > 0 && <SessionStrip>
      {shown.map(session => {
        const selected = activeId === session.id;
        const cover = session.coverImageUrl || session.photos[0]?.urls.thumb;
        const distance = distances.get(session.id);
        return <button key={session.id} type="button" aria-pressed={selected} onClick={() => setActiveId(session.id)} className={`w-64 shrink-0 snap-start overflow-hidden rounded-xl border text-left transition ${selected ? "border-orange-400 bg-orange-400/10 ring-1 ring-orange-400" : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-500"}`}>
          <div className="relative h-36 bg-zinc-900">{cover && <Image src={cover} alt={session.title} fill sizes="256px" className="object-cover" />}</div>
          <div className="space-y-1 p-3"><h2 className="truncate text-sm text-zinc-100">{session.title}</h2><p className="truncate text-xs text-zinc-400">{session.location}</p>{mode === "nearby" && distance !== undefined && <p className="text-xs text-orange-300">직선거리 약 {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}</p>}</div>
        </button>;
      })}
    </SessionStrip>}
    {(mode === "world" || position) && <div className="overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/35 shadow-xl backdrop-blur-xl">
      <GlobeBoundary><GlobeScene points={points} activeId={active?.id ?? null} overviewRequest={overviewRequest} center={mode === "nearby" ? position : null} radiusKm={radius} onSelect={setActiveId} /></GlobeBoundary>
      <div aria-live="polite" className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/10 p-5">
        <div><p className="text-sm text-zinc-100">{active?.title ?? (mode === "nearby" ? "내 주변의 출사 기록" : "사진으로 기록한 지구")}</p><p className="mt-1 text-xs text-zinc-400">{active && gps ? active.location : "사진글이나 지도 핀을 선택하면 촬영 장소로 이동합니다."}</p></div>
        {active && <div className="flex gap-4 text-xs">{gps && <a href={`https://www.google.com/maps/search/?api=1&query=${gps.latitude},${gps.longitude}`} target="_blank" rel="noreferrer" className="text-zinc-300 underline">지도 보기</a>}<Link href={`/sessions/${active.slug || active.id}`} className="rounded-full bg-zinc-100 px-4 py-2 text-black">사진글 열기 →</Link></div>}
      </div>
    </div>}
    {consent && <dialog ref={dialog} onCancel={event => { event.preventDefault(); world(); }} aria-labelledby="nearby-consent-title" className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-7 text-zinc-100 shadow-2xl backdrop:bg-black/70">
      <LocateFixed className="mb-4 text-orange-300" size={28} />
      <h2 id="nearby-consent-title" className="text-xl font-semibold">내 주변 출사지를 찾아볼까요?</h2>
      <p className="mt-4 text-sm leading-7 text-zinc-300">현재 위치로 가까운 촬영 장소와 거리를 계산합니다. 위치는 이 화면에서만 사용하며 서비스 서버에 저장하지 않습니다. 지도 제공자에게는 표시할 지역의 지도 요청과 접속 정보가 전달될 수 있습니다.</p>
      <p className="mt-3 text-xs leading-6 text-zinc-400">선택 사항입니다. 동의하지 않아도 지구 전체보기로 모든 공개 출사지를 볼 수 있습니다. 다음 단계에서 브라우저의 위치 권한도 허용해 주세요.</p>
      <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={locate} className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black">동의하고 내 주변 보기</button><button type="button" onClick={world} className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm">동의 안 함 · 전체보기</button></div>
    </dialog>}
  </section>;
}
