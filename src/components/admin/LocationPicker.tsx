"use client";

import { useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { GeoLocation } from "@/types";
import { isValidGps } from "@/lib/geo";
import { normalizeLocationQuery } from "@/lib/location-search";

const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false, loading: () => <p className="p-6 text-xs">지도 불러오는 중…</p> });
type Place = { place_id: number; display_name: string; lat: string; lon: string };
const cache = new Map<string, { places: Place[]; provider: string }>();
let nextSearchAt = 0;

type Props = {
  value: GeoLocation | null; onChange: (value: GeoLocation | null) => void;
  onPlaceName?: (name: string) => void; label: string;
};
export function LocationPicker(props: Props) {
  return <LocationPickerFields {...props} />;
}
function LocationPickerFields({ value, onChange, onPlaceName, label }: Props) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searchProvider, setSearchProvider] = useState("OpenStreetMap / Nominatim");
  const [draft, setDraft] = useState({ gps: value, lat: value?.latitude.toString() ?? "", lng: value?.longitude.toString() ?? "" });
  const lat = draft.gps === value ? draft.lat : value?.latitude.toString() ?? "";
  const lng = draft.gps === value ? draft.lng : value?.longitude.toString() ?? "";
  const setLat = (lat: string) => setDraft({ gps: value, lat, lng });
  const setLng = (lng: string) => setDraft({ gps: value, lat, lng });
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function search() {
    const term = normalizeLocationQuery(query);
    if (term.length < 2 || busy) return;
    const coordinates = term.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (coordinates) {
      const gps = { latitude: Number(coordinates[1]), longitude: Number(coordinates[2]), source: "search" as const };
      if (isValidGps(gps)) { setError(""); setResults([]); onChange(gps); return; }
      setError("유효한 위도, 경도를 입력해 주세요."); return;
    }
    setError("");
    setResults([]);
    const cached = cache.get(term);
    if (cached) { setResults(cached.places); setSearchProvider(cached.provider); return; }
    if (Date.now() < nextSearchAt) { setError("잠시 후 다시 검색해 주세요."); return; }
    nextSearchAt = Date.now() + 1500;
    setBusy(true);
    controller.current = new AbortController();
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=ko&q=${encodeURIComponent(term)}`, { signal: controller.current.signal });
      if (!response.ok) throw new Error("검색 서비스에 연결할 수 없습니다. 지도 또는 좌표로 설정해 주세요.");
      const data: Place[] = await response.json();
      if (data.length) cache.set(term, { places: data, provider: "OpenStreetMap / Nominatim" });
      setSearchProvider("OpenStreetMap / Nominatim");
      setResults(data);
      if (!data.length) setError("검색 결과가 없습니다. 전체 주소로 검색하거나 Google 지도에서 좌표를 복사해 붙여넣어 주세요.");
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError")) setError(err instanceof Error ? err.message : "검색 실패");
    } finally { setBusy(false); }
  }

  return <fieldset className="min-w-0 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
    <legend className="px-2 text-sm text-zinc-200">{label}</legend>
    <div className="flex gap-2">
      <input aria-label="장소 검색" value={query} onChange={e => { setQuery(e.target.value); setResults([]); setError(""); }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void search(); } }} placeholder="시·군·구를 포함한 도로명 주소 또는 장소명" className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 p-2 text-sm" />
      <button type="button" disabled={busy || query.trim().length < 2} onClick={() => void search()} className="rounded bg-zinc-100 px-3 text-xs text-black disabled:opacity-40">{busy ? "검색 중…" : "검색"}</button>
    </div>
    {results.length > 0 && <ul className="max-h-40 overflow-auto text-xs">{results.map(place => <li key={place.place_id}><button type="button" className="w-full rounded p-2 text-left hover:bg-zinc-800" onClick={() => {
      const gps = { latitude: Number(place.lat), longitude: Number(place.lon), source: "search" as const };
      if (isValidGps(gps)) { onChange(gps); onPlaceName?.(place.display_name); setResults([]); }
    }}>{place.display_name}</button></li>)}</ul>}
    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim() || "대한민국")}`} target="_blank" rel="noreferrer" className="block text-xs text-zinc-300 underline">Google 지도에서 주소 찾기 ↗</a>
    <p className="text-[11px] text-zinc-400">Google 지도에서 위치를 우클릭해 좌표를 복사한 뒤 검색창에 붙여넣으면 바로 적용됩니다.</p>
    <LocationMap value={value} onChange={onChange} />
    <details className="space-y-3 text-xs text-zinc-400"><summary className="cursor-pointer">좌표 직접 입력</summary>
    <div className="mt-3 grid grid-cols-2 gap-3">
      <label htmlFor={`${id}-lat`} className="text-xs">위도<input id={`${id}-lat`} type="number" step="any" min="-90" max="90" value={lat} onChange={e => setLat(e.target.value)} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2" /></label>
      <label htmlFor={`${id}-lng`} className="text-xs">경도<input id={`${id}-lng`} type="number" step="any" min="-180" max="180" value={lng} onChange={e => setLng(e.target.value)} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2" /></label>
    </div>
    </details>
    <div className="flex gap-3 text-xs">
      <button type="button" onClick={() => {
        const gps = { latitude: Number(lat), longitude: Number(lng), source: "manual" as const };
        if (!lat.trim() || !lng.trim() || !isValidGps(gps)) { setError("위도는 -90~90, 경도는 -180~180으로 입력해 주세요."); return; }
        setError(""); onChange(gps);
      }} className="rounded border border-zinc-600 px-3 py-2">좌표 적용</button>
      {value && <button type="button" onClick={() => onChange(null)} className="text-zinc-400">위치 지우기</button>}
    </div>
    {error && <p role="alert" className="text-xs text-amber-300">{error}</p>}
    {value && <p className="text-xs text-emerald-300">{value.source === "exif" ? "원본 사진 GPS" : "설정된 위치"} · {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}</p>}
    <p className="text-[11px] text-zinc-500">지도를 클릭해 위치를 지정하세요. 장소 검색: {searchProvider}</p>
    {value && <a href={`https://www.google.com/maps/search/?api=1&query=${value.latitude},${value.longitude}`} target="_blank" rel="noreferrer" className="block text-xs text-zinc-300 underline">Google 지도에서 위치 확인</a>}
  </fieldset>;
}
