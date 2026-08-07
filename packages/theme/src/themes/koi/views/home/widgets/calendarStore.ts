/**
 * IndexedDB 日历事件存储
 *
 * 每个用户独立数据库：koi-home-calendar-{userId}
 * 单个 store：events（keyPath = id）
 */
import { createCalendarStore } from "@repo/utils";
import type { CalendarEvent } from "./calendarStore";

export { createCalendarStore };

/**
 * 获取当前用户对应的日历 store（reactivity 友好）。
 */
export function useCalendarStore(userId: string): ReturnType<typeof createCalendarStore> {
  return createCalendarStore(userId);
}

export type { CalendarEvent };
