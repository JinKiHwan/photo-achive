"use client";

import { ReactNode, useEffect, useRef } from "react";

export function SessionStrip({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; scroll: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const pixels = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1);
      const canScroll = pixels > 0 ? element.scrollLeft < element.scrollWidth - element.clientWidth - 1 : element.scrollLeft > 0;
      if (!canScroll) return;
      event.preventDefault();
      element.scrollLeft += pixels;
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, []);
  return <div ref={ref} aria-label="촬영 장소별 사진글" className="flex select-none gap-4 overflow-x-auto overscroll-x-contain pb-3 cursor-grab active:cursor-grabbing" style={{ touchAction: "pan-x pan-y" }}
    onDragStart={event => event.preventDefault()}
    onPointerDown={event => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      suppressClick.current = false;
      drag.current = { id: event.pointerId, x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false };
    }}
    onPointerMove={event => {
      const current = drag.current;
      if (!current || current.id !== event.pointerId) return;
      const distance = event.clientX - current.x;
      if (Math.abs(distance) > 6 && !current.moved) {
        current.moved = true;
        suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (current.moved) { event.preventDefault(); event.currentTarget.scrollLeft = current.scroll - distance; }
    }}
    onPointerUp={event => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      drag.current = null;
    }}
    onPointerCancel={() => { drag.current = null; suppressClick.current = false; }}
    onPointerLeave={() => { if (!drag.current?.moved) drag.current = null; }}
    onClickCapture={event => {
      if (suppressClick.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
    }}>
    {children}
  </div>;
}
