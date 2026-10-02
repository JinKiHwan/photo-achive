import { GeoLocation, PhotoSession } from "@/types";

export function isValidGps(value: unknown): value is GeoLocation {
  if (!value || typeof value !== "object") return false;
  const { latitude, longitude } = value as GeoLocation;
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}

export function sessionGps(session: PhotoSession): GeoLocation | undefined {
  if (isValidGps(session.gps)) return session.gps;
  const cover = session.photos.find(photo => photo.id === session.coverImageId);
  if (isValidGps(cover?.gps)) return cover.gps;
  return session.photos.find(photo => isValidGps(photo.gps))?.gps ?? undefined;
}
