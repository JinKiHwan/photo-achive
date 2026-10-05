"use client";

import React, { useRef, useState } from "react";
import exifr from "exifr";
import { isValidGps } from "@/lib/geo";
import { photoExifFromTags } from "@/lib/photo-metadata";
import { processImageForWeb } from "@/lib/image-processor";
import { uploadPhotoImages } from "@/lib/db";
import { mapConcurrent } from "@/lib/parallel";
import { PhotoItem, CompressionProgress } from "@/types";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface PhotoUploaderProps {
  sessionId: string;
  ownerId?: string;
  remaining?: number;
  onBusyChange?: (busy: boolean) => void;
  onPhotosUploaded: (newPhotos: PhotoItem[]) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ sessionId, ownerId, remaining = 500, onBusyChange, onPhotosUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const uploadLock = useRef(false);
  const [progresses, setProgresses] = useState<Record<string, CompressionProgress>>({});

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || uploadLock.current) return;
    e.target.value = "";
    if (files.length > remaining) { alert(`사진은 ${remaining}장 더 추가할 수 있습니다.`); return; }

    uploadLock.current = true;
    setUploading(true);
    onBusyChange?.(true);
    const batchId = Date.now();
    const jobs = files.map((file, index) => ({ file, photoId: `photo_${batchId}_${index}_${Math.random().toString(36).substring(2, 7)}` }));
    const device = navigator as Navigator & { deviceMemory?: number };
    const concurrency = device.deviceMemory && device.deviceMemory <= 4 ? 2 : 3;
    setProgresses(Object.fromEntries(jobs.map(({file, photoId}) => [photoId, {fileName: file.name, stage: "queued", progress: 0}])));
    try {
    const results = await mapConcurrent(jobs, concurrency, async ({file, photoId}, index) => {

      setProgresses((prev) => ({
        ...prev,
        [photoId]: { fileName: file.name, stage: "resizing", progress: 10 },
      }));

      try {
        const metadata = await exifr.gps(file).catch(() => null);
        const gps = metadata ? { ...metadata, source: "exif" as const } : null;
        const tags = await exifr.parse(file, { pick: ["Make", "Model", "LensModel", "ISO", "FNumber", "ExposureTime", "FocalLength", "FocalLengthIn35mmFormat", "DateTimeOriginal"] }).catch(() => null);
        const exif = photoExifFromTags(tags);
        // 1. Compress in browser (~500px, ~1600px, ~3000px WebP)
        const compressed = await processImageForWeb(file, (stage, percent) => {
          setProgresses((prev) => ({
            ...prev,
            [photoId]: { fileName: file.name, stage: "resizing", progress: percent },
          }));
        });

        // Firebase receives only the three downscaled WebP files.
        setProgresses((prev) => ({
          ...prev,
          [photoId]: { fileName: file.name, stage: "uploading", progress: 90 },
        }));

        const { urls, storagePaths } = await uploadPhotoImages(sessionId, photoId, compressed, ownerId);

        const newPhotoItem: PhotoItem = {
          id: photoId,
          order: batchId + index,
          caption: "",
          gps: isValidGps(gps) ? gps : null,
          exif,
          urls,
          storagePaths,
          aspectRatio: compressed.aspectRatio,
          width: compressed.width,
          height: compressed.height,
        };

        setProgresses((prev) => ({
          ...prev,
          [photoId]: { fileName: file.name, stage: "completed", progress: 100 },
        }));
        return newPhotoItem;
      } catch (err: unknown) {
        console.error("Failed to upload image:", err);
        setProgresses((prev) => ({
          ...prev,
          [photoId]: {
            fileName: file.name,
            stage: "error",
            progress: 0,
            error: err instanceof Error ? err.message : "업로드 실패",
          },
        }));
        throw err;
      }
    });
    const newUploadedPhotos = results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);

    if (newUploadedPhotos.length > 0) {
      onPhotosUploaded(newUploadedPhotos);
    }
    } finally {
      uploadLock.current = false;
      setUploading(false);
      onBusyChange?.(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="relative border-2 border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/40 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center group">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <UploadCloud className="w-10 h-10 text-zinc-500 group-hover:text-zinc-300 transition-colors mb-3" />
        <span className="text-sm font-mono text-zinc-300">
          사진 여러 장을 한 번에 드래그하거나 선택하세요
        </span>
        <span className="text-xs text-zinc-500 mt-1 font-sans">
          브라우저에서 썸네일(~500px), 모바일(~1600px), 큰화면(~3000px) WebP 자동 최적화 생성 후 업로드됩니다.
        </span>
      </label>

      {/* Progress list */}
      {Object.keys(progresses).length > 0 && (
        <div className="space-y-2 bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl text-xs font-mono">
          <div className="text-zinc-400 font-semibold mb-2">처리 및 업로드 현황</div>
          {Object.entries(progresses).map(([id, p]) => (
            <div key={id} className="flex items-center justify-between gap-4 py-1.5 border-b border-zinc-800/40 last:border-0">
              <span className="truncate text-zinc-300 max-w-[240px]">{p.fileName}</span>
              <div className="flex items-center gap-2">
                {p.stage === "queued" && <span className="text-zinc-500">대기 중</span>}
                {p.stage === "completed" && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 완료
                  </span>
                )}
                {p.stage === "error" && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {p.error}
                  </span>
                )}
                {(p.stage === "resizing" || p.stage === "uploading") && (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {p.stage === "resizing" ? "최적화 변환" : "Firebase 축소본 전송 중"} ({p.progress}%)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
