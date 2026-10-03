export const MEDIA_FOLDERS = ["general", "product", "brand", "category", "logo", "banner"] as const;

export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export type MediaAsset = {
  id: string;
  /** Object key in R2, e.g. "product/…". */
  key: string;
  url: string;
  folder: MediaFolder;
  originalName?: string;
  mimeType?: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  title?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
