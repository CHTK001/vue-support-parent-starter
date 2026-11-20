/**
 * 我的搭配方案（云端保存，本机兜底）
 *
 * <p>一套方案 = 头像框 + 挂件/昵称牌编码组合，是用户自己的「常用心仪组合」。
 * 已登录时以服务端为准（GET/PUT/DELETE {@code /v2/ornament/outfit*}），随登录态跨设备漫游；
 * 接口失败或未登录时回落本机 localStorage，功能不因网络问题不可用。</p>
 *
 * <p>应用方案拆成既有契约：头像框走 PUT /v2/user/update（AvatarFramePanel），
 * 挂件/昵称牌走 wearOrnament → PUT /v2/ornament/mine（ornaments/store）。</p>
 */
import { Http, getAccessToken } from "@repo/utils";

/** 一套搭配方案 */
export interface AvatarOutfit {
  /** 服务端方案 ID（数字串）；本机兜底方案为时间戳 + 随机段 */
  id: string;
  name: string;
  /** 头像框字典 ID；0 = 不佩戴 */
  frameId: number;
  /** 挂件 / 昵称牌编码（佩戴时按编码回目录查件） */
  ornamentCodes: string[];
  /** 保存时间（毫秒），用于排序展示 */
  createdAt: number;
}

/** localStorage 键（版本化，改结构时换 v2 自动回落为空） */
const OUTFIT_KEY = "koi:avatar:outfits:v1";

/** 服务端接口（与 SysOrnamentController 的 outfit 端点一致） */
const API_OUTFIT = "/v2/ornament/outfit";
const API_OUTFIT_LIST = "/v2/ornament/outfit/list";

/** 方案数量上限：与后端 sys_user_avatar_outfit 的上限一致 */
export const OUTFIT_LIMIT = 20;

/** 是否已登录（有令牌才走云端） */
function hasToken(): boolean {
  try {
    return Boolean(getAccessToken());
  } catch {
    return false;
  }
}

/** 动态取接口实例：避免 theme ↔ core 的静态循环依赖（与饰品 / 头像框同一写法） */
async function api(): Promise<{
  get: (url: string) => any;
  put: (url: string) => any;
  delete: (url: string) => any;
}> {
  const { getApiHttp } = await import("@repo/core");
  return getApiHttp();
}

/** 服务端时间（yyyy-MM-dd HH:mm:ss）转毫秒；解析失败返回 0 */
function parseServerTime(value: unknown): number {
  if (typeof value !== "string" || !value) return 0;
  const ms = Date.parse(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isFinite(ms) ? ms : 0;
}

/** 服务端行 → 方案；缺 ID 的行丢弃 */
function rowToOutfit(row: Record<string, unknown>): AvatarOutfit | null {
  const id = row.sysUserAvatarOutfitId;
  if (id === undefined || id === null || id === "") return null;
  const codes =
    typeof row.ornamentCodes === "string" && row.ornamentCodes
      ? row.ornamentCodes
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];
  return {
    id: String(id),
    name:
      typeof row.outfitName === "string" && row.outfitName.trim()
        ? row.outfitName
        : "未命名搭配",
    frameId: Number(row.frameId) || 0,
    ornamentCodes: codes,
    createdAt: parseServerTime(row.createTime),
  };
}

/** 服务端行数组 → 方案列表（并写入本机快照，离线 / 未登录时仍可展示） */
function rowsToOutfits(rows: unknown[]): AvatarOutfit[] {
  const list = rows
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
    .map(rowToOutfit)
    .filter((o): o is AvatarOutfit => Boolean(o))
    .slice(0, OUTFIT_LIMIT);
  persistLocalOutfits(list);
  return list;
}

/**
 * 读取全部方案：已登录以云端为准，失败 / 未登录用本机快照
 */
export async function loadOutfits(): Promise<AvatarOutfit[]> {
  if (hasToken()) {
    try {
      const http = await api();
      const body = await http
        .get(API_OUTFIT_LIST)
        .loading(false)
        .noToast(true)
        .then((r: any) => r.data);
      if (Http.isSuccessful(body) && Array.isArray(body?.data)) {
        return rowsToOutfits(body.data);
      }
    } catch {
      /* 云端不可用，走本机快照 */
    }
  }
  return loadLocalOutfits();
}

/**
 * 云端保存方案（新增或重命名）
 *
 * @param input id 缺省为新增；name/frameId/ornamentCodes 为方案内容
 * @returns 成功返回服务端最新方案列表；未登录 / 失败返回 null（调用方回落本机）
 */
export async function saveOutfit(input: {
  id?: string;
  name: string;
  frameId: number;
  ornamentCodes: string[];
}): Promise<AvatarOutfit[] | null> {
  if (!hasToken()) return null;
  try {
    const http = await api();
    const body = await http
      .put(API_OUTFIT)
      .data({
        id: input.id && /^\d+$/.test(input.id) ? Number(input.id) : undefined,
        name: input.name,
        frameId: input.frameId,
        ornamentCodes: input.ornamentCodes,
      })
      .loading(false)
      .noToast(true)
      .then((r: any) => r.data);
    if (Http.isSuccessful(body) && Array.isArray(body?.data)) {
      return rowsToOutfits(body.data);
    }
  } catch {
    /* 云端失败，调用方回落本机 */
  }
  return null;
}

/**
 * 云端删除方案
 *
 * @param id 方案 ID（服务端数字串）
 * @returns 成功返回最新方案列表；未登录 / 失败返回 null（调用方回落本机）
 */
export async function deleteOutfit(id: string): Promise<AvatarOutfit[] | null> {
  if (!hasToken() || !/^\d+$/.test(id)) return null;
  try {
    const http = await api();
    const body = await http
      .delete(`${API_OUTFIT}/${id}`)
      .loading(false)
      .noToast(true)
      .then((r: any) => r.data);
    if (Http.isSuccessful(body) && Array.isArray(body?.data)) {
      return rowsToOutfits(body.data);
    }
  } catch {
    /* 云端失败，调用方回落本机 */
  }
  return null;
}

/** 读取本机快照（损坏 / 非法数据一律返回空数组，不让面板崩掉） */
export function loadLocalOutfits(): AvatarOutfit[] {
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

/** 落盘本机快照（存不下不影响本次会话） */
export function persistLocalOutfits(list: AvatarOutfit[]): void {
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

/** 搭配内容签名（框 + 饰品编码集合），用于保存 / 导入时去重 */
export function outfitSignature(frameId: number, ornamentCodes: string[]): string {
  return `${frameId}|${[...ornamentCodes].sort().join(",")}`;
}

/**
 * 把方案编码成可分享口令：base64url(JSON)，UTF-8 安全。
 * 编码里只有 frameId 与饰品 code（跨设备稳定），不含本机 ID 与时间戳。
 */
export function encodeOutfitToken(outfit: AvatarOutfit): string | null {
  try {
    const json = JSON.stringify({ v: 1, f: outfit.frameId, o: outfit.ornamentCodes, n: outfit.name });
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return null;
  }
}

/** 解析分享口令；格式不合法返回 null */
export function decodeOutfitToken(token: string): {
  frameId: number;
  ornamentCodes: string[];
  name: string;
} | null {
  try {
    const base64 = token.trim().replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object") return null;
    const data = parsed as Record<string, unknown>;
    if (data.v !== 1) return null;
    const frameId = Number(data.f) || 0;
    const ornamentCodes = Array.isArray(data.o)
      ? data.o.filter((c): c is string => typeof c === "string" && Boolean(c))
      : [];
    if (!frameId && !ornamentCodes.length) return null;
    return { frameId, ornamentCodes, name: typeof data.n === "string" ? data.n : "" };
  } catch {
    return null;
  }
}
