export interface PhotoExif {
  camera?: string;
  lens?: string;
  iso?: string;
  aperture?: string;
  shutter?: string;
  focalLength?: string;
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
  exif?: PhotoExif;
  urls: PhotoUrls;
  storagePaths?: PhotoStoragePaths;
  gdriveOriginalUrl?: string;
  aspectRatio?: number; // width / height
  width?: number;
  height?: number;
}

export interface PhotoSession {
  id: string;
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  location: string;
  weather?: string;
  camera?: string;
  description: string;
  coverImageId?: string;
  coverImageUrl?: string;
  isPublished: boolean;
  gdriveFolderRef?: string;
  photos: PhotoItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CompressionProgress {
  fileName: string;
  stage: 'resizing' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}
