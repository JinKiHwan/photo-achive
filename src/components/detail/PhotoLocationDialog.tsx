"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import type { GeoLocation } from "@/types";
import styles from "./PhotobookViewer.module.css";

const PhotoLocationMap = dynamic(() => import("./PhotoLocationMap"), {
  ssr: false, loading: () => <p role="status" className="p-6 text-sm text-zinc-300">지도 불러오는 중…</p>,
});

export function PhotoLocationDialog({ gps, label, onClose }: { gps: GeoLocation; label: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = overflow; previousFocus?.focus({ preventScroll: true }); };
  }, []);

  return <dialog ref={ref} className={styles.locationDialog} aria-label="촬영 위치 지도" onCancel={onClose}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={styles.locationPanel}>
      <header className={styles.locationHeader}><div><h2>촬영 위치</h2><p>{label}</p></div>
        <button type="button" autoFocus onClick={onClose} aria-label="지도 닫기"><X size={22} /></button>
      </header>
      <div className={styles.locationMap}><PhotoLocationMap gps={gps} /></div>
      <div className={styles.locationFooter}><span>{gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)}</span>
        <a href={`https://www.google.com/maps/search/?api=1&query=${gps.latitude},${gps.longitude}`} target="_blank" rel="noreferrer">Google 지도에서 보기 ↗</a>
      </div>
    </div>
  </dialog>;
}
