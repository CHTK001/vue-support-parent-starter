/**
 * Achievement API (@pages/achievement)
 *
 * All calls go through http(), URL pattern: /achievement/{action}
 */
import { http } from "@repo/utils";
import type {
  AchievementStats,
  AchievementTier,
  ApiResult,
  PageResult,
  UnlockedAchievement,
  UnlockedAchievementDTO,
  UserAchievementRecord,
} from "./types";

const B = "/achievement";

/* ================== Admin CRUD ================== */

/** 分页查询成就等级列表 */
export function pageTiers(params: { page?: number; pageSize?: number; type?: string }) {
  return http()
    .get(`${B}/tiers/page`)
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<AchievementTier>>>((r) => r.data);
}

/** 创建成就等级 */
export function saveTier(data: AchievementTier) {
  return http()
    .post(`${B}/tiers/save`)
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 更新成就等级 */
export function updateTier(data: AchievementTier) {
  return http()
    .put(`${B}/tiers/update`)
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除成就等级 */
export function deleteTier(id: number) {
  return http()
    .delete(`${B}/tiers/delete`)
    .query({ id })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 获取全部成就类型 */
export function listTypes() {
  return http()
    .get(`${B}/tiers/types`)
    .then<ApiResult<string[]>>((r) => r.data);
}

/** 分页查询用户成就记录 */
export function pageRecords(params: { userId: string | number; page?: number; pageSize?: number; type?: string }) {
  return http()
    .get(`${B}/records/page`)
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<UserAchievementRecord>>>((r) => r.data);
}

/* ================== User side ================== */

/** 上报统计数据以刷新成就解锁状态 */
export function reportStats(data: { userId: string | number; stats: Record<string, unknown> }) {
  return http()
    .post(`${B}/report`)
    .data(data as Record<string, unknown>)
    .then<ApiResult<UnlockedAchievement[]>>((r) => r.data);
}

/** 获取用户已解锁成就 */
export function getMyAchievements(userId: string | number) {
  return http()
    .get(`${B}/my/${userId}`)
    .then<ApiResult<UnlockedAchievement[]>>((r) => r.data);
}

/** 获取用户成就统计 */
export function getStats(userId: string | number) {
  return http()
    .get(`${B}/stats/${userId}`)
    .then<ApiResult<AchievementStats>>((r) => r.data);
}

/** 按类型获取成就等级列表 */
export function getTierList(type: string) {
  return http()
    .get(`${B}/tiers/${type}`)
    .then<ApiResult<AchievementTier[]>>((r) => r.data);
}

/** 获取用户未解锁的成就等级 */
export function getUncompleted(userId: string | number, type: string) {
  return http()
    .get(`${B}/uncompleted/${userId}/${type}`)
    .then<ApiResult<AchievementTier[]>>((r) => r.data);
}
