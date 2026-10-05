"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoLocation } from "@/types";

const pin = divIcon({
  className: "",
  html: '<svg width="32" height="44" viewBox="0 0 32 44"><path d="M16 43C13 37 1 24 1 16a15 15 0 1 1 30 0c0 8-12 21-15 27Z" fill="#ff8844" stroke="white" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="#1f2937"/></svg>',
  iconSize: [32, 44], iconAnchor: [16, 43],
});

function SyncMapSize() {
  const map = useMap();
  useEffect(() => {
    // A cached map module can mount before showModal(), while its size is zero.
    // Leaflet tracks window resizes, but not a dialog becoming visible.
    const container = map.getContainer();
    let frame = 0;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (container.clientWidth && container.clientHeight) {
          map.invalidateSize({ animate: false });
        }
      });
    };
    const observer = new ResizeObserver(refresh);
    observer.observe(container);
    refresh();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [map]);
  return null;
}

export default function PhotoLocationMap({ gps }: { gps: GeoLocation }) {
  return <MapContainer key={`${gps.latitude},${gps.longitude}`} center={[gps.latitude, gps.longitude]} zoom={16} style={{ height: "100%", width: "100%" }}>
    <SyncMapSize />
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Marker position={[gps.latitude, gps.longitude]} icon={pin} />
  </MapContainer>;
}
