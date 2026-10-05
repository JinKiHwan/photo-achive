import type { PhotoSession } from "@/types";

/** Do not persist coordinates or place names when a member declines sharing. */
export function applyLocationPrivacy(session: PhotoSession): PhotoSession {
  if (session.shareLocation !== false) return session;
  return {
    ...session, gps: null, location: "위치 비공개",
    photos: session.photos.map(photo => ({ ...photo, gps: null, location: "" })),
  };
}
