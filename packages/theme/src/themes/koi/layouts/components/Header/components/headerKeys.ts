/**
 * 顶栏条目的「布尔开关键」清单（叶子模块，不 import 任何组件）
 *
 * <p>单独抽出来的原因：`other.toolbar.items` 只管辖**顶栏**条目，
 * 而设置抽屉里的开关列表还混着 `breadcrumb*` / `tabIcon` / `logo` 这些
 * 布局元素。抽屉要按 `items` 过滤，就必须知道"哪些键属于顶栏"——
 * 但抽屉不该为此反向 import headerItems.ts（那会把 ReWeather / ReTyphoon
 * 等一堆组件拉进依赖图）。所以把这份键表放在这个零依赖模块里，
 * 由 headerItems.ts 与 ThemeConfig 共同引用，避免两处各写一份而漂移。</p>
 */
export const HEADER_FLAG_KEYS = [
  "searchMenu",
  "refresh",
  "message",
  "dark",
  "language",
  "fullScreen",
  "themeSetting",
  "user",
  "weather",
  "typhoon",
] as const;

/** 顶栏布尔开关键 */
export type HeaderFlagKey = (typeof HEADER_FLAG_KEYS)[number];

/**
 * 判断某个 toolbar 键是否属于「顶栏条目」。
 *
 * @param key toolbar 配置键
 * @returns 是否受 other.toolbar.items 管辖
 */
export function isHeaderFlagKey(key: string): key is HeaderFlagKey {
  return (HEADER_FLAG_KEYS as readonly string[]).includes(key);
}
