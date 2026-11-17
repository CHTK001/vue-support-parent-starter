/**
 * 大屏注册表 —— **全仓唯一事实来源**
 *
 * <p>仿 {@code @repo/monitor-cards} 的注册表：元数据与渲染入口写在同一条注册项里，
 * 避免「目录一份、渲染一份」的双写漂移。注册表<b>运行时可扩展</b>：各
 * {@code pages/xx} 模块可通过 {@link defineBigScreenContribution} 贡献自己的大屏
 * （或给内置屏换肤/换数据），无需改动本文件。内置七屏在 {@code ./builtin.ts}
 * 模块求值时自注册。</p>
 *
 * <p><b>为什么注册表在本模块里</b>：它是宿主与贡献方的共同语言，按依赖方向必须
 * 低于双方；放某个业务包会逼其他包反向依赖。</p>
 *
 * @since 4.0.0.52
 */
import { computed, shallowRef } from "vue";
import type {
  BigScreenCatalogItem,
  BigScreenContribution,
  BigScreenRegistration,
} from "./types";

/** 注册表：id → 注册项（保留插入顺序，决定画廊视觉顺序） */
const registry = new Map<string, BigScreenRegistration>();

/** 版本号：每次注册变更 +1，供 computed 建立响应式依赖 */
const version = shallowRef(0);

/**
 * 注册一批大屏。
 *
 * <p>内置七屏在 {@code ./builtin.ts} 模块求值时自注册；各 {@code pages/xx} 模块
 * 可在自身入口追加。幂等：同 id 重复注册以<b>最后一次</b>为准（便于覆盖换肤），
 * 开发环境打印覆盖警告。</p>
 *
 * @param list 待注册的大屏列表
 */
export function registerBigScreens(list: readonly BigScreenRegistration[]): void {
  for (const reg of list) {
    if (typeof reg?.id !== "string" || reg.id.trim() === "") {
      console.error("[bigscreen-registry] 忽略缺少 id 的注册项：", reg);
      continue;
    }
    if (!reg.document && !reg.component) {
      console.error(`[bigscreen-registry] 大屏 "${reg.id}" 缺少 document / component 渲染入口`);
      continue;
    }
    const prev = registry.get(reg.id);
    if (prev && import.meta.env?.DEV) {
      console.warn(
        `[bigscreen-registry] 大屏 "${reg.id}" 被覆盖（来源：${prev.source ?? "内置"} → ${reg.source ?? "未声明"}）`,
      );
    }
    registry.set(reg.id, reg);
  }
  version.value += 1;
}

/** 按 id 取注册项；未注册返回 undefined */
export function getBigScreenRegistration(id: string): BigScreenRegistration | undefined {
  return registry.get(id);
}

/** 该 id 在当前应用是否已注册 */
export function isBigScreenRegistered(id: string): boolean {
  return registry.has(id);
}

/** 全部注册项（含渲染入口，顺序即画廊顺序） */
export function getBigScreenRegistrations(): readonly BigScreenRegistration[] {
  version.value; // 建立响应式依赖
  return [...registry.values()];
}

/** 目录元数据（剥离渲染入口） */
export function getBigScreenCatalog(): BigScreenCatalogItem[] {
  version.value; // 建立响应式依赖
  return [...registry.values()].map(({ document: _d, component: _c, source: _s, ...meta }) => meta);
}

/**
 * 响应式目录：注册变化时自动失效。画廊应基于它而不是模块求值期固定的静态数组。
 */
export const bigScreenCatalog = computed<BigScreenCatalogItem[]>(() => getBigScreenCatalog());

/**
 * 构造「app 级贡献」的便捷包装（与 monitor-cards 的 defineMonitorCardContribution 同构）：
 * {@code @repo/app} 只认结构最小的 AppContribution（namespace + register），
 * 本函数把大屏列表适配成它，模块不用关心接线细节。
 *
 * @param list 本模块贡献的大屏列表
 */
export function defineBigScreenContribution(list: readonly BigScreenRegistration[]): BigScreenContribution {
  return {
    namespace: "bigscreen",
    register: () => registerBigScreens(list),
  };
}
