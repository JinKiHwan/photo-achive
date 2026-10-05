"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { fetchSessions } from "@/lib/db";
import { isFirebaseConfigured } from "@/lib/firebase";
import { PhotoSession } from "@/types";
import { SessionCard } from "./SessionCard";
import { Loader2, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HomeClientProps {
  initialSessions: PhotoSession[];
}

const BATCH_SIZE = 12;
const GlobeView = dynamic(() => import("./GlobeView"), { loading: () => <p className="text-zinc-400">지구본 준비 중…</p> });

export const HomeClient: React.FC<HomeClientProps> = ({ initialSessions }) => {
  const [tab, setTab] = useState<"gallery" | "globe">("gallery");
  const [sessions, setSessions] = useState(initialSessions);
  useEffect(() => {
    if (!isFirebaseConfigured) void fetchSessions(true).then(setSessions);
  }, []);
  const [displayedCount, setDisplayedCount] = useState(BATCH_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  const hasMore = displayedCount < sessions.length;

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + BATCH_SIZE, sessions.length));
      setLoadingMore(false);
    }, 400);
  }, [loadingMore, hasMore, sessions.length]);

  // Infinite Scroll Observer
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loadMore, tab]);

  // Scroll Listener for Top Scroll Button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const sortedSessions = useMemo(() => [...sessions].sort((a, b) =>
    (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)
  ), [sessions]);
  const visibleSessions = sortedSessions.slice(0, displayedCount);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 space-y-12 min-h-screen flex flex-col items-center relative">
      {/* Wireframe Centered Single Line Title */}
      <div className="text-center pt-2 pb-4">
        <h1 className="font-serif-book text-4xl sm:text-5xl md:text-6xl font-light tracking-wide text-zinc-100 uppercase">
          Title
        </h1>
      </div>

      <div role="tablist" aria-label="사진 보기 방식" className="flex rounded-full border border-zinc-700 bg-zinc-950/70 p-1">
        {(["gallery", "globe"] as const).map(view => <button key={view} id={`${view}-tab`} type="button" role="tab" tabIndex={tab === view ? 0 : -1} aria-selected={tab === view} aria-controls={`${view}-panel`} onClick={() => setTab(view)} onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? "gallery" : event.key === "End" ? "globe" : view === "gallery" ? "globe" : "gallery";
          setTab(next);
          document.getElementById(`${next}-tab`)?.focus();
        }} className={`rounded-full px-6 py-2 text-sm transition ${tab === view ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-white"}`}>{view === "gallery" ? "사진 모아보기" : "지구본으로 보기"}</button>)}
      </div>
      {tab === "globe" ? <GlobeView sessions={sortedSessions} /> : <>
      <div id="gallery-panel" role="tabpanel" aria-labelledby="gallery-tab" className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {visibleSessions.map((session, index) => (
          <SessionCard key={session.id} session={session} index={index} />
        ))}
      </div>

      {/* Infinite Scroll Sentinel / Loading Indicator */}
      <div
        ref={observerTargetRef}
        className="w-full py-8 flex items-center justify-center text-xs font-mono text-zinc-500"
      >
        {loadingMore && (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>과거 출사 데이터 불러오는 중...</span>
          </div>
        )}
        {!hasMore && sessions.length > 0 && (
          <div className="text-zinc-600 tracking-widest text-[11px] uppercase border-t border-zinc-800/40 pt-6">
            — ALL PHOTO SESSIONS LOADED —
          </div>
        )}
      </div>
      </>}

      {/* Floating Scroll to Top Button (Bottom-Right) */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.25 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-zinc-800/90 hover:bg-zinc-700 backdrop-blur-md border border-zinc-700/60 text-zinc-200 hover:text-white shadow-xl transition-colors cursor-pointer group"
            title="맨 위로 이동"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
