/**
 * 彩色品牌图标（选择器「彩色」页签）—— 按组懒加载 body。
 *
 * <p>229 个品牌图标合起来 gzip 约 365KB，全量打进主包不可接受；
 * 按组分文件后，侧边菜单里真正用到的通常只有一组（gzip 20~85KB）。</p>
 *
 * <p>body 由 scripts/sync-colorful-icons.mjs 生成，按组整表缓存。</p>
 */
import type { ColorfulIconBody } from "./types";
import { COLORFUL_ICON_GROUP_OF } from "./names";

type BodyMap = Record<string, ColorfulIconBody>;

/** 分组 → 懒加载：每个 import 各自成一个 chunk */
const LOADERS: Record<string, () => Promise<BodyMap>> = {
  os: () => import("./bodies.os").then((m) => m.COLORFUL_ICON_BODIES),
  devtool: () => import("./bodies.devtool").then((m) => m.COLORFUL_ICON_BODIES),
  backend: () => import("./bodies.backend").then((m) => m.COLORFUL_ICON_BODIES),
  frontend: () => import("./bodies.frontend").then((m) => m.COLORFUL_ICON_BODIES),
  database: () => import("./bodies.database").then((m) => m.COLORFUL_ICON_BODIES),
  cloud: () => import("./bodies.cloud").then((m) => m.COLORFUL_ICON_BODIES),
  office: () => import("./bodies.office").then((m) => m.COLORFUL_ICON_BODIES),
};

const cache = new Map<string, BodyMap>();

/**
 * 同步取已缓存的 body（该组还没下载过就返回 null）。
 *
 * <p>组件切图标时先用它同步命中，避免「A 的 body 还挂着、B 正在路上」出现的错图一帧。</p>
 */
export function peekColorfulIcon(name: string): ColorfulIconBody | null {
  const group = COLORFUL_ICON_GROUP_OF[name];
  if (!group) return null;
  return cache.get(group)?.[name] ?? null;
}

/** 取彩色品牌图标的 body（首次按组下载，之后命中缓存；未内置返回 null） */
export async function loadColorfulIcon(name: string): Promise<ColorfulIconBody | null> {
  const cached = peekColorfulIcon(name);
  if (cached) return cached;
  const group = COLORFUL_ICON_GROUP_OF[name];
  if (!group) return null;
  let bodies = cache.get(group);
  if (!bodies) {
    bodies = await LOADERS[group]();
    cache.set(group, bodies);
  }
  return bodies[name] ?? null;
}
