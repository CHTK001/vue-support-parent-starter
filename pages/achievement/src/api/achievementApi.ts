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

/** Achievement tier page list */
export function pageTiers(params: { page?: number; pageSize?: number; type?: string }) {
  return http()
    .get(`${B}/tiers/page`)
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<AchievementTier>>>((r) => r.data);
}

/** Create tier */
export function saveTier(data: AchievementTier) {
  return http()
    .post(`${B}/tiers/save`)
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** Update tier */
export function updateTier(data: AchievementTier) {
  return http()
    .put(`${B}/tiers/update`)
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** Delete tier */
export function deleteTier(id: number) {
  return http()
    .delete(`${B}/tiers/delete`)
    .query({ id })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** List all types */
export function listTypes() {
  return http()
    .get(`${B}/tiers/types`)
    .then<ApiResult<string[]>>((r) => r.data);
}

/** User achievement records page */
export function pageRecords(params: { userId: string | number; page?: number; pageSize?: number; type?: string }) {
  return http()
    .get(`${B}/records/page`)
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<UserAchievementRecord>>>((r) => r.data);
}

/* ================== User side ================== */

/** Refresh achievements by reporting stats */
export function reportStats(data: { userId: string | number; stats: Record<string, unknown> }) {
  return http()
    .post(`${B}/report`)
    .data(data as Record<string, unknown>)
    .then<ApiResult<UnlockedAchievement[]>>((r) => r.data);
}

/** Get user unlocked achievements */
export function getMyAchievements(userId: string | number) {
  return http()
    .get(`${B}/my/${userId}`)
    .then<ApiResult<UnlockedAchievement[]>>((r) => r.data);
}

/** Get user stats */
export function getStats(userId: string | number) {
  return http()
    .get(`${B}/stats/${userId}`)
    .then<ApiResult<AchievementStats>>((r) => r.data);
}

/** Get tier list by type */
export function getTierList(type: string) {
  return http()
    .get(`${B}/tiers/${type}`)
    .then<ApiResult<AchievementTier[]>>((r) => r.data);
}

/** Get user uncompleted tiers */
export function getUncompleted(userId: string | number, type: string) {
  return http()
    .get(`${B}/uncompleted/${userId}/${type}`)
    .then<ApiResult<AchievementTier[]>>((r) => r.data);
}
