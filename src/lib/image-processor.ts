import imageCompression from "browser-image-compression";

export interface CompressedImageSet {
  thumb: File;
  medium: File;
  large: File;
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Resizes an image file into 3 web-optimized WebP sizes in browser:
 * - Thumb: ~500px max long edge
 * - Medium: ~1600px max long edge
 * - Large: ~3000px max long edge
 */
export async function processImageForWeb(
  file: File,
  onProgress?: (stage: string, percent: number) => void
): Promise<CompressedImageSet> {
  // 1. Get original image dimensions
  const dimensions = await getImageDimensions(file);
  const { width, height } = dimensions;
  const aspectRatio = Number((width / height).toFixed(2));

  onProgress?.("Thumb (~500px) 생성 중", 20);

  // 2. Compress Thumb (~500px)
  const thumbFile = await imageCompression(file, {
    maxWidthOrHeight: 500,
    fileType: "image/webp",
    initialQuality: 0.85,
    useWebWorker: true,
  });

  onProgress?.("Medium (~1600px) 생성 중", 50);

  // 3. Compress Medium (~1600px)
  const mediumFile = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    fileType: "image/webp",
    initialQuality: 0.88,
    useWebWorker: true,
  });

  onProgress?.("Large (~3000px) 생성 중", 80);

  // 4. Compress Large (~3000px)
  const largeFile = await imageCompression(file, {
    maxWidthOrHeight: 3000,
    fileType: "image/webp",
    initialQuality: 0.92,
    useWebWorker: true,
  });

  onProgress?.("압축 완료", 100);

  return {
    thumb: renameFile(thumbFile, `${file.name.replace(/\.[^/.]+$/, "")}_thumb.webp`),
    medium: renameFile(mediumFile, `${file.name.replace(/\.[^/.]+$/, "")}_medium.webp`),
    large: renameFile(largeFile, `${file.name.replace(/\.[^/.]+$/, "")}_large.webp`),
    width,
    height,
    aspectRatio,
  };
}

function renameFile(file: File, newName: string): File {
  return new File([file], newName, { type: "image/webp" });
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}
