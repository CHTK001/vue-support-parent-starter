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
 * <p><b>关于 bulb</b>：它也是两张图 —— 同一个灯泡的实心 / 空心两版（Material
 * Design Icons）。不再自己描灯泡路径：手绘的曲线和圆角很难和图标库对齐，
 * 缩到 16px 就像个歪掉的梨。两枚现成图标在小尺寸下依然一眼可辨，且切换是瞬时的。</p>
 */

/** 一组状态图标：激活态 / 非激活态 */
export interface StateIconSet {
  /** 激活态图标名 */
  activeIcon: string;
  /** 非激活态图标名 */
  inactiveIcon: string;
}

/** 内置图标集（名字即 preset key） */
export const STATE_ICON_PRESETS: Readonly<Record<string, StateIconSet>> = {
  /** 日光 / 月光：最通用的开关两态 */
  sunmoon: { activeIcon: "Sunny", inactiveIcon: "Moon" },
  /**
   * 灯泡亮 / 灯泡灭 —— 开关类控件的默认两态。
   *
   * <p>用 Material Design Icons 的<b>同一个灯泡图形</b>做实心 / 空心两态，
   * 与其它几套预设同一路子（star = StarFilled/Star、bell = BellFilled/Bell）。
   * 实心 vs 空心在小尺寸下也一眼可辨，而且不用自己描路径。</p>
   *
   * <p>不用 {@code mdi:lightbulb-on}（带一圈光线）：16px 下那几道光线会碎成
   * 一圈小点，比灯泡本身还抢眼。想要「发光」观感时显式写
   * {@code active-icon="mdi:lightbulb-on"} 即可。</p>
   *
   * <p>图标数据离线内置在 app 侧（见 {@code turbo/app/src/icons/builtinIcons.ts}），
   * 不依赖 Iconify 在线接口。</p>
   */
  bulb: { activeIcon: "mdi:lightbulb", inactiveIcon: "mdi:lightbulb-outline" },
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
  };
}
