"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Camera, Lock, LogOut, Plus, Settings } from "lucide-react";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { isAdmin, logout } = useAuth();

  if (pathname.startsWith("/sessions/")) return null;

  // If on main page, user explicitly requested "헤더는 필요없어"
  // Provide only a subtle floating admin button on top-right if needed
  if (pathname === "/") {
    return (
      <div className="absolute top-6 right-6 z-40">
        {isAdmin ? (
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900/80 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded-full transition shadow-lg"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>관리자</span>
            </Link>
            <button
              onClick={() => logout()}
              title="로그아웃"
              className="p-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/admin/login"
            className="p-2 rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-500 hover:text-zinc-200 transition backdrop-blur-md block"
            title="관리자 로그인"
          >
            <Lock className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-[#0f0f11]/80 backdrop-blur-md border-b border-zinc-800/50 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand logo / Title */}
        <Link href="/" className="group flex items-center gap-3 text-zinc-100 hover:text-white transition">
          <Camera className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          <span className="font-serif-book text-xl tracking-widest font-light text-zinc-100 uppercase">
            ARCHIVE
          </span>
          <span className="text-[10px] tracking-widest text-zinc-500 font-mono uppercase bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
            PHOTOBOOK
          </span>
        </Link>

        {/* Navigation & Admin controls */}
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="text-zinc-400 hover:text-zinc-100 transition-colors tracking-wide text-xs uppercase"
          >
            출사 목록
          </Link>

          {isAdmin ? (
            <div className="flex items-center gap-4 border-l border-zinc-800 pl-6">
              <Link
                href="/admin"
                className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/50 px-3 py-1.5 rounded-md transition"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>관리자 대시보드</span>
              </Link>
              <Link
                href="/admin/sessions/new"
                className="flex items-center gap-1.5 text-xs text-zinc-900 font-medium bg-zinc-100 hover:bg-white px-3 py-1.5 rounded-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 출사</span>
              </Link>
              <button
                onClick={() => logout()}
                title="로그아웃"
                className="text-zinc-500 hover:text-zinc-300 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/admin/login"
              className="text-zinc-500 hover:text-zinc-300 transition text-xs flex items-center gap-1.5"
              title="관리자 로그인"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="sr-only">관리자 로그인</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
