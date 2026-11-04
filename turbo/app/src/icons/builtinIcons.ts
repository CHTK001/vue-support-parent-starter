/**
 * 内置离线图标数据
 *
 * <p>项目里的 Iconify 图标（`ri:` / `mdi:` 等）默认由 {@code @iconify/vue} 的
 * {@code Icon} 组件在<b>运行时</b>向 Iconify 接口请求图形数据。这对参数面板之类
 * 偶尔用到的图标没问题，但有两个代价：一是首次渲染要等网络回来（会闪一下空白），
 * 二是断网时图标直接不显示。</p>
 *
 * <p>所以「开关的默认两态」这类<b>到处都在用、且必须立刻可见</b>的图标改为离线内置：
 * 数据随包一起走，{@code addIcon} 注册进 Iconify 的本地 store 后，
 * {@code Icon} 组件直接命中本地缓存，不发请求。</p>
 *
 * <p>图形取自 Material Design Icons（MIT），与 {@code @repo/ui} 的
 * {@code STATE_ICON_PRESETS.bulb} 约定一致 —— 和其它几套预设同一路子：
 * <b>同一个图形，实心 / 空心两态</b>（对照 star 的 StarFilled/Star、
 * bell 的 BellFilled/Bell），缩到 16px 也一眼可辨。</p>
 * <ul>
 *   <li>{@code mdi:lightbulb} —— 实心灯泡（激活态）</li>
 *   <li>{@code mdi:lightbulb-outline} —— 空心灯泡（非激活态）</li>
 * </ul>
 *
 * <p>刻意不用 {@code mdi:lightbulb-on}：它外面带一圈光线，16px 下那几道光线
 * 会碎成一圈小点，比图形本身还抢眼。要「发光」观感时，调用方可以显式写
 * {@code active-icon="mdi:lightbulb-on"}（该图标同样已离线内置）。</p>
 *
 * @see https://icon-sets.iconify.design/mdi/lightbulb/
 */
import { addIcon } from "@iconify/vue";

/** 灯泡：实心（激活态） */
const LIGHTBULB =
  '<path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7M9 21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1H9z"/>';

/** 灯泡：空心（非激活态） */
const LIGHTBULB_OUTLINE =
  '<path fill="currentColor" d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7M9 21v-1h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1m3-17a5 5 0 0 0-5 5c0 2.05 1.23 3.81 3 4.58V16h4v-2.42c1.77-.77 3-2.53 3-4.58a5 5 0 0 0-5-5"/>';

/** 灯泡：亮 + 光线（不进预设，留给显式 active-icon 用） */
const LIGHTBULB_ON =
  '<path fill="currentColor" d="M12 6a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V19a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.8c-1.79-1.04-3-2.98-3-5.2a6 6 0 0 1 6-6m2 15v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1zm6-10h3v2h-3zM1 11h3v2H1zM13 1v3h-2V1zM4.92 3.5l2.13 2.14l-1.42 1.41L3.5 4.93zm12.03 2.13l2.12-2.13l1.43 1.43l-2.13 2.12z"/>';

/**
 * 需要离线内置的图标：`mdi:<name>` → 图形数据。
 *
 * <p>新增图标时把 Iconify 上的 `body` 原样拷进来即可（不要自己重画路径，
 * 手绘的曲线和圆角很难和图标库对齐）。</p>
 */
const BUILTIN_ICONS: Readonly<Record<string, string>> = {
  "mdi:lightbulb": LIGHTBULB,
  "mdi:lightbulb-outline": LIGHTBULB_OUTLINE,
  "mdi:lightbulb-on": LIGHTBULB_ON,
};

/** Iconify 图标数据的宽高（这三枚都是 24×24 的标准网格） */
const GRID = 24;

let registered = false;

/**
 * 把 {@link BUILTIN_ICONS} 注册进 Iconify 本地 store。
 *
 * <p>幂等：重复调用只注册一次。放在 {@code createVueApp} 里、与 Iconify 渲染器
 * 注册同一处调用，保证任何时候渲染图标都已就绪。</p>
 */
export function registerBuiltinIcons(): void {
  if (registered) return;
  registered = true;
  for (const [name, body] of Object.entries(BUILTIN_ICONS)) {
    addIcon(name, { body, width: GRID, height: GRID });
  }
}