/**
 * 日历分类选项
 *
 * 与 CalendarEvent.category 一一对应。
 * 颜色尽量保持与 element-plus 主题色协调。
 */
import type { CalendarCategory } from "./calendarStore";

export interface CalendarCategoryOption {
  value: CalendarCategory;
  label: string;
  color: string;
}

export const CATEGORY_OPTIONS: CalendarCategoryOption[] = [
  { value: "work", label: "工作", color: "#409EFF" },
  { value: "study", label: "学习", color: "#67C23A" },
  { value: "meeting", label: "会议", color: "#E6A23C" },
  { value: "personal", label: "个人", color: "#F56C6C" },
  { value: "life", label: "生活", color: "#909399" },
  { value: "other", label: "其他", color: "#9B59B6" },
];

const COLOR_MAP: Record<CalendarCategory, string> = CATEGORY_OPTIONS.reduce(
  (acc, o) => {
    acc[o.value] = o.color;
    return acc;
  },
  {} as Record<CalendarCategory, string>,
);

export function categoryColor(c: CalendarCategory | undefined): string {
  if (!c) return COLOR_MAP.other;
  return COLOR_MAP[c] ?? COLOR_MAP.other;
}

export function categoryLabel(c: CalendarCategory | undefined): string {
  const opt = CATEGORY_OPTIONS.find((o) => o.value === c);
  return opt?.label ?? "其他";
}
