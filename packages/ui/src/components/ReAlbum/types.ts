export interface ReAlbumItem {
  id: string | number;
  src: string;
  thumb?: string;
  title?: string;
  description?: string;
  tags?: string[];
  date?: string;
  width?: number;
  height?: number;
  extra?: Record<string, unknown>;
  [key: string]: unknown;
}
