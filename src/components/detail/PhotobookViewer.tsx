"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { PhotoSession } from "@/types";
import { formatAperture, formatPhotoFocalLength } from "@/lib/photo-metadata";
import styles from "./PhotobookViewer.module.css";

export function PhotobookViewer({ session }: { session: PhotoSession }) {
  const photos = useMemo(() => [...(session.photos || [])].sort((a, b) => a.order - b.order), [session.photos]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({});
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const rootRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const activePhoto = photos[activeIndex] || photos[0];
  const activeSource = activePhoto?.urls.large || activePhoto?.urls.medium || "";
  const nextPhoto = photos[activeIndex + 1];

  // Native page scrolling also supports touch, trackpads and restored scroll positions.
  useEffect(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    if (!root || !viewport || photos.length < 2) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = -root.getBoundingClientRect().top;
      const step = (root.offsetHeight - viewport.offsetHeight) / (photos.length - 1);
      setActiveIndex(Math.max(0, Math.min(photos.length - 1, Math.round(distance / Math.max(1, step)))));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    observer.observe(viewport);
    window.addEventListener("scroll", schedule, { passive: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
    };
  }, [photos.length]);

  const selectPhoto = (index: number) => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    if (!root || !viewport || photos.length < 2) return;
    const target = Math.max(0, Math.min(photos.length - 1, index));
    const step = (root.offsetHeight - viewport.offsetHeight) / (photos.length - 1);
    window.scrollTo({
      top: window.scrollY + root.getBoundingClientRect().top + target * step,
      behavior: reducedMotion ? "instant" : "smooth",
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a")) return;
    const index = event.key === "ArrowRight" ? activeIndex + 1
      : event.key === "ArrowLeft" ? activeIndex - 1
      : event.key === "Home" ? 0
      : event.key === "End" ? photos.length - 1 : null;
    if (index === null) return;
    event.preventDefault();
    selectPhoto(index);
  };

  const duration = reducedMotion ? 0 : 0.45;

  return (
    <section
      ref={rootRef}
      className={styles.book}
      style={{ "--steps": Math.max(0, photos.length - 1) } as CSSProperties}
      aria-label={`${session.title} 사진집`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div ref={viewportRef} className={styles.viewport}>
        {nextPhoto && (
          <div className={styles.preload} aria-hidden="true">
            <Image key={`next-${nextPhoto.id}`} src={nextPhoto.urls.large || nextPhoto.urls.medium}
              alt="" fill sizes="(max-width: 700px) 92vw, 76vw" loading="eager" />
            <Image key={`background-${nextPhoto.id}`} src={nextPhoto.urls.medium || nextPhoto.urls.large}
              alt="" fill sizes="100vw" loading="eager" />
          </div>
        )}
        <div className={styles.background} aria-hidden="true">
          <AnimatePresence initial={false}>
            {activePhoto && (
              <motion.div key={activePhoto.id} className={styles.backgroundPhoto}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration }}>
                <Image src={activePhoto.urls.medium || activePhoto.urls.large} alt="" fill sizes="100vw" className={styles.cover} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link href="/" className={styles.back} aria-label="출사 목록으로 돌아가기" title="목록으로">
          <ArrowLeft size={22} aria-hidden="true" />
        </Link>
        <h1 className="sr-only">{session.title}</h1>

        <div className={styles.stage} aria-busy={Boolean(activePhoto && !loadedImages[activeSource] && !failedImages[activeSource])}>
          <AnimatePresence initial={false}>
            {activePhoto ? (
              <motion.div key={activePhoto.id} className={styles.photo}
                initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration }}>
                {!loadedImages[activeSource] && (
                  <div className={styles.loading} role="status">
                    {failedImages[activeSource] ? <span>사진을 불러오지 못했습니다.</span> : <><Loader2 size={24} className={styles.spinner} aria-hidden="true" /><span>사진을 불러오는 중…</span></>}
                  </div>
                )}
                <figure className={styles.polaroid} style={{
                  "--photo-ratio": imageRatios[activePhoto.urls.large || activePhoto.urls.medium]
                    || (activePhoto.width && activePhoto.height
                      ? activePhoto.width / activePhoto.height : activePhoto.aspectRatio || 1.5),
                  visibility: loadedImages[activeSource] ? "visible" : "hidden",
                } as CSSProperties}>
                  <div className={styles.printImage}>
                    <Image
                      src={activePhoto.urls.large || activePhoto.urls.medium}
                      alt={activePhoto.caption || `${session.title} — ${activeIndex + 1}번째 사진`}
                      fill sizes="(max-width: 700px) 92vw, 76vw" loading="eager"
                      className={styles.mainImage}
                      onLoad={(event) => {
                        const image = event.currentTarget;
                        if (!image.naturalWidth || !image.naturalHeight) return;
                        const source = activePhoto.urls.large || activePhoto.urls.medium;
                        const ratio = image.naturalWidth / image.naturalHeight;
                        setImageRatios((current) => current[source] === ratio ? current : { ...current, [source]: ratio });
                        setLoadedImages(current => ({ ...current, [source]: true }));
                      }}
                      onError={() => setFailedImages(current => ({...current, [activeSource]: true}))}
                    />
                  </div>
                  <figcaption className={styles.metadata}>
                    <p className={styles.cameraLine}><span>Shot on </span><strong>{activePhoto.exif?.camera || session.camera || "-"}</strong></p>
                    <p className={styles.settingsLine}>{[
                      formatPhotoFocalLength(activePhoto.exif),
                      formatAperture(activePhoto.exif?.aperture),
                      activePhoto.exif?.shutter,
                      activePhoto.exif?.iso?.replace(/^ISO\s*/i, "ISO"),
                    ].filter(Boolean).join("  ") || "-"}</p>
                  </figcaption>
                </figure>
              </motion.div>
            ) : <p className={styles.empty}>아직 등록된 사진이 없습니다.</p>}
          </AnimatePresence>
        </div>

        {activePhoto && (
          <>
            <nav className={styles.filmstrip} aria-label="사진 선택">
              <div className={styles.track} style={{ "--active-index": activeIndex } as CSSProperties}>
                {photos.map((photo, index) => (
                  <button key={photo.id} type="button" className={styles.thumbnail}
                    aria-label={`${index + 1}번째 사진${photo.caption ? `: ${photo.caption}` : ""}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                    onClick={() => selectPhoto(index)}
                    onFocus={() => selectPhoto(index)}>
                    <Image src={photo.urls.thumb || photo.urls.medium} alt="" fill
                      sizes="(max-width: 700px) 80px, 140px" className={styles.cover} />
                  </button>
                ))}
              </div>
            </nav>
            <div className={styles.caption} aria-live="polite" aria-atomic="true">
              <span className={styles.counter}>{String(activeIndex + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
