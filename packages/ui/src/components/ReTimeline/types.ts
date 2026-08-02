export interface ReTimelineItem {
  id: string | number;
  title: string;
  description?: string;
  time: string;
  icon?: string;
  color?: string;
  dotType?: "solid" | "hollow" | "outline";
  extra?: Record<string, unknown>;
  [key: string]: unknown;
}
