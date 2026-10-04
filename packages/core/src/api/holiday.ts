/**
 * 节假日后台接口封装（@repo/core）
 *
 * 后台提供两个接口：
 *   - `GET /v2/holiday/get?year=` 取某年节假日（按<b>日期逐行</b>返回）
 *   - `GET /v2/holiday/sync`     从三方同步到本地库（管理员权限，后台目前尚未实现）
 *
 * 本模块只负责取数与归一，<b>不缓存、不持有状态</b> —— 归一后的结果交给调用方
 * （home 日历的 remoteHolidays 覆盖层）保存。这样主题层不必反向依赖 core 的实现细节，
 * core 也不必知道日历怎么用这批数据。
 *
 * 后台未部署该接口时 {@link fetchHolidays} 返回 {@code null} 而不是抛错：
 * 日历本来就有内置表，取不到时退回内置即可，不该让整页报错。
 */
import { log } from "@repo/utils";
import { http } from "./index";
import { probeBackend } from "./backendProbe";
import { HOLIDAY_LIST_PATH, HOLIDAY_SYNC_PATH } from "./capability";
import type { ApiResult } from "./index";

/** 后台返回的一条节假日记录（字段名为后端 SysHoliday 的驼峰形式） */
export interface SysHolidayDTO {
  /** 主键 */
  sysHolidayId?: number;
  /** 年份 */
  sysHolidayYear?: number;
  /** 日期，Jackson 可能给 "2026-10-01" 或 "2026-10-01T00:00:00" */
  sysHolidayDate?: string;
  /** 名称，如「国庆节」「春节调休」 */
  sysHolidayName?: string;
  /** true=休息，false=调休上班 */
  sysHolidayIsHoliday?: boolean | number | string;
  [key: string]: unknown;
}

/** 归一后的单日节假日（本系统契约，UI 只认这套） */
export interface HolidayRecord {
  /** {@code YYYY-MM-DD} */
  key: string;
  /** 节日名 */
  name: string;
  /** true = 休息，false = 调休上班 */
  isHoliday: boolean;
}

/**
 * 日期归一：截到日并补零。
 *
 * <p>Jackson 对 {@code LocalDate} 默认输出 {@code "2026-10-01"}，但开启
 * {@code WRITE_DATES_AS_TIMESTAMPS} 时会变成数组或数字。这里只接受前 10 位的日期串，
 * 其余形态一律视为无法解析并丢弃 —— 猜日期会写错格子，比不显示更糟。</p>
 */
function toDateKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

/**
 * 布尔宽松解析：后端是 {@code Boolean}，但旧数据或不同驱动可能是 {@code 1/0} / {@code "true"}。
 */
function toBool(raw: unknown): boolean {
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw !== 0;
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    return s !== "" && s !== "0" && s !== "false";
  }
  return false;
}

/**
 * 归一后台返回的原始行。
 *
 * @param rows 原始数组
 * @returns 合法记录（日期非法或名称为空的行被丢弃）
 */
export function normalizeHolidays(rows: readonly unknown[]): HolidayRecord[] {
  const out: HolidayRecord[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as SysHolidayDTO;
    const key = toDateKey(r.sysHolidayDate ?? r.date);
    const name = String(r.sysHolidayName ?? r.name ?? "").trim();
    if (!key || !name) continue;
    out.push({ key, name, isHoliday: toBool(r.sysHolidayIsHoliday ?? r.isHoliday) });
  }
  return out;
}

/**
 * 取某年的节假日。
 *
 * <p>先 HEAD 探测接口是否存在，未命中直接返回 {@code null}（不发请求），
 * 避免后台没这个接口时每轮稳定换来一次 404 噪音。</p>
 *
 * @param year 公历年
 * @returns 归一后的记录；接口不存在、请求失败或返回空时返回 {@code null}
 */
export async function fetchHolidays(year: number): Promise<HolidayRecord[] | null> {
  if (!(await probeBackend(HOLIDAY_LIST_PATH))) {
    return null;
  }
  try {
    const res = await http()
      .get(HOLIDAY_LIST_PATH)
      .query({ year })
      .timeout(5000)
      .retry(false)
      .then<ApiResult<SysHolidayDTO[]>>((r) => r.data);
    const rows = res?.data;
    if (!Array.isArray(rows)) {
      // 后台连通了但没有数据：也要与「接口不存在」区分开，
      // 否则调用方会把「今年还没录入」误当成「后台没这接口」而反复探测
      log.warn("holiday", `${year} 年后台返回非数组，按空数据处理`);
      return [];
    }
    return normalizeHolidays(rows);
  } catch (error) {
    log.warn("holiday", `获取 ${year} 年节假日失败，回落内置数据`, error);
    return null;
  }
}

/**
 * 触发后台从三方同步节假日（管理员权限）。
 *
 * <p>后台 {@code SysHolidayServiceImpl#sync()} 目前是返回 {@code false} 的占位实现，
 * 因此这里把 {@code false} 也当作失败，让调用方能提示「后台尚未实现同步」。</p>
 *
 * @param loading 是否显示全局 loading
 * @returns 同步成功返回 {@code true}
 */
export async function syncHolidays(loading = true): Promise<boolean> {
  const res = await http()
    .get(HOLIDAY_SYNC_PATH)
    .loading(loading)
    .retry(false)
    .then<ApiResult<boolean>>((r) => r.data);
  return res?.data === true;
}