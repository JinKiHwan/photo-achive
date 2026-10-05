"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Footer: React.FC = () => {
  const pathname = usePathname();
  if (pathname.startsWith("/sessions/")) return null;

  return (
    <footer className="mt-auto border-t border-zinc-800/40 bg-[#0c0c0e] py-12 text-center text-xs text-zinc-500">
      <div className="max-w-7xl mx-auto px-6 space-y-3">
        <nav className="flex justify-center gap-5"><Link href="/terms">이용약관</Link><Link href="/privacy">개인정보처리방침</Link><Link href="/login">회원 로그인</Link></nav>
        <p className="font-serif-book italic text-zinc-400 text-sm tracking-wide">
          &ldquo;Silence is the most intense form of expression.&rdquo;
        </p>
        <p className="tracking-widest uppercase text-[11px] text-zinc-600 font-mono">
          © {new Date().getFullYear()} PHOTO ARCHIVE. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
};
