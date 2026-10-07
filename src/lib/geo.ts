import { GeoLocation, PhotoItem, PhotoSession } from "@/types";

export function isValidGps(value: unknown): value is GeoLocation {
  if (!value || typeof value !== "object") return false;
  const { latitude, longitude } = value as GeoLocation;
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}

export function sessionGps(session: PhotoSession): GeoLocation | undefined {
  if (session.shareLocation === false) return undefined;
  if (isValidGps(session.gps)) return session.gps;
  const cover = session.photos.find(photo => photo.id === session.coverImageId);
  if (isValidGps(cover?.gps)) return cover.gps;
  return session.photos.find(photo => isValidGps(photo.gps))?.gps ?? undefined;
}

export function viewingPhotoGps(photo: PhotoItem | undefined, session: PhotoSession): GeoLocation | undefined {
  if (isValidGps(photo?.gps)) return photo.gps;
  return isValidGps(session.gps) ? session.gps : undefined;
}

export function distanceKm(a: Pick<GeoLocation, "latitude" | "longitude">, b: Pick<GeoLocation, "latitude" | "longitude">): number {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLng = radians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export function nearbySessions(sessions: PhotoSession[], origin: GeoLocation, radiusKm: number) {
  return sessions.flatMap(session => {
    const gps = sessionGps(session);
    if (!session.isPublished || !gps || gps.source === "demo") return [];
    const distance = distanceKm(origin, gps);
    return distance <= radiusKm ? [{ session, distance }] : [];
  }).sort((a, b) => a.distance - b.distance || a.session.id.localeCompare(b.session.id));
}
