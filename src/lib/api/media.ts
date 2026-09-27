// Image uploads for the store designer (logo, favicon, banners).
//
// Production: POST the file to the NestJS media endpoint (/admin/media),
// which stores it (S3/R2/Cloudinary…) and returns a CDN URL. Mock mode: the
// image is resized in the browser and inlined as a data URL, so previews and
// the saved design work end to end without a backend.

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_INPUT_BYTES = 8 * 1024 * 1024;

export class UploadError extends Error {}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new UploadError("That file doesn't look like an image."));
    };
    image.src = url;
  });
}

async function inlineImage(file: File, maxSize: number) {
  const image = await loadImage(file);
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
  // Keep transparency for logos; WebP keeps files small.
  return canvas.toDataURL("image/webp", 0.88);
}

export async function uploadImage(file: File, { maxSize = 1200 }: { maxSize?: number } = {}): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new UploadError("Use a PNG, JPG, WebP or GIF image.");
  if (file.size > MAX_INPUT_BYTES) throw new UploadError("That image is over 8 MB. Try a smaller one.");

  const endpoint = process.env.NEXT_PUBLIC_MEDIA_UPLOAD_URL;
  if (endpoint) {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(endpoint, { method: "POST", body, credentials: "include" });
    const data = await response.json().catch(() => null);
    if (!response.ok || typeof data?.url !== "string") throw new UploadError(data?.message ?? "Upload failed. Please try again.");
    return data.url;
  }
  return inlineImage(file, maxSize);
}
