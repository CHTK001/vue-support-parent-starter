/**
 * 业务能力注册表（@repo/core）
 *
 * 顶栏天气 / 定位 / 台风 / IP 归属地这类"后台可选增强"能力的统一登记处：
 * 一个能力 = 一个 key + 后台接口路径。新增能力只需在此登记一条，
 * 探测（backendProbe）、入口显隐（koi 顶栏）、app.yaml 配置都自动生效，
 * 不必再改任何调用点。
 *
 * 开关语义（app.yaml `other.capabilities.<key>`）：
 *   - 未配置 / true：启用。先 HEAD 探测后台接口，命中走后台，未命中回落三方；
 *   - false：停用。不发探测、不请求后台（后台没有该接口时避免每轮 404 噪音），
 *     且对应前端入口一并隐藏。
 *
 * 部署侧（app.yaml）写 false 的能力，改为在系统配置（app.yaml / 后台 default 接口）
 * 中管理，主题配置抽屉不再提供对应的业务开关。
 */
import { isCapabilityEnabled } from "@repo/config";

/** 后台天气总览接口 */
export const WEATHER_OVERVIEW_PATH = "/v2/weather/overview";

/** 后台定位解析接口（按客户端 IP / 坐标反查城市） */
export const LOCATION_RESOLVE_PATH = "/v2/location/resolve";

/** 后台活跃台风列表接口 */
export const TYPHOON_ACTIVE_PATH = "/v2/typhoon/active";

/** 后台单台风详情接口 */
export const TYPHOON_DETAIL_PATH = "/v2/typhoon/detail";

/** 后台 IP 归属地（IP 转物理地址）查询接口 */
export const IP_LOOKUP_PATH = "/v2/ip/lookup";

/** 后台汇率概览接口（最新价 / 涨跌 / 周期极值） */
export const EXCHANGE_RATE_OVERVIEW_PATH = "/v2/exchange-rate/overview";

/** 后台节假日列表接口。
 *
 * <p>取日历的年度放假安排与补班日。路径取自
 * {@code SysHolidayController}（{@code @RequestMapping("/v2/holiday")}
 * + {@code @GetMapping("/get")}）。</p>
 */
export const HOLIDAY_LIST_PATH = "/v2/holiday/get";

/**
 * 后台节假日同步接口（管理员权限，从三方同步到本地库）。
 *
 * <p>取自 {@code SysHolidayController#sync}。后台当前是返回 {@code false} 的占位实现，
 * 前端据返回值提示「尚未实现」，不静默当成功。</p>
 */
export const HOLIDAY_SYNC_PATH = "/v2/holiday/sync";

/** 业务能力登记项 */
export interface BackendCapability {
  /** 能力 key，对应 app.yaml `other.capabilities` 的键 */
  key: string;
  /** 后台接口路径（探测与请求共用） */
  path: string;
  /** 是否做启动期 HEAD 探测（列表接口探测即可覆盖同控制器的详情接口） */
  probe: boolean;
  /** 能力 i18n 前缀（主题抽屉已不再展示业务能力开关，此项仅作文档说明） */
  i18n: string;
}

/** 已登记的业务能力（顺序即抽屉展示顺序） */
export const BACKEND_CAPABILITIES: readonly BackendCapability[] = [
  { key: "weather", path: WEATHER_OVERVIEW_PATH, probe: true, i18n: "weather" },
  { key: "location", path: LOCATION_RESOLVE_PATH, probe: true, i18n: "location" },
  { key: "typhoon", path: TYPHOON_ACTIVE_PATH, probe: true, i18n: "typhoon" },
  { key: "exchangeRate", path: EXCHANGE_RATE_OVERVIEW_PATH, probe: true, i18n: "exchangeRate" },
  { key: "ipLookup", path: IP_LOOKUP_PATH, probe: false, i18n: "ipLookup" },
  // 日历节假日：探测后按年取数，失败时退回日历内置表，故与天气同一档
  { key: "holiday", path: HOLIDAY_LIST_PATH, probe: true, i18n: "holiday" },
];

/** 按 key 取能力登记项（未登记返回 null） */
export function capabilityOfKey(key: string): BackendCapability | null {
  return BACKEND_CAPABILITIES.find((item) => item.key === key) ?? null;
}

/** 按接口路径反查所属能力（未登记返回 null，表示该路径不受能力开关约束） */
export function capabilityOfPath(path: string): BackendCapability | null {
  return BACKEND_CAPABILITIES.find((item) => item.path === path) ?? null;
}

/**
 * 判断某个接口路径所属能力当前是否启用。
 *
 * 未登记能力的路径恒为启用（保持既有行为），登记过的按 app.yaml 开关判定。
 *
 * @param path 后台接口路径
 * @returns 是否允许对该路径发起后台请求
 */
export function isCapabilityPathEnabled(path: string): boolean {
  const capability = capabilityOfPath(path);
  return capability ? isCapabilityEnabled(capability.key) : true;
}
