import type { PhotoExif } from "@/types";

export function formatAperture(value: string | number | undefined): string {
  if (value === undefined || value === "") return "";
  const number = typeof value === "number" ? value : Number(value.trim().replace(/^f\s*\/?\s*/i, ""));
  if (!Number.isFinite(number) || number <= 0) return typeof value === "string" ? value : "";
  return `f/${number.toFixed(1)}`;
}

export function formatFocalLength(value: string | number | undefined): string {
  if (value === undefined || value === "") return "";
  const number = typeof value === "number" ? value : Number(value.trim().replace(/\s*mm$/i, ""));
  if (!Number.isFinite(number) || number <= 0) return typeof value === "string" ? value : "";
  return `${Number(number.toFixed(1))}mm`;
}

export function formatPhotoFocalLength(exif?: PhotoExif): string {
  const mobile = exif?.deviceType ? exif.deviceType === "mobile" :
    /\b(?:iphone|ipad|pixel|galaxy|sm-[a-z0-9]+)\b/i.test(`${exif?.camera || ""} ${exif?.lens || ""}`);
  if (mobile && exif?.focalLength35mm) return `${formatFocalLength(exif.focalLength35mm)}`;
  if (mobile) return "";
  const physical = formatFocalLength(exif?.focalLength);
  if (physical) return physical;
  return exif?.focalLength35mm ? `${formatFocalLength(exif.focalLength35mm)}` : "";
}

export function photoExifFromTags(tags: Record<string, unknown> | null): PhotoExif {
  if (!tags) return {};
  const exif: PhotoExif = {};
  const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
  const make = text(tags.Make), model = text(tags.Model);
  if (model) exif.camera = make && !model.toLowerCase().startsWith(make.toLowerCase()) ? `${make} ${model}` : model;
  else if (make) exif.camera = make;
  if (text(tags.LensModel)) exif.lens = text(tags.LensModel);
  if (typeof tags.ISO === "number" && tags.ISO > 0) exif.iso = `ISO ${tags.ISO}`;
  if (typeof tags.FNumber === "number" && tags.FNumber > 0) exif.aperture = formatAperture(tags.FNumber);
  if (typeof tags.FocalLength === "number" && tags.FocalLength > 0) exif.focalLength = formatFocalLength(tags.FocalLength);
  const equivalent = tags.FocalLengthIn35mmFormat ?? tags.FocalLengthIn35mmFilm;
  if (typeof equivalent === "number" && equivalent > 0) exif.focalLength35mm = formatFocalLength(equivalent);
  if (typeof tags.ExposureTime === "number" && tags.ExposureTime > 0) {
    const seconds = tags.ExposureTime;
    exif.shutter = seconds < 1 ? `1/${Math.round(1 / seconds)}s` : `${seconds}s`;
  }
  if (tags.DateTimeOriginal instanceof Date && Number.isFinite(tags.DateTimeOriginal.getTime())) exif.takenAt = tags.DateTimeOriginal.toISOString();
  return exif;
}
