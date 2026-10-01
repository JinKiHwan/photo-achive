"use client";

import React from "react";
import { usePathname } from "next/navigation";

export const Footer: React.FC = () => {
  const pathname = usePathname();
  if (pathname.startsWith("/sessions/")) return null;

  return (
    <footer className="mt-auto border-t border-zinc-800/40 bg-[#0c0c0e] py-12 text-center text-xs text-zinc-500">
      <div className="max-w-7xl mx-auto px-6 space-y-3">
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
