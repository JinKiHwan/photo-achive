export interface GeoLocation {
  latitude: number;
  longitude: number;
  source: "exif" | "manual" | "search" | "demo";
}

export interface PhotoExif {
  deviceType?: "mobile" | "camera";
  camera?: string;
  lens?: string;
  iso?: string;
  aperture?: string;
  shutter?: string;
  focalLength?: string;
  focalLength35mm?: string;
  takenAt?: string;
}

export interface PhotoUrls {
  thumb: string;  // ~500px long edge
  medium: string; // ~1600px long edge
  large: string;  // ~3000px long edge
}

export interface PhotoStoragePaths {
  thumb: string;
  medium: string;
  large: string;
}

export interface PhotoItem {
  id: string;
  order: number;
  caption?: string;
  location?: string;
  gps?: GeoLocation | null;
  exif?: PhotoExif;
  urls: PhotoUrls;
  storagePaths?: PhotoStoragePaths;
  gdriveOriginalUrl?: string;
  aspectRatio?: number; // width / height
  width?: number;
  height?: number;
}

export interface PhotoSession {
  ownerId?: string; // Missing only on legacy administrator posts.
  shareLocation?: boolean;
  id: string;
  slug: string;
  title: string;
  date: string; // Shooting date, YYYY-MM-DD
  location: string;
  gps?: GeoLocation | null;
  weather?: string;
  camera?: string;
  description: string;
  coverImageId?: string;
  coverImageUrl?: string;
  isPublished: boolean;
  gdriveFolderRef?: string;
  photos: PhotoItem[];
  createdAt: string; // First session upload/save timestamp; preserved on edits
  updatedAt: string;
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  bio: string;
  photoURL: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface PhotoComment {
  id: string;
  sessionId: string;
  authorId: string;
  body: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface CompressionProgress {
  fileName: string;
  stage: 'queued' | 'resizing' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}
