/**
 * 饰品类型定义
 *
 * <p>字段名与后端 {@code GET /v2/ornament/list} 的下发结构（sys_ornament_*）保持一一对应，
 * 前端只做一次字段映射，之后按槽位渲染。</p>
 */

/** 饰品槽位：头像挂件 / 昵称牌 */
export type OrnamentSlot = "avatar" | "nameplate";

/** 获取方式：default 人人可戴，limited 需先领取 */
export type OrnamentAcquire = "default" | "limited";

/** 动效：减少动态时前端自动静止 */
export type OrnamentEffect = "none" | "pulse" | "spin" | "glow";

/** 全部槽位（顺序即面板分组顺序） */
export const ORNAMENT_SLOTS: readonly OrnamentSlot[] = ["avatar", "nameplate"];

/** 槽位展示名 */
export const ORNAMENT_SLOT_LABELS: Record<OrnamentSlot, string> = {
  avatar: "头像挂件",
  nameplate: "昵称牌",
};

/** 槽位说明（面板里作为一句辅助文字） */
export const ORNAMENT_SLOT_HINTS: Record<OrnamentSlot, string> = {
  avatar: "挂在头像右上角，顶栏与个人中心同时生效。",
  nameplate: "给昵称加一层底色，浅色/暗色主题各取所需。",
};

/** 一件饰品 */
export interface Ornament {
  /** 服务端目录主键；静态兜底清单使用负数，避免与真实 ID 混淆 */
  id: number;
  /** 目录编码，跨设备稳定 */
  code: string;
  name: string;
  slot: OrnamentSlot;
  /** glyph=字符（★ / ❀） css=样式（昵称牌背景） */
  kind?: "glyph" | "css";
  /** 头像挂件的字符 */
  glyph?: string;
  /** 位图地址（可选，优先于字符） */
  image?: string;
  /** 昵称牌的 CSS 背景 */
  css?: string;
  /** 前景色（字符色 / 昵称文字色） */
  color?: string;
  /** 获取方式；缺省视为 default */
  acquire?: OrnamentAcquire;
  /** 动效；缺省视为 none */
  effect?: OrnamentEffect;
  /** 目录级过期时间（ISO 字符串）；空表示永久 */
  expire?: string | null;
}

/** 判断任意值是否是合法槽位 */
export function isOrnamentSlot(value: unknown): value is OrnamentSlot {
  return value === "avatar" || value === "nameplate";
}
