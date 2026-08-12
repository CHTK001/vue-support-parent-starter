/**
 * Achievement module types (@pages/achievement)
 *
 * Maps to backend spring-api-support-common-achievement-starter:
 *   - /achievement/tiers/page       - Admin tier pagination
 *   - /achievement/tiers/{type}     - Tier list by type
 *   - /achievement/tiers/types      - All distinct types
 *   - /achievement/tiers/save       - Create tier
 *   - /achievement/tiers/update     - Update tier
 *   - /achievement/tiers/delete     - Delete tier
 *   - /achievement/my/{userId}      - User unlocked achievements
 *   - /achievement/stats/{userId}   - User stats
 *   - /achievement/uncompleted/{userId}/{type} - User uncompleted
 *   - /achievement/records/page     - Admin user records pagination
 */

/** Paginated response */
export interface PageResult<T> {
  current?: number;
  size?: number;
  total?: number;
  pages?: number;
  records?: T[];
  rows?: T[];
  data?: T[];
}

/** API response wrapper */
export interface ApiResult<T = unknown> {
  status?: number;
  code?: number;
  msg?: string;
  data?: T;
}

/** Achievement tier definition */
export interface AchievementTier {
  id?: number;
  type?: string;
  level?: number;
  name?: string;
  badge?: string;
  description?: string;
  rule?: string;
  sort?: number;
  status?: number;
  createTime?: string;
  updateTime?: string;
}

/** Unlocked achievement (user side) */
export interface UnlockedAchievement {
  id?: number;
  name?: string;
  badge?: string;
  description?: string;
  type?: string;
  level?: number;
  unlockedAt?: string;
}

/** User achievement stats */
export interface AchievementStats {
  userId?: string | number;
  totalUnlocked?: number;
  totalAchievements?: number;
  unlockedByType?: Record<string, number>;
  progress?: Record<string, number>;
}

/** User achievement record (admin side) */
export interface UserAchievementRecord {
  id?: number;
  userId?: string | number;
  type?: string;
  maxLevel?: number;
  unlockedAt?: string;
  createTime?: string;
}

/** Unlocked achievement DTO (stats) */
export interface UnlockedAchievementDTO {
  type?: string;
  maxLevel?: number;
  level?: number;
  name?: string;
  badge?: string;
}
