/**
 * 设备标签工具
 *
 * 提供标签的解析/序列化、显示色与常用标签池，标签存储在 `deviceInfoTags`（逗号分隔）中。
 *
 * @author CH
 * @since 4.0.0.42
 */

import type { DeviceTagOption } from '@pages/device/src/types/device'

/** 常用标签及其颜色 */
const DEFAULT_TAG_LIST: DeviceTagOption[] = [
  { value: '重点区域', label: '重点区域', color: '#f44336' },
  { value: '外围', label: '外围', color: '#ff9800' },
  { value: '室内', label: '室内', color: '#4caf50' },
  { value: '室外', label: '室外', color: '#2196f3' },
  { value: '球机', label: '球机', color: '#9c27b0' },
  { value: '枪机', label: '枪机', color: '#607d8b' },
  { value: '人脸', label: '人脸', color: '#e91e63' },
  { value: '周界', label: '周界', color: '#795548' },
  { value: '出入口', label: '出入口', color: '#00bcd4' },
  { value: '机房', label: '机房', color: '#3f51b5' },
  { value: '高空瞭望', label: '高空瞭望', color: '#cddc39' },
  { value: '维保中', label: '维保中', color: '#ff5722' },
  { value: '已上线', label: '已上线', color: '#009688' },
  { value: '待部署', label: '待部署', color: '#673ab7' },
  { value: '未知', label: '未知', color: '#607d8b' }
]

/** 标签池（已知标签） */
export const DEFAULT_DEVICE_TAGS = DEFAULT_TAG_LIST

/** 未知标签的回退色：按标签名哈希到一组预设色 */
const TAG_COLORS = ['#f44336', '#ff9800', '#4caf50', '#2196f3', '#9c27b0', '#673ab7', '#009688', '#3f51b5', '#795548', '#e91e63']

/** 吸干最普通标签，按标签名取稳定色 */
function tagColorBy(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % TAG_COLORS.length
  }
  return TAG_COLORS[hash]
}

/**
 * 解析逗号分隔的标签串
 *
 * @param raw 逗号分隔的标签，如 「重点区域, 室外」
 * @returns 去重、trim 后的标签列表
 */
export function parseTags(raw?: string): string[] {
  if (!raw) return []
  return [...new Set(raw.split(',').map((t) => t.trim()).filter(Boolean))]
}

/**
 * 把标签列表序列化为逗号分隔字符串
 *
 * @param tags 标签
 * @returns 逗号分隔的标签
 */
export function serializeTags(tags: string[]): string {
  return tags.map((t) => t.trim()).filter(Boolean).join(',')
}

/**
 * 标签展示色
 *
 * @param tag 标签
 */
export function tagColor(tag: string): string {
  const option = DEFAULT_DEVICE_TAGS.find((item) => item.value === tag)
  return option?.color ?? tagColorBy(tag)
}

/**
 * 标签可视化选项（用来筛 / 配上色）
 *
 * @param tags 标签列表
 * @returns 去重后可选标签池
 */
export function mergeTagOptions(tags: string[]): DeviceTagOption[] {
  const out: DeviceTagOption[] = []
  const map = new Map<string, string>()
  for (const tag of tags) {
    map.set(tag, tagColor(tag))
  }
  for (const [value, color] of map) {
    out.push({ value, label: value, color })
  }
  return out
}

/**
 * 统计标签：来自全部设备的原始标签串
 *
 * @param tags 原始标签串列表
 * @returns 标签 -> 出现次数
 */
export function countTags(tags: (string | undefined)[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const t of tags) {
    for (const tag of parseTags(t)) {
      out[tag] = (out[tag] || 0) + 1
    }
  }
  return out
}

/**
 * 把标签传给后端（逗号分隔）
 *
 * @param tags 标签
 */
export function formatTags(tags: string[]): string {
  return serializeTags(tags)
}
