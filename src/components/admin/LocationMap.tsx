"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeoLocation } from "@/types";
const pin = divIcon({ className: "", html: '<svg width="32" height="44" viewBox="0 0 32 44"><path d="M16 43C13 37 1 24 1 16a15 15 0 1 1 30 0c0 8-12 21-15 27Z" fill="#ff8844" stroke="white" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="#1f2937"/></svg>', iconSize: [32, 44], iconAnchor: [16, 43] });

function MapEvents({ value, onChange }: Props) {
  const map = useMap();
  const [error, setError] = useState("");
  useEffect(() => { if (value && value.source !== "manual") map.flyTo([value.latitude, value.longitude], 16, { duration: 0.7 }); }, [map, value]);
  useMapEvents({ click: event => onChange({ latitude: event.latlng.lat, longitude: ((event.latlng.lng + 180) % 360 + 360) % 360 - 180, source: "manual" }) });
  return <>
    {value && <Marker position={[value.latitude, value.longitude]} icon={pin} draggable eventHandlers={{ dragend: event => { const position = event.target.getLatLng(); onChange({ latitude: position.lat, longitude: ((position.lng + 180) % 360 + 360) % 360 - 180, source: "manual" }); } }} />}
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
      <button type="button" className="rounded bg-white px-3 py-2 text-xs text-black shadow" onClick={() => { const center = map.getCenter(); onChange({ latitude: center.lat, longitude: ((center.lng + 180) % 360 + 360) % 360 - 180, source: "manual" }); }}>지도 중심에 핀 놓기</button>
      <button type="button" className="rounded bg-white px-3 py-2 text-xs text-black shadow" onClick={() => {
        if (!navigator.geolocation) { setError("현재 위치를 사용할 수 없습니다."); return; }
        navigator.geolocation.getCurrentPosition(position => { const gps = { latitude: position.coords.latitude, longitude: position.coords.longitude, source: "manual" as const }; setError(""); onChange(gps); map.flyTo([gps.latitude, gps.longitude], 16); }, () => setError("위치 권한을 확인하거나 지도에서 직접 지정해 주세요."), { timeout: 10000 });
      }}>내 위치로 이동</button>
    </div>
    {error && <p role="alert" className="absolute bottom-8 left-3 right-3 z-[1000] rounded bg-white p-2 text-xs text-black">{error}</p>}
  </>;
}
type Props = { value: GeoLocation | null; onChange: (value: GeoLocation) => void };
export default function LocationMap(props: Props) {
  return <div className="relative z-0 h-80 overflow-hidden rounded-lg sm:h-96">
    <MapContainer center={[props.value?.latitude ?? 37.5665, props.value?.longitude ?? 126.978]} zoom={props.value ? 16 : 7} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapEvents {...props} />
    </MapContainer>
  </div>;
}
