"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoSession, PhotoItem } from "@/types";
import { saveSession } from "@/lib/db";
import { PhotoUploader } from "./PhotoUploader";
import { PhotoSortableList } from "./PhotoSortableList";
import { Save, ArrowLeft, Globe, EyeOff, FolderOpen, Calendar, MapPin, Camera } from "lucide-react";

interface SessionFormProps {
  initialSession?: PhotoSession;
  isEdit?: boolean;
}

export const SessionForm: React.FC<SessionFormProps> = ({ initialSession, isEdit = false }) => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Generate unique ID for new session
  const defaultId = initialSession?.id || `session_${Date.now()}`;

  const [title, setTitle] = useState(initialSession?.title || "");
  const [slug, setSlug] = useState(initialSession?.slug || "");
  const [date, setDate] = useState(initialSession?.date || new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState(initialSession?.location || "");
  const [weather, setWeather] = useState(initialSession?.weather || "");
  const [camera, setCamera] = useState(initialSession?.camera || "");
  const [description, setDescription] = useState(initialSession?.description || "");
  const [gdriveFolderRef, setGdriveFolderRef] = useState(initialSession?.gdriveFolderRef || "");
  const [isPublished, setIsPublished] = useState(initialSession?.isPublished ?? true);
  const [coverImageId, setCoverImageId] = useState(initialSession?.coverImageId || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialSession?.coverImageUrl || "");
  const [photos, setPhotos] = useState<PhotoItem[]>(initialSession?.photos || []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit && !slug) {
      // Auto generate slug from title
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-zA-Z0-9가-힣\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setSlug(generatedSlug || defaultId);
    }
  };

  const handlePhotosUploaded = (newUploaded: PhotoItem[]) => {
    setPhotos((prev) => {
      const updated = [...prev, ...newUploaded];
      if (!coverImageUrl && updated.length > 0) {
        setCoverImageId(updated[0].id);
        setCoverImageUrl(updated[0].urls.medium);
      }
      return updated;
    });
  };

  const handleSetCover = (photoId: string, url: string) => {
    setCoverImageId(photoId);
    setCoverImageUrl(url);
  };

  const handleUpdatePhoto = (index: number, updated: PhotoItem) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const handleMovePhoto = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;
    setPhotos((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !location.trim()) {
      alert("출사 제목, 날짜, 장소는 필수 입력 항목입니다.");
      return;
    }

    setSaving(true);

    try {
      const sessionData: PhotoSession = {
        id: defaultId,
        slug: slug.trim() || defaultId,
        title: title.trim(),
        date,
        location: location.trim(),
        weather: weather.trim(),
        camera: camera.trim(),
        description: description.trim(),
        gdriveFolderRef: gdriveFolderRef.trim(),
        isPublished,
        coverImageId: coverImageId || (photos[0]?.id || ""),
        coverImageUrl: coverImageUrl || (photos[0]?.urls.medium || ""),
        photos,
        createdAt: initialSession?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveSession(sessionData);
      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("Save session failed:", err);
      alert("출사 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-20">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 font-mono transition"
        >
          <ArrowLeft className="w-4 h-4" /> 뒤로가기
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPublished(!isPublished)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition ${
              isPublished
                ? "bg-emerald-950/40 border-emerald-700/50 text-emerald-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-400"
            }`}
          >
            {isPublished ? (
              <>
                <Globe className="w-3.5 h-3.5" /> 공개 중
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" /> 임시 저장 (비공개)
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-medium transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "저장 중..." : "출사 저장하기"}</span>
          </button>
        </div>
      </div>

      {/* Main Info Fields */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-6">
        <h3 className="font-serif-book text-xl text-zinc-200 border-b border-zinc-800 pb-3">
          1. 기본 출사 정보
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label className="text-xs font-mono text-zinc-400">출사 제목 *</label>
            <input
              type="text"
              required
              placeholder="e.g. 서촌, 늦가을 빛의 잔상"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label className="text-xs font-mono text-zinc-400">URL 식별자 (Slug)</label>
            <input
              type="text"
              placeholder="seochon-autumn-2025"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" /> 촬영 날짜 *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" /> 출사 장소 *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 서울 종로구 서촌 & 옥인동"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">날씨 및 분위기</label>
            <input
              type="text"
              placeholder="e.g. 맑음, 14°C, 옅은 가을 햇살"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-zinc-500" /> 사용 카메라 & 렌즈
            </label>
            <input
              type="text"
              placeholder="e.g. Leica M11 + Summilux 35mm"
              value={camera}
              onChange={(e) => setCamera(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="space-y-1.5 col-span-2">
            <label className="text-xs font-mono text-zinc-400 flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5 text-zinc-500" /> Google Drive 원본 보관소 링크 (선택)
            </label>
            <input
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={gdriveFolderRef}
              onChange={(e) => setGdriveFolderRef(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
            <p className="text-[11px] text-zinc-500">
              원본 2,400만 화소 파일 장기 보존용 Drive 폴더 링크입니다. 방문자에게는 저장소 참조로 제공됩니다.
            </p>
          </div>

          <div className="space-y-1.5 col-span-2">
            <label className="text-xs font-mono text-zinc-400">출사 소개 글 / 노트</label>
            <textarea
              rows={4}
              placeholder="출사 당시의 정경, 느낌, 빛의 각도 등을 자유롭게 서술하세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 font-sans leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Photo Upload Section */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-6">
        <h3 className="font-serif-book text-xl text-zinc-200 border-b border-zinc-800 pb-3">
          2. 사진 일괄 업로드 및 웹 최적화
        </h3>
        <PhotoUploader sessionId={defaultId} onPhotosUploaded={handlePhotosUploaded} />
      </div>

      {/* Photo Ordering & Metadata Section */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="font-serif-book text-xl text-zinc-200">
            3. 사진 순서 변경 및 캡션/EXIF 편집 ({photos.length}장)
          </h3>
          <span className="text-xs font-mono text-zinc-400">
            ★ 버튼을 눌러 표지 대표 사진을 고르세요
          </span>
        </div>

        <PhotoSortableList
          photos={photos}
          coverImageId={coverImageId}
          onSetCover={handleSetCover}
          onUpdatePhoto={handleUpdatePhoto}
          onMovePhoto={handleMovePhoto}
          onDeletePhoto={handleDeletePhoto}
        />
      </div>
    </form>
  );
};
