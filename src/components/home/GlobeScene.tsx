"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import { AmbientLight, DirectionalLight } from "three";
import { GeoLocation } from "@/types";

export type GlobePoint = GeoLocation & { id: string; title: string };
const streetTiles = (x: number, y: number, level: number) => `https://tile.openstreetmap.org/${level}/${x}/${y}.png`;
export default function GlobeScene({ points, activeId, overviewRequest, center, radiusKm = 50, onSelect }: { points: GlobePoint[]; activeId: string | null; overviewRequest: number; center?: GeoLocation | null; radiusKm?: number; onSelect: (id: string) => void }) {
  const ref = useRef<GlobeMethods | undefined>(undefined);
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [ready, setReady] = useState(false);
  const [detailedId, setDetailedId] = useState<string | null>(null);
  const [transition, setTransition] = useState<{ image: string; id: string; fading: boolean } | null>(null);
  const showDetails = activeId ? detailedId === activeId : Boolean(center);
  useEffect(() => {
    let frame: number;
    const initialize = () => {
      // Camera controls are usable before the remote surface texture finishes loading.
      if (ref.current) setReady(true);
      else frame = requestAnimationFrame(initialize);
    };
    frame = requestAnimationFrame(initialize);
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!ready || !ref.current) return;
    const globe = ref.current;
    const ambient = new AmbientLight(0xffffff, 2.2);
    const sun = new DirectionalLight(0xfff4e8, 1.2);
    sun.position.set(-100, 100, 150);
    globe.lights([ambient, sun]);
    globe.controls().minDistance = globe.getGlobeRadius() * 1.0003;
    globe.controls().maxDistance = globe.getGlobeRadius() * 5;
    const point = points.find(p => p.id === activeId);
    globe.controls().autoRotate = false;
    globe.controls().autoRotateSpeed = 0.35;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) globe.controls().autoRotate = false;
    if (!point) {
      globe.pointOfView(center
        ? { lat: center.latitude, lng: center.longitude, altitude: Math.max(0.008, radiusKm / 1000) }
        : { lat: 25, lng: 125, altitude: 2.2 }, reduced ? 0 : 1000);
      return;
    }
    const target = { lat: point.latitude, lng: point.longitude, altitude: 0.002 };
    const revealDetails = () => {
      if (!reduced) {
        try {
          const renderer = globe.renderer();
          renderer.render(globe.scene(), globe.camera());
          setTransition({ image: renderer.domElement.toDataURL("image/png"), id: point.id, fading: false });
        } catch { /* The map remains usable if the browser cannot capture the frame. */ }
      }
      setDetailedId(point.id);
    };
    if (reduced) {
      globe.pointOfView(target);
      const reveal = window.setTimeout(revealDetails, 0);
      return () => clearTimeout(reveal);
    }
    // Pull away before turning so travel between distant places remains visible.
    globe.pointOfView({ altitude: Math.max(globe.pointOfView().altitude ?? 0, 0.8) }, 550);
    const rotate = window.setTimeout(() => globe.pointOfView({ lat: target.lat, lng: target.lng, altitude: 0.8 }, 1000), 550);
    const zoom = window.setTimeout(() => globe.pointOfView(target, 1500), 1550);
    const reveal = window.setTimeout(revealDetails, 3100);
    const interrupt = () => { clearTimeout(rotate); clearTimeout(zoom); clearTimeout(reveal); };
    const onInteraction = () => { interrupt(); setTransition(null); setDetailedId(point.id); };
    const controls = globe.controls();
    controls.addEventListener("start", onInteraction);
    return () => { interrupt(); controls.removeEventListener("start", onInteraction); };
  }, [activeId, points, ready, overviewRequest, center, radiusKm]);
  useEffect(() => {
    if (!activeId || detailedId !== activeId) return;
    const started = performance.now();
    let frame: number;
    let fadeTimer: number;
    const waitForTiles = () => {
      let loaded = false;
      ref.current?.scene().traverse(object => {
        const mesh = object as import("three").Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) {
          const image = (material as { map?: { image?: HTMLImageElement } } | undefined)?.map?.image;
          if (image?.src?.includes("tile.openstreetmap.org") && image.complete && image.naturalWidth > 0) loaded = true;
        }
      });
      if (loaded || performance.now() - started > 8000) {
        fadeTimer = window.setTimeout(() => setTransition(current => current?.id === activeId ? { ...current, fading: true } : current), 250);
      } else frame = requestAnimationFrame(waitForTiles);
    };
    frame = requestAnimationFrame(waitForTiles);
    return () => { cancelAnimationFrame(frame); clearTimeout(fadeTimer); };
  }, [activeId, detailedId]);
  const createPin = useCallback((data: object) => {
    const point = data as GlobePoint;
    const selected = point.id === activeId;
    const anchor = document.createElement("div");
    anchor.style.cssText = "position:relative;width:0;height:0;pointer-events:none";
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", point.title);
    button.setAttribute("aria-pressed", String(selected));
    button.title = point.title;
    button.style.cssText = `position:absolute;bottom:0;left:0;transform:translateX(-50%);pointer-events:auto;border:0;background:none;padding:0;cursor:pointer;filter:drop-shadow(0 3px 5px #0009);color:${selected ? "#ff8844" : "#c0e3ff"}`;
    // The SVG tip is anchored at the surface coordinate, regardless of zoom.
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 32 44");
    svg.setAttribute("width", selected ? "32" : "20");
    svg.setAttribute("height", selected ? "44" : "28");
    svg.style.display = "block";
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("d", "M16 43C13 37 1 24 1 16a15 15 0 1 1 30 0c0 8-12 21-15 27Z");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("stroke", "white");
    path.setAttribute("stroke-width", "1.5");
    const hole = document.createElementNS(svg.namespaceURI, "circle");
    hole.setAttribute("cx", "16"); hole.setAttribute("cy", "16"); hole.setAttribute("r", "5"); hole.setAttribute("fill", "#111827");
    svg.append(path, hole); button.append(svg);
    button.onclick = event => { event.stopPropagation(); onSelect(point.id); };
    anchor.append(button);
    if (selected) {
      const label = document.createElement("span");
      label.textContent = point.title;
      label.style.cssText = "position:absolute;bottom:52px;left:0;transform:translateX(-50%);max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border:1px solid #ff884477;border-radius:8px;background:#090d16e8;padding:6px 10px;color:white;font-size:12px";
      anchor.append(label);
    }
    return anchor;
  }, [activeId, onSelect]);
  return <div ref={container} className="w-full" aria-label="촬영 위치를 표시한 3D 지구본">
    <div className="relative" data-view={showDetails ? "details" : "earth"}>
    <Globe ref={ref} width={width} height={Math.min(620, Math.max(380, width * 0.58))}
      backgroundColor="rgba(0,0,0,0)" globeImageUrl="/images/globe/earth-blue-marble.jpg"
      globeTileEngineUrl={showDetails ? streetTiles : null}
      globeCurvatureResolution={2} atmosphereColor="#769eda" atmosphereAltitude={0.12} animateIn={false} waitForGlobeReady={false}
      onGlobeReady={() => setReady(true)} htmlElementsData={points} htmlLat="latitude" htmlLng="longitude"
      htmlAltitude={0} htmlElement={createPin} htmlTransitionDuration={0} />
      {transition?.id === activeId && <div aria-hidden="true" className="pointer-events-none absolute inset-0 transition-opacity duration-1000 motion-reduce:transition-none" style={{ backgroundImage: `url(${transition.image})`, backgroundSize: "100% 100%", opacity: transition.fading ? 0 : 1 }} onTransitionEnd={() => setTransition(null)} />}
      {showDetails && <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" aria-label="OpenStreetMap 지도 출처" className="absolute bottom-2 right-3 rounded bg-black/35 px-2 py-1 text-[10px] text-white/65 backdrop-blur-sm">© OpenStreetMap contributors</a>}
    </div>
  </div>;
}
