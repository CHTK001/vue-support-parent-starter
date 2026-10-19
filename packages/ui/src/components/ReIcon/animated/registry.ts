/**
 * ReIcon 动画图标注册表 —— 由 scripts/sync-animated-icons.mjs 生成，请勿手改。
 * 上游：ln-dev7/icons-animated @ 3561aea87c239ade543a6388e69ea2f2edaa6ac6（MIT）
 * 新增/删除图标：改脚本里的 ICON_MANIFEST 后执行 `pnpm --filter @repo/ui icons:sync`。
 */
import type { Component } from "vue";

/** 动画图标名的统一前缀：`anim:<lib>:<icon>` */
export const ANIMATED_ICON_PREFIX = "anim:";

/** 一个动画图标的注册项 */
export interface AnimatedIconEntry {
  /** 完整图标名：`anim:<lib>:<icon>` */
  readonly name: string;
  /** 上游图标库 */
  readonly lib: string;
  /** 上游图标文件名（不含 .vue） */
  readonly icon: string;
  /** 懒加载该图标组件（每个图标独立 chunk，不会进主包） */
  readonly load: () => Promise<{ default: Component }>;
}

const ENTRIES: readonly AnimatedIconEntry[] = [
  { name: "anim:heroicons:bell", lib: "heroicons", icon: "bell", load: () => import("./heroicons/bell.vue") },
  { name: "anim:heroicons:heart", lib: "heroicons", icon: "heart", load: () => import("./heroicons/heart.vue") },
  { name: "anim:heroicons:plus", lib: "heroicons", icon: "plus", load: () => import("./heroicons/plus.vue") },
  { name: "anim:heroicons:trash", lib: "heroicons", icon: "trash", load: () => import("./heroicons/trash.vue") },
  { name: "anim:hugeicons:bell", lib: "hugeicons", icon: "bell", load: () => import("./hugeicons/bell.vue") },
  { name: "anim:hugeicons:heart", lib: "hugeicons", icon: "heart", load: () => import("./hugeicons/heart.vue") },
  { name: "anim:hugeicons:plus", lib: "hugeicons", icon: "plus", load: () => import("./hugeicons/plus.vue") },
  { name: "anim:hugeicons:trash", lib: "hugeicons", icon: "trash", load: () => import("./hugeicons/trash.vue") },
  { name: "anim:phosphor:bell", lib: "phosphor", icon: "bell", load: () => import("./phosphor/bell.vue") },
  { name: "anim:phosphor:heart", lib: "phosphor", icon: "heart", load: () => import("./phosphor/heart.vue") },
  { name: "anim:phosphor:plus", lib: "phosphor", icon: "plus", load: () => import("./phosphor/plus.vue") },
  { name: "anim:phosphor:trash", lib: "phosphor", icon: "trash", load: () => import("./phosphor/trash.vue") },
  { name: "anim:tabler:bell", lib: "tabler", icon: "bell", load: () => import("./tabler/bell.vue") },
  { name: "anim:tabler:heart", lib: "tabler", icon: "heart", load: () => import("./tabler/heart.vue") },
  { name: "anim:tabler:plus", lib: "tabler", icon: "plus", load: () => import("./tabler/plus.vue") },
  { name: "anim:tabler:trash", lib: "tabler", icon: "trash", load: () => import("./tabler/trash.vue") },
];

const BY_NAME = new Map<string, AnimatedIconEntry>(ENTRIES.map((entry) => [entry.name, entry]));

/** 全部动画图标名（`anim:<lib>:<icon>`），顺序固定，供选择器稳定分页 */
export const ANIMATED_ICON_NAMES: readonly string[] = ENTRIES.map((entry) => entry.name);

/** 是否是本注册表认识的动画图标名 */
export function isAnimatedIconName(name: unknown): name is string {
  return typeof name === "string" && BY_NAME.has(name);
}

/** 取某个动画图标的懒加载器；未注册时返回 null（调用方回退到普通图标） */
export function loadAnimatedIcon(name: string): (() => Promise<{ default: Component }>) | null {
  return BY_NAME.get(name)?.load ?? null;
}
