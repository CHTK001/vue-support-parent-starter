/**
 * 门禁记录方向归一
 *
 * 门禁记录天生带方向（进 / 出），但厂商回传的取值不统一：
 * 有 in/out、进门/出门，也有设备侧的编号原值。这里只归一成三档，
 * 认不出的原值照样展示（`label` 回显原值），避免把方向丢掉。
 *
 * 方向口径只此一处：门禁记录页与设备详情「门禁」页签共用，避免两边映射不一致。
 *
 * @author CH
 * @since 4.0.0.42
 */

/** 方向档位：进 / 出 / 未标注 */
export type DirectionKey = 'in' | 'out' | 'unknown'

/** 方向筛选项 */
export const DIRECTION_OPTIONS: Array<{ value: DirectionKey; label: string }> = [
  { value: 'in', label: '进' },
  { value: 'out', label: '出' },
  { value: 'unknown', label: '未标注' },
]

/** 判为「进」的取值（小写比较） */
const DIRECTION_IN = ['in', 'enter', 'entry', 'inside', '进', '进门', '进入', '入']

/** 判为「出」的取值（小写比较） */
const DIRECTION_OUT = ['out', 'exit', 'leave', 'outside', '出', '出门', '离开', '外出']

/** 后端统一字段名 + 各厂商原始字段名 */
const DIRECTION_KEYS = ['direction', 'doorDirection', 'inOut', 'enterOrExit', 'passDirection']

/**
 * 方向原始值 → 档位与展示文案。
 *
 * @param v 方向原始值（后端 direction 字段或厂商字段）
 * @returns key 为归一档位，label 为展示文案（未识别时回显原值，空值为「—」）
 */
export function directionOf(v: unknown): { key: DirectionKey; label: string } {
  const raw = String(v ?? '').trim()
  if (!raw) return { key: 'unknown', label: '—' }
  const lower = raw.toLowerCase()
  if (DIRECTION_IN.includes(lower)) return { key: 'in', label: '进' }
  if (DIRECTION_OUT.includes(lower)) return { key: 'out', label: '出' }
  return { key: 'unknown', label: raw }
}

/**
 * 从记录里取方向原始值：后端给 direction，兼容厂商字段名。
 *
 * @param rec 记录对象
 * @returns 方向原始值，缺失时为 ''
 */
export function rawDirection(rec: Record<string, unknown>): unknown {
  for (const key of DIRECTION_KEYS) {
    const v = rec[key]
    if (v !== undefined && v !== null && String(v) !== '') return v
  }
  return ''
}
