"use client";

import React from "react";
import Image from "next/image";
import { PhotoItem } from "@/types";
import { ArrowUp, ArrowDown, Trash2, Star, Edit3 } from "lucide-react";

interface PhotoSortableListProps {
  photos: PhotoItem[];
  coverImageId?: string;
  onSetCover: (photoId: string, url: string) => void;
  onUpdatePhoto: (index: number, updated: PhotoItem) => void;
  onMovePhoto: (index: number, direction: "up" | "down") => void;
  onDeletePhoto: (index: number) => void;
}

export const PhotoSortableList: React.FC<PhotoSortableListProps> = ({
  photos,
  coverImageId,
  onSetCover,
  onUpdatePhoto,
  onMovePhoto,
  onDeletePhoto,
}) => {
  if (photos.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-zinc-500 font-mono border border-zinc-800/60 rounded-xl bg-zinc-950">
        등록된 사진이 없습니다. 위에서 사진을 업로드해 주세요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {photos.map((photo, index) => {
        const isCover = coverImageId === photo.id || (index === 0 && !coverImageId);
        return (
          <div
            key={photo.id || index}
            className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${
              isCover
                ? "bg-zinc-900/90 border-amber-500/40 shadow-md"
                : "bg-zinc-900/40 border-zinc-800"
            }`}
          >
            {/* Thumbnail */}
            <div className="relative w-28 h-20 rounded-lg overflow-hidden bg-black shrink-0 border border-zinc-800">
              <Image
                src={photo.urls.thumb || photo.urls.medium}
                alt={photo.caption || ""}
                fill
                sizes="120px"
                className="object-cover"
              />
              {isCover && (
                <span className="absolute top-1 left-1 bg-amber-500 text-black text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shadow">
                  표지 사진
                </span>
              )}
            </div>

            {/* Editable Fields */}
            <div className="flex-1 space-y-2 w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400 font-semibold">
                  #{index + 1}
                </span>
                <input
                  type="text"
                  placeholder="사진 캡션/설명을 입력하세요 (선택)"
                  value={photo.caption || ""}
                  onChange={(e) =>
                    onUpdatePhoto(index, { ...photo, caption: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-sans"
                />
              </div>

              {/* Advanced EXIF Inline Editor Toggle/Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <input
                  type="text"
                  placeholder="카메라 (e.g. Leica M11)"
                  value={photo.exif?.camera || ""}
                  onChange={(e) =>
                    onUpdatePhoto(index, {
                      ...photo,
                      exif: { ...photo.exif, camera: e.target.value },
                    })
                  }
                  className="bg-zinc-950 border border-zinc-800/80 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-zinc-600"
                />
                <input
                  type="text"
                  placeholder="렌즈 (e.g. 35mm f/1.4)"
                  value={photo.exif?.lens || ""}
                  onChange={(e) =>
                    onUpdatePhoto(index, {
                      ...photo,
                      exif: { ...photo.exif, lens: e.target.value },
                    })
                  }
                  className="bg-zinc-950 border border-zinc-800/80 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-zinc-600"
                />
                <input
                  type="text"
                  placeholder="조리개 (e.g. f/2.8)"
                  value={photo.exif?.aperture || ""}
                  onChange={(e) =>
                    onUpdatePhoto(index, {
                      ...photo,
                      exif: { ...photo.exif, aperture: e.target.value },
                    })
                  }
                  className="bg-zinc-950 border border-zinc-800/80 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-zinc-600"
                />
                <input
                  type="text"
                  placeholder="셔터속도 (e.g. 1/1000s)"
                  value={photo.exif?.shutter || ""}
                  onChange={(e) =>
                    onUpdatePhoto(index, {
                      ...photo,
                      exif: { ...photo.exif, shutter: e.target.value },
                    })
                  }
                  className="bg-zinc-950 border border-zinc-800/80 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={() => onSetCover(photo.id, photo.urls.medium)}
                title="대표 표지 사진으로 설정"
                className={`p-2 rounded border transition text-xs ${
                  isCover
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                }`}
              >
                <Star className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onMovePhoto(index, "up")}
                disabled={index === 0}
                title="위로 이동"
                className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onMovePhoto(index, "down")}
                disabled={index === photos.length - 1}
                title="아래로 이동"
                className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowDown className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onDeletePhoto(index)}
                title="삭제"
                className="p-2 rounded bg-zinc-950 border border-zinc-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
