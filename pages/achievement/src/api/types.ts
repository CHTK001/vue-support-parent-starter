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

/**
 * 分页响应结构
 * @author CH
 * @since 4.0.0
 */
export interface PageResult<T> {
  current?: number;
  size?: number;
  total?: number;
  pages?: number;
  records?: T[];
  rows?: T[];
  data?: T[];
}

/**
 * API 响应包装结构
 * @author CH
 * @since 4.0.0
 */
export interface ApiResult<T = unknown> {
  status?: number;
  code?: number;
  msg?: string;
  data?: T;
}

/**
 * 成就等级定义
 * @author CH
 * @since 4.0.0
 */
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

/**
 * 已解锁成就（用户端）
 * @author CH
 * @since 4.0.0
 */
export interface UnlockedAchievement {
  id?: number;
  name?: string;
  badge?: string;
  description?: string;
  type?: string;
  level?: number;
  unlockedAt?: string;
}

/**
 * 用户成就统计
 * @author CH
 * @since 4.0.0
 */
export interface AchievementStats {
  userId?: string | number;
  totalUnlocked?: number;
  totalAchievements?: number;
  unlockedByType?: Record<string, number>;
  progress?: Record<string, number>;
}

/**
 * 用户成就记录（管理端）
 * @author CH
 * @since 4.0.0
 */
export interface UserAchievementRecord {
  id?: number;
  userId?: string | number;
  type?: string;
  maxLevel?: number;
  unlockedAt?: string;
  createTime?: string;
}

/**
 * 已解锁成就 DTO（统计用）
 * @author CH
 * @since 4.0.0
 */
export interface UnlockedAchievementDTO {
  type?: string;
  maxLevel?: number;
  level?: number;
  name?: string;
  badge?: string;
}
