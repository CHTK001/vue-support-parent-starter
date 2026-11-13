/**
 * 饰品兜底清单
 *
 * <p>与 V1.0 initdata 里的种子一一对应，只是 ID 取负数：这些条目不在服务端目录里，
 * 只用于「后端未部署 / 首次请求失败」时面板仍有内容、本机也能先戴上。
 * 一旦 {@code GET /v2/ornament/list} 返回数据，就整体替换为服务端目录。</p>
 */
import type { Ornament } from "./types";

/** 内置饰品：4 个头像挂件 + 4 个昵称牌 */
export const BUILTIN_ORNAMENTS: readonly Ornament[] = [
  { id: -1, code: "avatar-star", name: "星芒", slot: "avatar", kind: "glyph", glyph: "★", color: "#f59e0b" },
  { id: -2, code: "avatar-sakura", name: "樱瓣", slot: "avatar", kind: "glyph", glyph: "❀", color: "#f472b6" },
  { id: -3, code: "avatar-spark", name: "星辉", slot: "avatar", kind: "glyph", glyph: "✦", color: "#38bdf8" },
  { id: -4, code: "avatar-moon", name: "月华", slot: "avatar", kind: "glyph", glyph: "☾", color: "#818cf8" },
  {
    id: -11,
    code: "plate-gold",
    name: "鎏金",
    slot: "nameplate",
    kind: "css",
    css: "linear-gradient(135deg, rgba(245,158,11,0.30), rgba(245,158,11,0.08))",
  },
  {
    id: -12,
    code: "plate-ocean",
    name: "海盐",
    slot: "nameplate",
    kind: "css",
    css: "linear-gradient(135deg, rgba(56,189,248,0.28), rgba(56,189,248,0.06))",
  },
  {
    id: -13,
    code: "plate-rose",
    name: "玫瑰",
    slot: "nameplate",
    kind: "css",
    css: "linear-gradient(135deg, rgba(244,114,182,0.28), rgba(244,114,182,0.06))",
  },
  {
    id: -14,
    code: "plate-ink",
    name: "墨玉",
    slot: "nameplate",
    kind: "css",
    css: "linear-gradient(135deg, rgba(148,163,184,0.30), rgba(148,163,184,0.06))",
  },
  {
    id: -5,
    code: "avatar-crown",
    name: "王冠",
    slot: "avatar",
    kind: "glyph",
    glyph: "♛",
    color: "#f59e0b",
    acquire: "limited",
    effect: "glow",
  },
  {
    id: -6,
    code: "avatar-snow",
    name: "初雪",
    slot: "avatar",
    kind: "glyph",
    glyph: "❄",
    color: "#38bdf8",
    effect: "spin",
  },
  {
    id: -15,
    code: "plate-aurora",
    name: "极光",
    slot: "nameplate",
    kind: "css",
    css: "linear-gradient(135deg, rgba(129,140,248,0.30), rgba(56,189,248,0.10))",
  },
];
