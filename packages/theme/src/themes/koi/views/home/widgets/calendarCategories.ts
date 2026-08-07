/**
 * 日历分类定义
 *
 * 提供日程分类的类型、下拉选项与分类对应色值，供 CalendarWidget 使用。
 * 分类值以字符串形式持久化在 IndexedDB 中，新增分类需保持 value 唯一且稳定。
 */

/** 日程分类值 */
export type CalendarCategory = "work" | "personal" | "life" | "important";

/** 分类下拉选项（el-select 数据源，含色点预览） */
export interface CalendarCategoryOption {
  /** 分类值（持久化用） */
  value: CalendarCategory;
  /** 显示文案 */
  label: string;
  /** 分类色值（低饱和度） */
  color: string;
}

/** 所有分类选项 */
export const CATEGORY_OPTIONS: CalendarCategoryOption[] = [
  { value: "work", label: "工作", color: "#3B82F6" },
  { value: "personal", label: "个人", color: "#10B981" },
  { value: "life", label: "生活", color: "#F59E0B" },
  { value: "important", label: "重要", color: "#EF4444" },
];

/** 分类 → 色值映射（供事件列表圆点等场景快速取色） */
const CATEGORY_COLORS: Record<CalendarCategory, string> = {
  work: "#3B82F6",
  personal: "#10B981",
  life: "#F59E0B",
  important: "#EF4444",
};

/** 取某分类的色值（未知分类回退为中性灰） */
export function categoryColor(category: CalendarCategory): string {
  return CATEGORY_COLORS[category] ?? "#9CA3AF";
}
