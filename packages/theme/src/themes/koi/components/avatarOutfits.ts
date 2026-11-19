/**
 * 我的搭配方案（纯前端 localStorage，不落库）
 *
 * <p>一套方案 = 头像框 + 挂件/昵称牌编码组合，是用户自己的「常用心仪组合」。
 * 服务端暂无「搭配方案」概念，先存本机（与壁纸/饰品本地快照同一策略）；
 * 后续要跨设备时再迁服务端接口，编码（code）跨设备稳定，迁移无歧义。</p>
 *
 * <p>应用方案拆成既有契约：头像框走 PUT /v2/user/update（AvatarFramePanel），
 * 挂件/昵称牌走 wearOrnament → PUT /v2/ornament/mine（ornaments/store）。</p>
 */

/** 一套搭配方案 */
export interface AvatarOutfit {
  /** 本地方案 ID（时间戳 + 随机段） */
  id: string;
  name: string;
  /** 头像框字典 ID；0 = 不佩戴 */
  frameId: number;
  /** 挂件 / 昵称牌编码（佩戴时按编码回目录查件） */
  ornamentCodes: string[];
  /** 保存时间（毫秒），暂只用于排序展示 */
  createdAt: number;
}

/** localStorage 键（版本化，改结构时换 v2 自动回落为空） */
const OUTFIT_KEY = "koi:avatar:outfits:v1";

/** 方案数量上限：防止无限膨胀，也够日常用 */
export const OUTFIT_LIMIT = 20;

/** 读取全部方案（损坏 / 非法数据一律返回空数组，不让面板崩掉） */
export function loadOutfits(): AvatarOutfit[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(OUTFIT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((o): o is Record<string, unknown> => Boolean(o) && typeof o === "object")
      .map((o) => ({
        id: typeof o.id === "string" ? o.id : "",
        name: typeof o.name === "string" && o.name.trim() ? o.name : "未命名搭配",
        frameId: Number(o.frameId) || 0,
        ornamentCodes: Array.isArray(o.ornamentCodes)
          ? o.ornamentCodes.filter((c): c is string => typeof c === "string" && Boolean(c))
          : [],
        createdAt: Number(o.createdAt) || 0,
      }))
      .filter((o) => o.id)
      .slice(0, OUTFIT_LIMIT);
  } catch {
    return [];
  }
}

/** 落盘全部方案（存不下不影响本次会话） */
export function persistOutfits(list: AvatarOutfit[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(OUTFIT_KEY, JSON.stringify(list.slice(0, OUTFIT_LIMIT)));
  } catch {
    /* 忽略：隐私模式 / 配额满 */
  }
}

/** 生成方案 ID（时间戳 + 随机段，本机内防碰撞足够） */
export function newOutfitId(): string {
  return `outfit-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}
