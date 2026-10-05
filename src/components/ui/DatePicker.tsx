"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { localDateValue } from "@/lib/dates";

export function DatePicker({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const popupId = useId();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(`${value}T12:00:00`));
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    selected.current?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  const close = () => { setOpen(false); trigger.current?.focus(); };
  const choose = (date: string) => { onChange(date); close(); };
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset = new Date(year, monthIndex, 1).getDay();
  const count = new Date(year, monthIndex + 1, 0).getDate();
  const today = localDateValue();
  const control = "rounded-lg p-2 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-zinc-300";

  return <div ref={root} className="relative" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    <button ref={trigger} id={id} type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? popupId : undefined}
      onClick={() => { if (open) close(); else { setMonth(new Date(`${value}T12:00:00`)); setOpen(true); } }}
      className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 focus-visible:outline-2 focus-visible:outline-zinc-400">
      <span className="font-mono">{value}</span><Calendar className="h-4 w-4 text-zinc-400" />
    </button>
    {open && <div id={popupId} role="dialog" aria-label="촬영 날짜 선택" className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-zinc-100 shadow-2xl">
      <div className="mb-2 flex items-center justify-between text-xs text-zinc-400"><span>촬영 날짜 선택</span><button type="button" aria-label="달력 닫기" className={control} onClick={close}><X size={14} /></button></div>
      <div className="mb-3 flex items-center justify-between gap-1">
        <button type="button" aria-label="이전 달" className={control} onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}><ChevronLeft size={16} /></button>
        <select aria-label="연도" value={year} onChange={event => setMonth(new Date(Number(event.target.value), monthIndex, 1))} className="min-w-0 rounded bg-zinc-900 p-1.5 text-sm">
          {Array.from({ length: Math.max(new Date().getFullYear() + 10, year) - Math.min(1900, year) + 1 }, (_, index) => Math.min(1900, year) + index).map(item => <option key={item} value={item}>{item}년</option>)}
        </select>
        <select aria-label="월" value={monthIndex} onChange={event => setMonth(new Date(year, Number(event.target.value), 1))} className="rounded bg-zinc-900 p-1.5 text-sm">
          {Array.from({ length: 12 }, (_, index) => <option key={index} value={index}>{index + 1}월</option>)}
        </select>
        <button type="button" aria-label="다음 달" className={control} onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs">
        {["일", "월", "화", "수", "목", "금", "토"].map(day => <span key={day} className="py-2 text-zinc-500">{day}</span>)}
        {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}
        {Array.from({ length: count }, (_, index) => {
          const day = index + 1;
          const date = localDateValue(new Date(year, monthIndex, day));
          return <button key={date} ref={date === value ? selected : undefined} type="button" aria-label={`${year}년 ${monthIndex + 1}월 ${day}일`} aria-pressed={date === value} aria-current={date === today ? "date" : undefined}
            onClick={() => choose(date)} className={`h-9 rounded-lg focus-visible:outline-2 focus-visible:outline-orange-300 ${date === value ? "bg-zinc-100 font-semibold text-zinc-950" : "hover:bg-zinc-800"} ${date === today && date !== value ? "text-orange-300 ring-1 ring-inset ring-zinc-700" : ""}`}>{day}</button>;
        })}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-2 text-xs"><span className="text-zinc-500">날짜를 누르면 적용됩니다</span><button type="button" className={control} onClick={() => choose(today)}>오늘</button></div>
    </div>}
  </div>;
}
