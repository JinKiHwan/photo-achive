"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoSession, PhotoItem, GeoLocation } from "@/types";
import { DatePicker } from "@/components/ui/DatePicker";
import { formatUploadDate, localDateValue } from "@/lib/dates";
import { useAuth } from "@/context/AuthContext";
import { MEMBER_PHOTO_LIMIT } from "@/lib/community-config";
import { LocationPicker } from "./LocationPicker";
import { saveSession } from "@/lib/db";
import { PhotoUploader } from "./PhotoUploader";
import { PhotoSortableList } from "./PhotoSortableList";
import { Save, ArrowLeft, Globe, EyeOff, Calendar, MapPin, Camera } from "lucide-react";

interface SessionFormProps {
  initialSession?: PhotoSession;
  isEdit?: boolean;
  memberMode?: boolean;
}
const placeNames = new Map<string, string>();

export const SessionForm: React.FC<SessionFormProps> = ({ initialSession, memberMode = false }) => {
  const router = useRouter();
  const { user } = useAuth();
  const ownerId = initialSession?.ownerId || (memberMode && user && "uid" in user ? user.uid : undefined);
  const [uploading, setUploading] = useState(false);
  const [shareLocation, setShareLocation] = useState(initialSession?.shareLocation ?? !memberMode);
  const [saving, setSaving] = useState(false);

  // Generate unique ID for new session
  const [defaultId] = useState(() => initialSession?.id || `session_${Date.now()}`);

  const [title, setTitle] = useState(initialSession?.title || "");
  const [date, setDate] = useState(initialSession?.date || localDateValue());
  const [location, setLocation] = useState(initialSession?.location || "");
  const [placeStatus, setPlaceStatus] = useState("");
  const [gps, setGps] = useState<GeoLocation | null>(initialSession?.gps ?? null);
  const [weather, setWeather] = useState(initialSession?.weather || "");
  const [autoWeather, setAutoWeather] = useState(!initialSession?.weather);
  const [weatherStatus, setWeatherStatus] = useState("");
  const [camera, setCamera] = useState(initialSession?.camera || "");
  const [description, setDescription] = useState(initialSession?.description || "");
  const [isPublished, setIsPublished] = useState(initialSession?.isPublished ?? !memberMode);
  const [coverImageId, setCoverImageId] = useState(initialSession?.coverImageId || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialSession?.coverImageUrl || "");
  const [photos, setPhotos] = useState<PhotoItem[]>(initialSession?.photos || []);
  const placeLatitude = gps?.latitude;
  const placeLongitude = gps?.longitude;

  useEffect(() => {
    if (placeLatitude === undefined || placeLongitude === undefined) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPlaceStatus("대표 위치의 주소를 확인하는 중…");
      try {
        const key = `${placeLatitude},${placeLongitude}`;
        const cached = placeNames.get(key);
        if (cached) { setLocation(cached); setPlaceStatus("대표 위치의 주소가 자동 입력되었습니다. 직접 수정할 수 있습니다."); return; }
        const params = new URLSearchParams({format: "jsonv2", lat: String(placeLatitude), lon: String(placeLongitude), "accept-language": "ko"});
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {signal: controller.signal});
        if (!response.ok) throw new Error("주소 조회 실패");
        const result = await response.json();
        if (controller.signal.aborted) return;
        if (!result.display_name) throw new Error("주소가 없는 위치입니다.");
        placeNames.set(key, result.display_name);
        setLocation(result.display_name);
        setPlaceStatus("대표 위치의 주소가 자동 입력되었습니다. 직접 수정할 수 있습니다.");
      } catch {
        if (!controller.signal.aborted) {
          setLocation(`${placeLatitude.toFixed(5)}, ${placeLongitude.toFixed(5)}`);
          setPlaceStatus("주소를 찾지 못해 좌표를 입력했습니다. 장소명을 직접 수정할 수 있습니다.");
        }
      }
    }, 1500);
    return () => {clearTimeout(timer); controller.abort();};
  }, [placeLatitude, placeLongitude]);

  const weatherGps = gps ?? photos.find(photo => photo.id === coverImageId)?.gps ?? photos.find(photo => photo.gps)?.gps;
  const latitude = weatherGps?.latitude;
  const longitude = weatherGps?.longitude;
  useEffect(() => {
    if (!autoWeather || latitude === undefined || longitude === undefined || !date) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setWeatherStatus("날씨 조회 중…");
      setWeather("");
      try {
        const params = new URLSearchParams({latitude: String(latitude), longitude: String(longitude), date});
        const response = await fetch(`/api/weather?${params}`, {signal: controller.signal});
        const result = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok) throw new Error(result.error);
        setWeather(result.summary);
        setWeatherStatus("해당 위치의 하루 대표 날씨 · 일평균 기온입니다. 촬영 순간의 날씨와 다를 수 있습니다.");
      } catch (error) {
        if (!controller.signal.aborted) setWeatherStatus(error instanceof Error ? error.message : "날씨 조회 실패");
      }
    }, 600);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [autoWeather, latitude, longitude, date]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
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
    if (!title.trim() || !date || (shareLocation && !location.trim())) {
      alert("출사 제목, 촬영 날짜, 장소는 필수 입력 항목입니다.");
      return;
    }

    if (uploading) return;
    if (memberMode && (!ownerId || photos.length > MEMBER_PHOTO_LIMIT)) {
      alert(`로그인을 확인해 주세요. 사진은 글당 ${MEMBER_PHOTO_LIMIT}장까지 저장할 수 있습니다.`); return;
    }
    setSaving(true);

    try {
      const sessionData: PhotoSession = {
        ...initialSession,
        ...(ownerId ? { ownerId, shareLocation } : {}),
        id: defaultId,
        slug: initialSession?.slug || defaultId,
        title: title.trim(),
        date,
        location: shareLocation ? location.trim() : "위치 비공개",
        gps,
        weather: weather.trim(),
        camera: camera.trim(),
        description: description.trim(),
        isPublished,
        coverImageId: coverImageId || (photos[0]?.id || ""),
        coverImageUrl: coverImageUrl || (photos[0]?.urls.medium || ""),
        photos,
        createdAt: initialSession?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveSession(sessionData);
      router.push(memberMode ? "/my" : "/admin");
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
      {/* Keep the save action visible below the site header while editing. */}
      <div className="sticky top-20 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-700/70 bg-zinc-950/90 p-3 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 font-mono transition"
        >
          <ArrowLeft className="w-4 h-4" /> 뒤로가기
        </button>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
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
            disabled={saving || uploading}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-medium transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "저장 중..." : uploading ? "사진 업로드 중..." : "출사 저장하기"}</span>
          </button>
        </div>
      </div>

      {(memberMode || ownerId) && <div className="rounded-xl border border-zinc-700 bg-zinc-950/80 p-4 space-y-2">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={shareLocation} onChange={event => setShareLocation(event.target.checked)} />촬영 위치 공유</label>
        <p className="text-xs text-zinc-400">선택하면 대표 위치와 사진 GPS가 공개 글에 표시됩니다. 선택하지 않으면 좌표와 장소명을 저장하지 않습니다. 캡션과 소개에 적은 장소는 직접 확인해 주세요.</p>
      </div>}
      <LocationPicker value={gps} onChange={setGps} onPlaceName={setLocation} label="출사 대표 위치" />
      <p className="text-xs text-zinc-400">대표 위치가 없으면 표지 사진 GPS, GPS가 있는 첫 사진 순서로 사용합니다. 위치 공유를 선택한 공개 글의 좌표는 방문자에게 표시됩니다.</p>
      {/* Main Info Fields */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-6">
        <h3 className="font-serif-book text-xl text-zinc-200 border-b border-zinc-800 pb-3">
          1. 기본 출사 정보
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-mono text-zinc-400">출사 제목 *</label>
            <input
              type="text"
              required
              maxLength={300}
              placeholder="e.g. 서촌, 늦가을 빛의 잔상"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
          </div>


          <div className="space-y-1.5">
            <label htmlFor="shooting-date" className="text-xs font-mono text-zinc-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" /> 촬영 날짜 *
            </label>
            <DatePicker id="shooting-date" value={date} onChange={setDate} />
            <p className="text-[11px] text-zinc-500">실제로 촬영한 날짜입니다. 날씨 조회에 사용되며, 메인 목록은 업로드 날짜순으로 표시됩니다.</p>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-mono text-zinc-400">업로드 날짜 · 자동 기록</p>
            <p className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3.5 py-2 text-sm text-zinc-400 font-mono">{initialSession ? formatUploadDate(initialSession.createdAt) : "처음 저장할 때 기록됩니다"}</p>
            <p className="text-[11px] text-zinc-500">사진집을 처음 저장한 날짜(한국 시간)입니다. 촬영일을 수정해도 유지됩니다.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" /> 출사 장소 *
            </label>
            <input
              type="text"
              required={shareLocation}
              maxLength={2000}
              placeholder="e.g. 서울 종로구 서촌 & 옥인동"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
            <p aria-live="polite" className="text-[11px] text-zinc-500">{placeStatus}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400">날씨 및 분위기</label>
            <input
              type="text"
              placeholder="e.g. 맑음, 14°C, 옅은 가을 햇살"
              value={weather}
              onChange={(e) => { setAutoWeather(false); setWeatherStatus(""); setWeather(e.target.value); }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input type="checkbox" checked={autoWeather} onChange={e => { setAutoWeather(e.target.checked); setWeatherStatus(""); }} />
              GPS와 촬영 날짜로 날씨 자동 입력
            </label>
            <p aria-live="polite" className="text-[11px] text-zinc-500">
              {autoWeather && !weatherGps ? "대표 위치 또는 사진 GPS를 설정하면 조회합니다." : weatherStatus}
            </p>
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="text-[10px] text-zinc-500 underline">날씨 데이터: Open-Meteo</a>
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



          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-mono text-zinc-400">출사 소개 글 / 노트</label>
            <textarea
              rows={4}
              maxLength={50000}
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
        <PhotoUploader sessionId={defaultId} ownerId={ownerId} remaining={(memberMode ? MEMBER_PHOTO_LIMIT : 500) - photos.length} onBusyChange={setUploading} onPhotosUploaded={handlePhotosUploaded} />
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
