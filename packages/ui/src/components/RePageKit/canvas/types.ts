/**
 * 页面画布（Canvas）—— 五个方向的通用件类型定义。
 *
 * <p>为什么是「通用画布 + 页面提供规格」而不是「每页五个手写画布」：
 * 七个管理页 × 五个方向 = 35 个画布。若每个都手写，同一个方向在两页里会长出
 * 两套行为（一个有键盘可达、一个没有；一个空态有引导语、一个只写「暂无数据」）。
 * 那正是这次重构要消灭的东西 —— 重构前七个页面各有四种页面壳。</p>
 *
 * <p>边界：画布只负责「怎么排」，页面通过具名插槽提供「排什么」。
 * 任何与业务字段有关的渲染都在页面的插槽里，画布不认识业务字段。</p>
 */

/** 状态分段项（带计数） */
export interface TabItem {
  /** 段值，与页面筛选条件里的字段值对应 */
  value: string
  /** 段名 */
  label: string
  /** 计数；不给则不显示数字 */
  count?: number
}

/** 筛选项类型 */
export type FilterKind = 'search' | 'select' | 'text'

/** 控制栏里的一个筛选项 */
export interface FilterField {
  /** 字段名，对应页面筛选模型里的键 */
  key: string
  /** 控件类型 */
  kind: FilterKind
  /** 占位文案 */
  placeholder?: string
  /** 下拉选项；kind === 'select' 时必填 */
  options?: Array<{ label: string; value: string }>
  /** 控件宽度（px），默认 search 190 / text 130 / select 104 */
  width?: number
}

/** 遥测条的一个格子 */
export interface StatCell {
  /** 口径名 */
  label: string
  /** 数值文本（已格式化，画布不再加工） */
  value: string | number
  /** 强调色档：hot 成功色 / warn 警告色 / bad 危险色；不给为常规 */
  tone?: 'hot' | 'warn' | 'bad'
}

/** 时间带上的一根条 */
export interface BandItem {
  /** 唯一键 */
  key: string | number
  /** 左偏移百分比 0~100 */
  left: number
  /** 宽度百分比 0~100 */
  width: number
  /** 距轴顶的像素偏移，用于分道 */
  top: number
  /** 条的颜色 */
  color: string
  /** 悬停提示 */
  title?: string
}

/** 表格列定义 */
export interface CanvasColumn {  /** 列键。具名插槽名为 `cell-<key>` */
  key: string
  /** 表头文案 */
  label: string
  /** 网格列宽（CSS grid 轨道，如 `56px` / `minmax(0, 1.4fr)`） */
  width: string
  /** 对齐 */
  align?: 'left' | 'right' | 'center'
}

/** 表格行取值时的最小约束：必须能取到唯一键 */
export interface Keyed {
  [key: string]: unknown
}

/** 分栏左栏里的一个分组（分组依据由页面决定） */
export interface CanvasGroup {
  /** 分组键 */
  key: string
  /** 分组抬头文案 */
  label: string
  /** 组内行 */
  rows: Keyed[]
}

/**
 * 列宽数组拼成 grid-template-columns。
 *
 * @param columns 列定义
 */
export function gridTemplate(columns: readonly CanvasColumn[]): string {
  return columns.map(c => c.width).join(' ')
}

/**
 * 由列宽推算表格最小宽度，用于窄屏横滚。
 *
 * <p>只把明确写了像素宽度的列加起来，`fr` / `minmax` 视为可压缩不加；
 * 再加一个下限，避免只有一列 `fr` 时最小宽度为 0 而让 grid 塌成不可读。</p>
 *
 * @param columns 列定义
 */
export function minTableWidth(columns: readonly CanvasColumn[]): number {
  let px = 0
  for (const c of columns) {
    const m = /^(\d+)px$/.exec(c.width.trim())
    if (m) px += Number(m[1])
  }
  // 列间距（10px × (n-1)）与左右内边距（12px × 2）也要算进去
  px += Math.max(columns.length - 1, 0) * 10 + 24
  return Math.max(px, 360)
}

/**
 * 安全取行内某列的展示值。
 *
 * @param row  行
 * @param key  列键
 */
export function cellValue(row: unknown, key: string): unknown {
  if (!row || typeof row !== 'object') return ''
  return (row as Record<string, unknown>)[key]
}

/**
 * 把行内某列的值降级成可显示的文本。
 *
 * <p>只处理原始类型；对象/数组一律给空串 —— 那种列必须由页面用插槽自己渲染，
 * 画布不猜用户想看到 `[object Object]` 还是 JSON。</p>
 *
 * @param row 行
 * @param key 列键
 */
export function cellText(row: unknown, key: string): string {
  const v = cellValue(row, key)
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return ''
}
