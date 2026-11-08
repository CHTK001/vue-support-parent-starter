/**
 * 设备资产展示格式化工具
 *
 * 统一列表/详情中的时间、坐标、状态文案与外链，避免各页面各写一套。
 *
 * @author CH
 * @since 4.0.0.42
 */

import type { DeviceInfo, DeviceStatus, OrgNode } from '@pages/device/src/types/device'

/**
 * 解析后端时间（兼容 `yyyy-MM-dd HH:mm:ss` 与 ISO）
 *
 * @param value 时间
 */
export function parseDate(value?: string | Date | null): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const normalized = String(value).trim().replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

/** 补零 */
function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/**
 * 格式化为 `yyyy-MM-dd HH:mm`
 *
 * @param value 时间
 */
export function formatDateTime(value?: string | Date | null): string {
  const date = parseDate(value)
  if (!date) return '-'
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * 格式化为 `yyyy-MM-dd HH:mm:ss`（详情提示用）
 *
 * @param value 时间
 */
export function formatDateTimeFull(value?: string | Date | null): string {
  const date = parseDate(value)
  if (!date) return '-'
  return `${formatDateTime(date)}:${pad(date.getSeconds())}`
}

/**
 * 相对时间：刚刚 / N 分钟前 / N 小时前 / N 天前 / 日期
 *
 * @param value 时间
 */
export function formatRelative(value?: string | Date | null): string {
  const date = parseDate(value)
  if (!date) return '-'
  const diff = Date.now() - date.getTime()
  if (diff < 0) return formatDateTime(date)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return formatDateTime(date)
}

/**
 * 坐标是否有效
 *
 * @param device 设备
 */
/**
 * 判断日期是否在今天起算的 N 天内（到期前提醒）
 *
 * @param value 日期，null 返回 false
 * @param days 距今天的天数，默认 90
 */
export function dateBefore(value?: string | Date | null, days = 90): boolean {
  const date = parseDate(value)
  if (!date) return false
  const today = new Date(new Date().toISOString().slice(0, 10))
  if (date < today) return true // 已过期
  const limit = new Date(today)
  limit.setDate(limit.getDate() + days)
  return date <= limit
}

export function hasLocation<T extends { deviceInfoLatitude?: number; deviceInfoLongitude?: number }>(
  device?: T | null
): boolean {
  const lat = device?.deviceInfoLatitude
  const lng = device?.deviceInfoLongitude
  return typeof lat === 'number' && typeof lng === 'number' && lat !== 0 && lng !== 0
}

/**
 * 坐标文案：纬度, 经度（保留 6 位）
 *
 * @param lat 纬度
 * @param lng 经度
 */
export function formatCoord(lat?: number, lng?: number): string {
  if (typeof lat !== 'number' || typeof lng !== 'number' || lat === 0 || lng === 0) return '-'
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

/**
 * 外部地图链接
 *
 * <p>后端统一使用 WGS84；高德 URI 显式声明 `coordinate=wgs84`，由高德自行转换，
 * 避免把 WGS84 直接当 GCJ02 使用造成几百米偏移。</p>
 *
 * @param device 设备
 */
export function mapLinks(device: DeviceInfo): { label: string; url: string }[] {
  if (!hasLocation(device)) return []
  const lat = device.deviceInfoLatitude as number
  const lng = device.deviceInfoLongitude as number
  const name = encodeURIComponent(device.deviceInfoName || '设备位置')
  return [
    {
      label: '高德地图',
      url: `https://uri.amap.com/marker?position=${lng},${lat}&coordinate=wgs84&name=${name}&src=device-asset&callnative=1`
    },
    {
      label: 'Google Maps',
      url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    }
  ]
}

/**
 * 复制文本，兼容非安全上下文
 *
 * @param text 文本
 */
export async function copyText(text?: string | null): Promise<boolean> {
  if (!text) return false
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // 回退到 execCommand
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

/** 设备状态下拉选项 */
export const DEVICE_STATUS_OPTIONS: { label: string; value: DeviceStatus }[] = [
  { label: '正常', value: 'normal' },
  { label: '停用', value: 'disabled' },
  { label: '维护', value: 'maintenance' },
  { label: '报废', value: 'scrapped' }
]

/**
 * 设备状态展示元数据
 *
 * @param status 状态
 */
export function statusMeta(status?: string): {
  label: string
  type: 'success' | 'info' | 'warning' | 'danger'
} {
  switch (status) {
    case 'disabled':
      return { label: '停用', type: 'info' }
    case 'maintenance':
      return { label: '维护', type: 'warning' }
    case 'scrapped':
      return { label: '报废', type: 'danger' }
    case 'normal':
    default:
      return { label: '正常', type: 'success' }
  }
}

/**
 * 来源文案
 *
 * @param source 来源
 */
export function sourceLabel(source?: string): string {
  return source === 'vendor' ? '厂商同步' : '手工录入'
}

/**
 * 负责人展示
 *
 * @param device 设备
 */
export function ownerText(device: DeviceInfo): string {
  return device.deviceInfoOwnerName || '未分配'
}

/**
 * 负责人副行（部门 · 电话）
 *
 * @param device 设备
 */
export function ownerSubText(device: DeviceInfo): string {
  const parts = [device.deviceInfoOwnerDept, device.deviceInfoOwnerPhone].filter(Boolean)
  return parts.join(' · ')
}

/**
 * 在线状态文案
 *
 * @param online 是否在线
 */
export function onlineLabel(online?: boolean): string {
  return online ? '在线' : '离线'
}

/**
 * 把后端扁平组织列表组装成树
 *
 * <p>后端 `GET /org/tree` 返回的是带 parentId 的扁平列表（便于按厂商过滤与增量更新），
 * 前端统一在展示层组装，避免后端为每个厂商维护递归结构。</p>
 *
 * @param list 扁平组织列表
 * @returns 根节点列表
 */
export function buildOrgTree(list?: OrgNode[] | null): OrgNode[] {
  if (!list?.length) return []
  // 接口可能已返回带 children 的树，也可能返回扁平列表：先统一拍平再按 parentId 组装
  const flat: OrgNode[] = []
  const flatten = (nodes: OrgNode[]): void => {
    for (const node of nodes) {
      flat.push({ ...node, children: undefined })
      if (node.children?.length) flatten(node.children)
    }
  }
  flatten(list)
  const map = new Map<string, OrgNode>()
  for (const item of flat) {
    map.set(item.deviceOrganizationId, { ...item, children: [] })
  }
  const roots: OrgNode[] = []
  for (const item of flat) {
    const node = map.get(item.deviceOrganizationId) as OrgNode
    const parent = item.deviceOrganizationParentId
      ? map.get(item.deviceOrganizationParentId)
      : undefined
    if (parent) {
      parent.children = parent.children || []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }
  const sortNodes = (nodes: OrgNode[]) => {
    nodes.sort((a, b) => (a.deviceOrganizationSort ?? 0) - (b.deviceOrganizationSort ?? 0))
    nodes.forEach((n) => n.children?.length && sortNodes(n.children))
  }
  sortNodes(roots)
  return roots
}
