"use client";

import React, { useState } from "react";
import { processImageForWeb } from "@/lib/image-processor";
import { uploadPhotoImages } from "@/lib/db";
import { PhotoItem, CompressionProgress } from "@/types";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface PhotoUploaderProps {
  sessionId: string;
  onPhotosUploaded: (newPhotos: PhotoItem[]) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ sessionId, onPhotosUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [progresses, setProgresses] = useState<Record<string, CompressionProgress>>({});

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const newUploadedPhotos: PhotoItem[] = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      setProgresses((prev) => ({
        ...prev,
        [file.name]: { fileName: file.name, stage: "resizing", progress: 10 },
      }));

      try {
        // 1. Compress in browser (~500px, ~1600px, ~3000px WebP)
        const compressed = await processImageForWeb(file, (stage, percent) => {
          setProgresses((prev) => ({
            ...prev,
            [file.name]: { fileName: file.name, stage: "resizing", progress: percent },
          }));
        });

        // 2. Upload to Storage
        setProgresses((prev) => ({
          ...prev,
          [file.name]: { fileName: file.name, stage: "uploading", progress: 90 },
        }));

        const { urls, storagePaths } = await uploadPhotoImages(sessionId, photoId, compressed);

        const newPhotoItem: PhotoItem = {
          id: photoId,
          order: Date.now() + index,
          caption: "",
          urls,
          storagePaths,
          aspectRatio: compressed.aspectRatio,
          width: compressed.width,
          height: compressed.height,
        };

        newUploadedPhotos.push(newPhotoItem);

        setProgresses((prev) => ({
          ...prev,
          [file.name]: { fileName: file.name, stage: "completed", progress: 100 },
        }));
      } catch (err: any) {
        console.error("Failed to upload image:", err);
        setProgresses((prev) => ({
          ...prev,
          [file.name]: {
            fileName: file.name,
            stage: "error",
            progress: 0,
            error: err.message || "업로드 실패",
          },
        }));
      }
    }

    if (newUploadedPhotos.length > 0) {
      onPhotosUploaded(newUploadedPhotos);
    }
    setUploading(false);
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
          {Object.values(progresses).map((p) => (
            <div key={p.fileName} className="flex items-center justify-between gap-4 py-1.5 border-b border-zinc-800/40 last:border-0">
              <span className="truncate text-zinc-300 max-w-[240px]">{p.fileName}</span>
              <div className="flex items-center gap-2">
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
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {p.stage === "resizing" ? "최적화 변환" : "전송 중"} ({p.progress}%)
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
