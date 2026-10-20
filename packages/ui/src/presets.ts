/**
 * @repo/ui —— Re* 组件预设（preset）
 *
 * <p><strong>为什么需要 preset：</strong>宿主 app 过去要在 {@code main.ts} 里手写
 * 三十来行 {@code "ReButton", "ReTable", ...} 组件名清单。清单属于「这个 app 用到哪些
 * 组件」的知识，却写在最外层壳里 —— 换 app 抄一遍、加组件再抄一遍、删组件忘删就白打包。
 * preset 把这份清单收回到组件库内部按用途命名，宿主只声明「我要哪一套」。</p>
 *
 * <p><strong>为什么不默认全量安装：</strong>组件库的第一设计目标是「按需加载，防止全部组件
 * 打入产物」（见 {@code ./index.ts} 文件头）。全量安装会让产物里塞进几十个用不到的组件，
 * 与该目标直接冲突。所以 preset 是<b>显式选择</b>，不是隐式兜底。</p>
 *
 * <p><strong>树摇仍然有效：</strong>preset 的组件名是<b>静态字符串数组</b>，
 * {@link resolveUiPreset} 展开后交给 {@link installUi} 的 {@code componentLoaders}
 * 逐个动态 import —— 未被 preset 引用的组件不会进入产物。</p>
 */
import { resolveThemeId } from "./theme";

/** 预设中声明的组件加载器子路径（与 install.ts 的 componentLoaders 键一一对应） */
export type UiPreset = readonly string[];

/**
 * 通用后台预设：绝大多数管理端 app 的公共组件。
 *
 * <p>涵盖表格 / 表单 / 弹窗 / 标签 / 卡片 / 加载态等「任何 CRUD 页面都会用到」的基础件。</p>
 *
 * <p><b>ReKit 一次带一串</b>：{@code ReOption / ReFormItem / ReRow / ReCol /
 * ReRadioGroup / ReRadio / ReRadioButton / ReTreeSelect / ReTableColumn /
 * ReDropdown(+Menu/Item) / ReDescriptions(+Item) / ReAlert / ReDivider / ReLink /
 * ReAvatar} 这些「透传 / 美化」型小组件都收敛在 {@code ReKit} 这一个包里注册，
 * 因此清单里只列 {@code ReKit} 一项即可覆盖它们全部。</p>
 */
export const CORE_PRESET: UiPreset = [
  "ReButton",
  "ReTag",
  "ReBadge",
  "ReInput",
  "ReInputNumber",
  "ReSelect",
  "ReDatePicker",
  "ReDialog",
  "ReTable",
  "RePagination",
  "ReForm",
  "ReEmpty",
  "ReSkeleton",
  "ReCard",
  "ReStatusIndicator",
  "ReStatCard",
  "ReSectionHead",
  "ReSwitch",
  "ReFilter",
  "ReText",
  "ReCountup",
  "ReTrend",
  "ReRemoteSelect",
  "ReLoading",
  "ReScrollbar",
  "ReTagFilter",
  "ReTree",
  "ReEmptyState",
  "ReTab",
  "ReKit",
  "ReProcessTask",
  "ReCommand",
  "ReIconSelect",
  "ReRelationGraph",
  "ReProgress",
  "ReThree",
];

/**
 * 监控台预设：{@link CORE_PRESET} + 监控台特有的过程任务浮层与关系图。
 *
 * <p>当前与 {@link CORE_PRESET} 内容一致（监控台用到的组件恰好就是这批）。
 * 独立成名的意义：日后监控台若新增 / 移除组件，改这里即可，
 * 不必让其它 app 跟着动 —— preset 之间可以自由叠加。</p>
 */
export const MONITOR_PRESET: UiPreset = CORE_PRESET;

/** 预设别名表：宿主用短名声明，组件库内部维护实际清单 */
const PRESETS: Record<string, UiPreset> = {
  core: CORE_PRESET,
  monitor: MONITOR_PRESET,
};

/** 全部可用预设名（供 IDE 提示 / 校验） */
export type UiPresetName = keyof typeof PRESETS;

/**
 * 解析预设名 → 组件名清单。
 *
 * <p>未知预设名抛错而非静默忽略：静默忽略会表现为「组件没注册，页面渲染成未知元素」，
 * 且控制台没有明显报错（与 {@code install.ts} 里 {@code ReGraph3D} 那次静默失败同源）。
 * 抛错能在启动时立刻暴露拼写错误。</p>
 *
 * @param name 预设名（如 {@code "monitor"}）
 * @returns 该预设声明的组件名清单
 * @throws 预设名不存在时抛出
 */
export function resolveUiPreset(name: string): UiPreset {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(
      `[ui] 未知的组件预设 "${name}"。可用预设：${Object.keys(PRESETS).join(" / ")}`
    );
  }
  return preset;
}

/**
 * 预热组件内部懒加载布局 —— 消除首次打开弹窗 / 下拉时的卡顿。
 *
 * <p>ReSelect / ReSwitch / ReDrawer 的「主题化布局」是动态 import 的，
 * 不预热的话首次打开会先白屏再渲染。</p>
 *
 * <p>这些布局与业务无关，属于组件自身的实现细节，因此由组件库自己声明，
 * 而不是让每个 app 在 {@code main.ts} 里各写一遍 {@code void import(...)}。</p>
 *
 * <p>ReDialog 的预热按当前 themeId 选择实现（koi 主题走 {@code theme/koi/ReDialog.vue}，
 * 其它主题走组件根实现）—— 组件库不与具体主题焊死。</p>
 */
export function preloadUiLayouts(): void {
  // ReSelect / ReSwitch / ReDrawer 的布局与主题无关，各主题共用同一份。
  void import("./components/ReSelect/layouts/Square.vue");
  void import("./components/ReSelect/layouts/Modern.vue");
  void import("./components/ReSwitch/layouts/SquareReSwitch.vue");
  void import("./components/ReSwitch/layouts/CardReSwitch.vue");
  void import("./components/ReDrawer");

  // ReDialog 的主题实现按 themeId 分流（与 theme.ts 的 componentLoaders 同构）。
  if (resolveThemeId() === "koi") {
    void import("./components/ReDialog/theme/koi/ReDialog.vue");
  } else {
    void import("./components/ReDialog/ReDialog.vue");
  }
}
