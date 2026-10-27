/**
 * ReStateIcon 内置图标集
 *
 * 每个「图标集」是一对图标：激活态 / 非激活态。用于 ReSwitch / ReSelect / ReRadio
 * 这类「同一个控件、两态可辨」的场景 —— 激活与非激活各一套图形。
 *
 * 内置多套（{@link STATE_ICON_PRESETS}），调用方传 `preset` 名字即可选用；
 * 不传 `preset` 时回落到 `sunmoon`。图标名一律走 ReIcon 的多源解析：
 *   - PascalCase          → Element Plus 图标（如 Sunny）
 *   - `ep:xxx`            → 强制 Element Plus
 *   - `anim:<lib>:<icon>` → 动画图标（懒加载独立 chunk）
 *   - `ri:`/`mdi:`/...    → Iconify 三方库
 *
 * 之所以默认用 Element Plus 的 Sunny / Moon：它们是纯静态图标，不会拉入
 * `motion` 动画库；动画切换由 ReStateIcon 自身的 CSS 完成，与上游无关。
 * 想要上游动画图标，直接传 `preset="anim"` 或自定义 `anim:...` 即可。
 *
 * <p><b>例外：bulb</b>。它不是两张图，而是<b>同一张</b>灯泡图 ——
 * 「亮」与「灭」的差别就是有没有光。所以它带 {@link StateIconSet.builtin}，
 * 交给内置的 {@link ./builtin/BulbIcon.vue} 渲染，而不是当成图标库名字。
 * 这样切换是瞬时的（无交叉淡入），也就没有「两个图形叠在一起」的中间态。</p>
 */

/** 一组状态图标：激活态 / 非激活态 */
export interface StateIconSet {
  /** 激活态图标名 */
  activeIcon: string;
  /** 非激活态图标名 */
  inactiveIcon: string;
  /**
   * 内置渲染器名（可选）。
   *
   * <p>取值 {@code "bulb"} 时，{@link activeIcon} / {@link inactiveIcon} 不再是
   * 图标库里的名字，而是交给内置的 {@link ./builtin/BulbIcon.vue} 渲染 ——
   * 它用<b>同一张</b>灯泡图，靠「点亮 / 熄灭」表达两态。</p>
   */
  builtin?: "bulb";
}

/** 内置图标集（两套起步，名字即 preset key） */
export const STATE_ICON_PRESETS: Readonly<Record<string, StateIconSet>> = {
  /** 日光 / 月光：最通用的开关两态 */
  sunmoon: { activeIcon: "Sunny", inactiveIcon: "Moon" },
  /** 灯泡亮 / 灯泡灭：同一颗灯泡点亮与否，最贴合「开/关」直觉 */
  bulb: { activeIcon: "bulb", inactiveIcon: "bulb", builtin: "bulb" },
  /** 对勾 / 叉：用于「选中 / 未选中」的单选、复选语义 */
  check: { activeIcon: "Select", inactiveIcon: "Remove" },
  /** 星标实心 / 空心：收藏、评分、收藏类开关 */
  star: { activeIcon: "StarFilled", inactiveIcon: "Star" },
  /** 铃铛实心 / 空心：通知开关 */
  bell: { activeIcon: "BellFilled", inactiveIcon: "Bell" },
  /** 向上 / 向下箭头：展开、排序类开关 */
  arrow: { activeIcon: "ArrowUp", inactiveIcon: "ArrowDown" },
  /** 上游动画图标：切换时自带 motion 动效（懒加载，体积更大） */
  anim: { activeIcon: "anim:tabler:sun", inactiveIcon: "anim:tabler:moon" },
};

/** 默认图标集：未显式指定时用 sunmoon */
export const DEFAULT_STATE_ICON_PRESET = "sunmoon";

/** 取内置图标集；`""` / `"none"` 表示显式禁用内置回落 */
function resolveBuiltin(preset?: string): StateIconSet | undefined {
  if (!preset || preset === "none") return undefined;
  return STATE_ICON_PRESETS[preset];
}

/**
 * 解析最终生效的两态图标名。
 *
 * 优先级（明确的两态优先，其次内置集，再次通用图标，最后内置默认）：
 *   激活态   = activeIcon ?? 内置集.activeIcon ?? icon ?? 默认集.activeIcon
 *   非激活态 = inactiveIcon ?? 内置集.inactiveIcon ?? icon ?? 默认集.inactiveIcon
 *
 * 这样：
 *   - 传了 `icon` 且没传 preset → 两态都用它（保持既有调用点的等价图标行为）；
 *   - 传了 `preset` → 用内置集的两态（`icon` 退化成最终兜底）；
 *   - 什么都没传 → 用内置默认集（sunmoon），满足「内置默认的两套」；
 *   - `preset="none"` → 只用显式图标，缺哪个就空哪个。
 *
 * <p><b>内置渲染器</b>：内置集里若带 {@code builtin}（目前只有 bulb），
 * 解析结果会带上它 —— 调用方据此改用内置组件渲染，而不是当成图标库名字。
 * 此时 {@code activeIcon} / {@code inactiveIcon} 两个字段都是占位名。</p>
 *
 * @returns 两态图标名；两者都为空串表示没有可用图标（调用方应回退到文字/占位）
 */
export function resolveStateIcons(options: {
  icon?: string;
  activeIcon?: string;
  inactiveIcon?: string;
  preset?: string;
}): StateIconSet {
  const builtin = resolveBuiltin(options.preset);
  const fallback = options.icon ?? "";
  const hasExplicit = Boolean(options.activeIcon || options.inactiveIcon || fallback);
  const useDefault = !hasExplicit && options.preset === undefined;
  const defaultSet = STATE_ICON_PRESETS[DEFAULT_STATE_ICON_PRESET];
  // 显式指定的两态优先于内置集；若显式给了图标名，就不该再走内置渲染器
  const explicitOverridesBuiltin = Boolean(options.activeIcon || options.inactiveIcon);
  return {
    activeIcon:
      options.activeIcon ||
      builtin?.activeIcon ||
      fallback ||
      (useDefault ? defaultSet.activeIcon : ""),
    inactiveIcon:
      options.inactiveIcon ||
      builtin?.inactiveIcon ||
      fallback ||
      (useDefault ? defaultSet.inactiveIcon : ""),
    builtin: !explicitOverridesBuiltin ? builtin?.builtin : undefined,
  };
}
