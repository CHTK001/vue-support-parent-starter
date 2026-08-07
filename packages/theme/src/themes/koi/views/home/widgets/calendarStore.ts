/**
 * 日历事件类型 + IndexedDB 存储
 *
 * 每个用户独立数据库：koi-home-calendar-{userId}
 * 单个 store：events（keyPath = id）
 */
import { createCalendarStore, IndexedDBStore } from "@repo/utils";

/** 日历事件 */
export interface CalendarEvent {
  /** 主键 */
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** 标题 */
  title: string;
  /** 是否全天 */
  allDay: boolean;
  /** 开始时间（HH:mm），仅非全天时使用 */
  time?: string;
  /** 分类标签 */
  category: CalendarCategory;
  /** 备注 */
  note?: string;
  /** 创建时间戳 */
  createdAt: number;
}

/** 日历分类（与分类选项一一对应） */
export type CalendarCategory = "work" | "study" | "meeting" | "personal" | "life" | "other";

/** 获取当前用户对应的日历 store */
export function getCalendarStore(userId: string): IndexedDBStore {
  return createCalendarStore(userId);
}
