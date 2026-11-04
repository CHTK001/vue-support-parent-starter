/**
 * @pages/apm 地址与路由前缀。
 *
 * <p><strong>为什么前缀是 {@code /api/apm/v1}</strong>：老的观测栈
 * （{@code spring-support-hotsport-starter} + {@code @pages/hotsport}）已经占住
 * {@code /api/apm/**}；新的统一 APM 接口（{@code spring-support-apm-starter}）挂在
 * {@code /api/apm/v1/**}，两套并存互不影响，前端换模块不需要改网关。</p>
 *
 * <p>默认值与后端 {@code ApmProperties#path} 一致，部署侧可以在 app.yaml 的
 * {@code apmConfig.baseUrl} 里覆盖（例如网关给 APM 单独开了一个域名前缀）；
 * 页面内不做拼接，统一走 {@link APM_PREFIX} / {@link apmConfig}。</p>
 *
 * @since 4.0.0.51
 */
import { getConfig } from "@repo/config";

/** APM 前端配置节（app.yaml 的 `apmConfig`，类型见 `@repo/config` 的 ApmConfig） */
export interface ApmAppConfig {
  /** 是否在前端展示 APM 模块 */
  enable: boolean;
  /** 预期引擎，空串不校验 */
  engine: string;
  /** 接口前缀 */
  baseUrl: string;
  /** 状态探测缓存时长（毫秒） */
  statusTtl: number;
}

/** 缺省配置：与 `packages/config/src/shared.ts` 的 defaultAppConfig.apm 保持一致 */
const DEFAULT_APM_CONFIG: ApmAppConfig = {
  enable: true,
  engine: "",
  baseUrl: "/api/apm/v1",
  statusTtl: 15_000,
};

/**
 * 读 APM 配置。
 *
 * <p>为什么每次都读、不缓存成模块常量：配置要等 {@code bootstrapFramework()}
 * 拉完 app.yaml 才就绪，而本包的模块顶层代码会在那之前执行 ——
 * 缓存一次就会把默认值当成最终值。配置对象本身是 reactive 的，读取成本可以忽略。</p>
 */
export function apmConfig(): ApmAppConfig {
  try {
    const cfg = getConfig() as unknown as { apm?: Partial<ApmAppConfig> } | undefined;
    const merged = { ...DEFAULT_APM_CONFIG, ...(cfg?.apm ?? {}) };
    return {
      enable: merged.enable !== false,
      engine: (merged.engine || "").trim().toLowerCase(),
      baseUrl: (merged.baseUrl || DEFAULT_APM_CONFIG.baseUrl).replace(/\/+$/, ""),
      statusTtl: merged.statusTtl > 0 ? merged.statusTtl : DEFAULT_APM_CONFIG.statusTtl,
    };
  } catch {
    // 配置中心尚未初始化（例如单元测试里单独 import 本模块）
    return DEFAULT_APM_CONFIG;
  }
}

/** 统一 APM 接口前缀（嵌入与独立两种后端模式共用同一套路径） */
export function apmPrefix(): string {
  return apmConfig().baseUrl;
}

/** 静态兜底前缀：仅供常量拼接等无法延迟取值的场景 */
export const APM_PREFIX = DEFAULT_APM_CONFIG.baseUrl;

/** 页面路由根前缀：/{@code apm}/* */
export const ROUTE_PREFIX = "/apm";
