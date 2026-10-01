"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { PhotoSession, PhotoItem } from "@/types";
import {
  Calendar,
  MapPin,
  CloudSun,
  Camera,
  ChevronLeft,
  ChevronRight,
  Info,
  ExternalLink,
  Maximize2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PhotobookViewerProps {
  session: PhotoSession;
  prevSession?: PhotoSession | null;
  nextSession?: PhotoSession | null;
}

export const PhotobookViewer: React.FC<PhotobookViewerProps> = ({
  session,
  prevSession,
  nextSession,
}) => {
  const photos = session.photos || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<PhotoItem | null>(null);

  // References to scroll sections
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // IntersectionObserver for scroll transition
  useEffect(() => {
    if (photos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-photo-index"));
            if (!isNaN(index)) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% in view
        rootMargin: "-10% 0px -40% 0px",
      }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [photos]);

  const activePhoto = photos[activeIndex] || photos[0];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col">
      {/* Header Info Bar */}
      <div className="sticky top-16 z-30 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-zinc-800/60 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>목록으로</span>
            </Link>
            <span className="text-zinc-700">|</span>
            <h1 className="font-serif-book text-xl font-normal tracking-wide text-zinc-100 truncate max-w-md">
              {session.title}
            </h1>
          </div>

          {/* Quick Meta Indicators */}
          <div className="flex items-center gap-6 text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              {session.date}
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              {session.location}
            </span>
            {session.camera && (
              <span className="hidden lg:flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-zinc-500" />
                <span className="truncate max-w-[180px]">{session.camera}</span>
              </span>
            )}
            <button
              onClick={() => setShowMetaModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition"
            >
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              <span>출사 상세</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual Viewport */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Sticky Main Large Photo Area (Left/Top) */}
        <div className="lg:col-span-8 lg:sticky lg:top-36 h-[55vh] md:h-[70vh] lg:h-[calc(100vh-11rem)] rounded-2xl overflow-hidden bg-black border border-zinc-800/80 flex items-center justify-center relative shadow-2xl">
          {activePhoto ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activePhoto.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                className="relative w-full h-full flex items-center justify-center p-2"
              >
                <Image
                  src={activePhoto.urls.large || activePhoto.urls.medium}
                  alt={activePhoto.caption || session.title}
                  fill
                  priority
                  sizes="(max-width: 1200px) 100vw, 65vw"
                  className="object-contain p-2"
                />

                {/* Overlay Index & Fullscreen Toggle */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-zinc-300 pointer-events-none">
                  <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 font-mono">
                    {String(activeIndex + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => setFullscreenPhoto(activePhoto)}
                    className="pointer-events-auto p-2 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white transition"
                    title="전체 화면"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-zinc-500 text-sm font-mono">사진이 없습니다.</div>
          )}
        </div>

        {/* Scrollable Photo & Caption Stream (Right/Bottom) */}
        <div className="lg:col-span-4 space-y-16 pb-24">
          {/* Introductory Description Card */}
          <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-4">
            <h3 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">NOTES</h3>
            <p className="text-sm text-zinc-300 font-light leading-relaxed whitespace-pre-line">
              {session.description}
            </p>
            {session.gdriveFolderRef && (
              <a
                href={session.gdriveFolderRef}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition pt-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Google Drive 원본 보관소 참조</span>
              </a>
            )}
          </div>

          {/* Photo Sections */}
          {photos.map((photo, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={photo.id}
                ref={(el) => { sectionRefs.current[index] = el; }}
                data-photo-index={index}
                className={`transition-all duration-500 p-6 rounded-xl border ${
                  isActive
                    ? "bg-zinc-900/80 border-zinc-700/80 shadow-lg scale-[1.01]"
                    : "bg-zinc-950/40 border-zinc-800/40 opacity-60 hover:opacity-100"
                }`}
              >
                {/* Mobile Preview Thumbnail */}
                <div
                  className="lg:hidden relative aspect-[3/2] w-full rounded-lg overflow-hidden bg-black mb-4 cursor-pointer"
                  onClick={() => setActiveIndex(index)}
                >
                  <Image
                    src={photo.urls.medium}
                    alt={photo.caption || ""}
                    fill
                    sizes="(max-width: 1024px) 100vw, 30vw"
                    className="object-cover"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-3">
                  <span className="text-zinc-400 font-semibold">
                    PHOTO #{String(index + 1).padStart(2, "0")}
                  </span>
                  {photo.location && (
                    <span className="flex items-center gap-1 text-zinc-400 truncate">
                      <MapPin className="w-3 h-3 text-zinc-500" />
                      {photo.location}
                    </span>
                  )}
                </div>

                {/* Caption */}
                {photo.caption && (
                  <p className="font-serif-book text-lg text-zinc-200 leading-snug mb-4">
                    &ldquo;{photo.caption}&rdquo;
                  </p>
                )}

                {/* EXIF Info Tag Grid */}
                {photo.exif && (
                  <div className="pt-3 border-t border-zinc-800/60 grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400">
                    {photo.exif.camera && (
                      <div className="col-span-2 text-zinc-300">
                        📷 {photo.exif.camera} {photo.exif.lens ? `+ ${photo.exif.lens}` : ""}
                      </div>
                    )}
                    {photo.exif.aperture && <div>⚡ {photo.exif.aperture}</div>}
                    {photo.exif.shutter && <div>⏱ {photo.exif.shutter}</div>}
                    {photo.exif.iso && <div>🎞 {photo.exif.iso}</div>}
                    {photo.exif.focalLength && <div>🔍 {photo.exif.focalLength}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation (Prev / Next Session) */}
      <nav className="border-t border-zinc-800/80 bg-zinc-950 py-10 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          {prevSession ? (
            <Link
              href={`/sessions/${prevSession.slug || prevSession.id}`}
              className="group flex items-center gap-3 text-left hover:text-white transition"
            >
              <div className="p-3 rounded-full bg-zinc-900 group-hover:bg-zinc-800 border border-zinc-800 text-zinc-400 group-hover:text-zinc-100">
                <ChevronLeft className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  이전 출사
                </div>
                <div className="font-serif-book text-base text-zinc-300 group-hover:text-white">
                  {prevSession.title}
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextSession ? (
            <Link
              href={`/sessions/${nextSession.slug || nextSession.id}`}
              className="group flex items-center gap-3 text-right hover:text-white transition sm:flex-row-reverse"
            >
              <div className="p-3 rounded-full bg-zinc-900 group-hover:bg-zinc-800 border border-zinc-800 text-zinc-400 group-hover:text-zinc-100">
                <ChevronRight className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  다음 출사
                </div>
                <div className="font-serif-book text-base text-zinc-300 group-hover:text-white">
                  {nextSession.title}
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </nav>

      {/* Session Metadata Modal */}
      {showMetaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full space-y-6 shadow-2xl relative"
          >
            <button
              onClick={() => setShowMetaModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif-book text-2xl text-zinc-100 border-b border-zinc-800 pb-3">
              {session.title}
            </h3>

            <div className="space-y-4 text-sm font-mono text-zinc-300">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                <div>
                  <span className="text-zinc-500 text-xs block">촬영 일자</span>
                  {session.date}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                <div>
                  <span className="text-zinc-500 text-xs block">장소</span>
                  {session.location}
                </div>
              </div>

              {session.weather && (
                <div className="flex items-center gap-3">
                  <CloudSun className="w-4 h-4 text-zinc-500 shrink-0" />
                  <div>
                    <span className="text-zinc-500 text-xs block">기상 조건</span>
                    {session.weather}
                  </div>
                </div>
              )}

              {session.camera && (
                <div className="flex items-center gap-3">
                  <Camera className="w-4 h-4 text-zinc-500 shrink-0" />
                  <div>
                    <span className="text-zinc-500 text-xs block">주요 메인 장비</span>
                    {session.camera}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-400 font-sans leading-relaxed">
                {session.description}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowMetaModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-mono transition"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {fullscreenPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setFullscreenPhoto(null)}
        >
          <button
            onClick={() => setFullscreenPhoto(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-zinc-800/80 text-zinc-200 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full h-[85vh]">
            <Image
              src={fullscreenPhoto.urls.large || fullscreenPhoto.urls.medium}
              alt={fullscreenPhoto.caption || ""}
              fill
              className="object-contain"
            />
          </div>
          {fullscreenPhoto.caption && (
            <p className="mt-4 font-serif-book text-lg text-zinc-300 text-center">
              {fullscreenPhoto.caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
