/**
 * 命令面板业务数据源注册表（ReSearchMenu 扩展点）
 *
 * <p>顶栏搜索（⌘K 命令面板）默认只搜「菜单 / 动作 / 最近访问」三类壳内静态数据；
 * 要把它变成真搜索，各业务模块需要把自己的数据（主机资产、告警策略、告警规则…）
 * 注册进来，输入关键字后即可直达对应页面。</p>
 *
 * <p>与 home widget 同一套分层：本文件在共享主题包（theme）里只定义<b>契约</b>
 * （类型 + 注册表 + 贡献适配器），<b>不</b>import 任何 {@code pages/xx} 业务包；
 * 业务源由应用壳在 {@code main.ts} 里通过 {@link definePaletteContribution} 注册
 * （走 {@code createContextApp().widgets(...)} 通道，与 widget 贡献同机制）。</p>
 */
import { computed, shallowRef } from "vue";

/** 一条业务搜索结果（命令面板列表项） */
export interface PaletteSourceItem {
  /** 唯一键：建议带业务域前缀，如 host:12 / policy:3 */
  id: string;
  /** 主标题（主机名 / 策略名 / 指标名） */
  title: string;
  /** 次要说明（IP 地址 / 阈值 / 编号） */
  hint: string;
  /** 图标名（ReIcon；缺省回落到源级 {@link PaletteSource#icon}） */
  icon?: string;
  /** 跳转目标（vue-router path，可带 ?query） */
  path: string;
}

/** 一个业务数据源：关键字 → 结果列表 */
export interface PaletteSource {
  /** 注册键（重复注册幂等覆盖） */
  key: string;
  /** 分组标题（如「主机资产」「告警策略」） */
  groupLabel: string;
  /** 该组结果的默认图标（ReIcon name） */
  icon?: string;
  /** 查询函数：仅在关键字非空时被调用；抛错由消费方兜底，不影响其它源 */
  query: (keyword: string) => Promise<PaletteSourceItem[]>;
}

const sources = new Map<string, PaletteSource>();
const version = shallowRef(0);

/**
 * 注册一个业务源（幂等：同 key 覆盖）。
 * 供 {@link definePaletteContribution} 调用，一般不需要业务侧直接使用。
 *
 * @param source 业务源
 */
export function registerPaletteSource(source: PaletteSource): void {
  sources.set(source.key, source);
  version.value++;
}

/**
 * 当前全部业务源（响应式：注册后自动失效）。
 *
 * <p>必须基于它而不是模块求值期的静态数组——各 {@code pages} 模块是在
 * {@code main.ts → mount()} 期间注册的，晚于本文件求值。</p>
 */
export const paletteSources = computed<PaletteSource[]>(() => {
  version.value; // 建立响应式依赖
  return [...sources.values()];
});

/**
 * 构造一个「app 级贡献」，供 {@code createContextApp().widgets(...)} 接线。
 *
 * <p>与 {@code @repo/theme/koi/views/home/registry} 的
 * {@code defineWidgetContribution} 同一套路：{@code @repo/app} 刻意不反向依赖
 * 本主题，只认结构最小的 {@code AppContribution}（namespace + register）；
 * 本函数把业务源列表适配成它，由 app 在 mount() 时按顺序执行一次。</p>
 *
 * @param list 本应用贡献的业务源列表
 * @returns 可交给 app 构建器的贡献对象
 */
export function definePaletteContribution(
  list: readonly PaletteSource[],
): { namespace: string; register: () => void } {
  return {
    namespace: "command-palette-sources",
    register: () => {
      for (const source of list) registerPaletteSource(source);
    },
  };
}