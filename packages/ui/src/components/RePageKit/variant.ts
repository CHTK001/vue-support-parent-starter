/**
 * 页面方向（Page Variant）—— 纯数据与纯函数，无 Vue、无 Storage 依赖。
 *
 * <p>背景：服务端 / 监控端有一批同构的管理页（会话审计、批量作业、片段管理、
 * 维护计划、ACME 证书、抓包分析、PCAP 分析）。它们的活儿一样（筛选 → 找一条 → 操作），
 * 但各自手写了一套页面壳：有的手搓卡片+统计+分段+筛选四件套，有的用带投影的 .ex-card
 * （违反 koi「卡片静止态不加投影」），有的混用 el-input + 自定义 .filter-bar。</p>
 *
 * <p>本模块把「页面怎么排」抽成 5 个方向。方向不是配色，是**对页面用途的判断**：
 * 同一份数据，吞吐优先和深度优先排出来的东西完全不同。页面按自己的数据形状
 * 开放其中若干方向，用户逐页挑选，选择按页持久化。</p>
 *
 * <p>为什么纯函数：{@link normalizeVariant} 要处理「存的旧值已不在允许集里」
 * 这种必然发生的迁移情况（页面改版后收窄方向），逻辑必须能被单测覆盖，
 * 所以 Storage 以参数注入，而不是在函数里直接摸 localStorage。</p>
 */

/** 方向标识 */
export type PageVariantId = 'console' | 'dossier' | 'rhythm' | 'wall' | 'instrument'

/** 方向元数据 */
export interface PageVariantMeta {
  /** 方向标识 */
  id: PageVariantId
  /** 切换器上的短名（2~3 字，避免挤开页面操作区） */
  label: string
  /** 一句话判断：这个方向把页面当成什么。同时作为按钮 title */
  thesis: string
}

/**
 * 五个方向，顺序即切换器顺序。
 *
 * <p>顺序有意为之：console 与 instrument 是「行/数字」视角，dossier 与 wall 是
 * 「一件东西」视角，rhythm 是「时间」视角。中间放 rhythm，两边各两个，
 * 这样用户按左右切换时，感受到的是视角在渐变而不是随机跳。</p>
 */
export const PAGE_VARIANTS: readonly PageVariantMeta[] = [
  { id: 'console', label: '工单台', thesis: '吞吐优先：统计并入控制栏，表格独占剩余高度' },
  { id: 'instrument', label: '仪表', thesis: '聚合优先：遥测与图表在上，明细被压到最紧凑' },
  { id: 'rhythm', label: '节奏', thesis: '时间优先：数据本身有起止就画在轴上，列表退为次选' },
  { id: 'dossier', label: '档案柜', thesis: '深度优先：左栏列表常驻，右栏详情常驻，不用点开抽屉' },
  { id: 'wall', label: '卡片墙', thesis: '内容优先：载荷直接读得到，不靠悬停也不靠详情页' },
]

/** 无任何偏好时的兜底方向 */
export const DEFAULT_PAGE_VARIANT: PageVariantId = 'console'

/** 持久化键前缀；按页面区分，各自独立记忆 */
export const PAGE_VARIANT_STORAGE_PREFIX = 're-page-variant:'

/** 方向坞是否强制显示的开关键（生产环境用 ?ui=1 打开） */
export const PAGE_VARIANT_DOCK_PARAM = 'ui'

/** 仅取 getItem 的最小存储接口，便于单测注入 */
export interface VariantReadStorage {
  getItem(key: string): string | null
}

/** 仅取 setItem 的最小存储接口，便于单测注入 */
export interface VariantWriteStorage {
  setItem(key: string, value: string): void
}

/**
 * 页面选择在 localStorage 里的键。
 *
 * @param pageKey 页面标识（如 `server.session-audit`）
 */
export function variantStorageKey(pageKey: string): string {
  return `${PAGE_VARIANT_STORAGE_PREFIX}${pageKey}`
}

/**
 * 按允许集求兜底方向：取允许集的第一个；允许集为空则用全局默认。
 *
 * <p>不允许为空时返回用户传入顺序的第一项，而不是 {@link DEFAULT_PAGE_VARIANT}：
 * 页面收窄方向后（例如报文页不再提供 rhythm），应当落到该页声明的首选方向，
 * 而不是落到一个它根本不提供的方向。</p>
 *
 * @param allowed 该页开放的方向
 */
export function defaultVariantFor(allowed?: readonly PageVariantId[] | null): PageVariantId {
  if (allowed && allowed.length > 0) return allowed[0]!
  return DEFAULT_PAGE_VARIANT
}

/**
 * 把任意来源的值收敛成一个该页可用的方向。
 *
 * <p>三种情况都会兜底：值不是已知方向（历史遗留 / 手改 localStorage）、
 * 值是已知方向但该页不开放（页面改版收窄）、值缺失。</p>
 *
 * @param raw     原始值
 * @param allowed 该页开放的方向；不传表示全部开放
 */
export function normalizeVariant(
  raw: unknown,
  allowed?: readonly PageVariantId[] | null,
): PageVariantId {
  const value = typeof raw === 'string' ? raw.trim() : ''
  const list = allowed && allowed.length > 0 ? allowed : PAGE_VARIANTS.map(v => v.id)
  if (value && (list as readonly string[]).includes(value)) return value as PageVariantId
  return defaultVariantFor(allowed)
}

/**
 * 读取该页已保存的方向；存储不可用（隐私模式 / SSR / 抛异常）时返回兜底。
 *
 * @param pageKey 页面标识
 * @param allowed 该页开放的方向
 * @param storage 存储实现；传 null 表示无存储
 */
export function readVariant(
  pageKey: string,
  allowed?: readonly PageVariantId[] | null,
  storage?: VariantReadStorage | null,
): PageVariantId {
  if (!storage) return defaultVariantFor(allowed)
  try {
    return normalizeVariant(storage.getItem(variantStorageKey(pageKey)), allowed)
  } catch {
    return defaultVariantFor(allowed)
  }
}

/**
 * 保存该页方向；写入失败静默（无痕模式 quota 超限不该打断页面）。
 *
 * @param pageKey 页面标识
 * @param variant 方向
 * @param storage 存储实现；传 null 表示无存储
 */
export function writeVariant(
  pageKey: string,
  variant: PageVariantId,
  storage?: VariantWriteStorage | null,
): void {
  if (!storage) return
  try {
    storage.setItem(variantStorageKey(pageKey), variant)
  } catch {
    /* 忽略：无痕模式 / 配额超限 */
  }
}

/**
 * 按允许集过滤出切换器要显示的项，保持 {@link PAGE_VARIANTS} 的声明顺序。
 *
 * @param allowed 该页开放的方向；不传表示全部开放
 */
export function variantItems(allowed?: readonly PageVariantId[] | null): PageVariantMeta[] {
  if (!allowed || allowed.length === 0) return [...PAGE_VARIANTS]
  return PAGE_VARIANTS.filter(v => allowed.includes(v.id))
}

/**
 * 当前是否有权显示方向坞。
 *
 * <p>开发环境恒显示；生产环境需显式带 `?ui=1`。选中的方向无论如何都会生效并持久化，
 * 所以生产里藏起坞不等于丢掉用户的选择。</p>
 *
 * @param dev      是否开发环境
 * @param search   当前地址栏 query（含前导 ?）
 */
export function shouldShowDock(dev: boolean, search: string): boolean {
  if (dev) return true
  const q = String(search ?? '')
  if (!q) return false
  const params = new URLSearchParams(q.startsWith('?') ? q.slice(1) : q)
  const flag = params.get(PAGE_VARIANT_DOCK_PARAM)
  return flag === '1' || flag === 'true'
}
