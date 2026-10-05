"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { PhotoSession } from "@/types";
import { motion } from "framer-motion";

interface SessionCardProps {
  session: PhotoSession;
  index: number;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, index }) => {
  const coverUrl =
    session.coverImageUrl ||
    (session.photos && session.photos[0]?.urls.medium) ||
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1600";

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: (index % 12) * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative flex flex-col bg-[#f5f5f7] text-zinc-900 p-3 pb-8 rounded-[2px] shadow-md hover:scale-[1.04] hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(255,255,255,0.18)] transition-all duration-300 ease-out cursor-pointer"
    >
      <Link href={`/sessions/${session.slug || session.id}`} className="block w-full">
        {/* Match the frame background so scaled edges cannot expose a dark seam. */}
        <div className="relative aspect-[10/11] w-full overflow-hidden bg-[#f5f5f7]">
          <Image
            src={coverUrl}
            alt={session.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover scale-[1.005]"
          />
        </div>

        {/* Polaroid card title */}
        <div className="mt-3.5 flex items-center justify-center min-h-[3rem] text-center px-1">
          <h2 className="font-handwriting text-lg sm:text-xl text-zinc-900 tracking-normal leading-snug line-clamp-2 group-hover:text-black transition-colors">
            {session.title}
          </h2>
        </div>
      </Link>
    </motion.article>
  );
};
