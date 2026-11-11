/**
 * 设备能力判定
 *
 * <p>同一份设备台账里混着摄像头、门禁、报警主机、对讲和厂商同步回来的未知类型，
 * 详情页不应该对所有设备都摊开「视频 / 云台 / 门禁」八个页签：谁能做什么，
 * 由厂商能力位（`DeviceVendorDescriptor.capabilities`）加设备大类一起决定。</p>
 *
 * <p>能力位来自后端 SPI（DEVICE / CHANNEL / MEDIA / PTZ / EVENT / ACCESS / ORG / METRIC / PARKING），
 * 厂商没接入能力位时退回按大类推断，保证本地手工录入的设备也有合理页签。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */

import type {
  DeviceCapability,
  DeviceInfo,
  DeviceVendorDescriptor
} from '../types/device'

/** 详情页的页签键 */
export type DeviceDetailTabKey =
  | 'overview'
  | 'map'
  | 'channel'
  | 'video'
  | 'ptz'
  | 'access'
  | 'events'
  | 'metrics'

/** 一台设备的可用能力位（厂商没登记能力位时按大类兜底） */
export function deviceCapabilities(
  device: DeviceInfo | null | undefined,
  vendors: DeviceVendorDescriptor[] = []
): Set<DeviceCapability> {
  if (!device) return new Set()
  const declared = vendors.find((item) => item.vendor === device.deviceInfoVendor)?.capabilities
  if (declared?.length) return new Set(declared)

  // 厂商未声明能力位：按大类推断，避免本地设备什么都点不开
  const fallback: DeviceCapability[] = ['DEVICE']
  if ((device.deviceInfoChannelCount || 0) > 0) fallback.push('CHANNEL')
  switch (device.deviceInfoCategory) {
    case 'camera':
      fallback.push('CHANNEL', 'MEDIA', 'PTZ', 'EVENT')
      break
    case 'intercom':
      fallback.push('CHANNEL', 'MEDIA', 'EVENT', 'ACCESS')
      break
    case 'accessControl':
      fallback.push('ACCESS', 'EVENT')
      break
    case 'alarm':
      fallback.push('EVENT')
      break
    default:
      break
  }
  return new Set(fallback)
}

/** 能出实时画面？（视频页签 / 播放页签 / 大屏拖拽都看它） */
export function isPlayable(
  device: DeviceInfo | null | undefined,
  vendors: DeviceVendorDescriptor[] = []
): boolean {
  if (!device) return false
  const caps = deviceCapabilities(device, vendors)
  if (caps.has('MEDIA') || caps.has('CHANNEL')) return true
  return device.deviceInfoCategory === 'camera' || device.deviceInfoCategory === 'intercom'
}

/**
 * 详情页要显示哪些页签。
 *
 * <p>概览永远在；地图看有没有坐标；其余按能力位 + 大类收口，
 * 门禁设备不会出现「云台」，报警主机不会出现「视频」。</p>
 *
 * @param device  设备
 * @param vendors 厂商描述符（提供能力位）
 */
export function detailTabKeys(
  device: DeviceInfo | null | undefined,
  vendors: DeviceVendorDescriptor[] = []
): DeviceDetailTabKey[] {
  if (!device) return ['overview']
  const caps = deviceCapabilities(device, vendors)
  const keys: DeviceDetailTabKey[] = ['overview']
  const hasCoord =
    typeof device.deviceInfoLatitude === 'number' && typeof device.deviceInfoLongitude === 'number'
  if (hasCoord) keys.push('map')
  if (caps.has('CHANNEL') || (device.deviceInfoChannelCount || 0) > 0) keys.push('channel')
  if (caps.has('MEDIA')) keys.push('video')
  if (caps.has('PTZ')) keys.push('ptz')
  if (caps.has('ACCESS') || device.deviceInfoCategory === 'accessControl') keys.push('access')
  if (caps.has('EVENT') || device.deviceInfoCategory === 'alarm') keys.push('events')
  // 气象/环境传感器：能力位优先，旧厂商描述符没有 METRIC 时按小类兜底
  if (
    caps.has('METRIC') ||
    ['weather', 'temperatureHumidity', 'waterQuality', 'soil'].includes(
      device.deviceInfoSubCategory || ''
    )
  ) {
    keys.push('metrics')
  }
  return keys
}

/** 详情页签文案 */
export const DETAIL_TAB_LABELS: Record<DeviceDetailTabKey, string> = {
  overview: '概览',
  map: '地图',
  channel: '通道',
  video: '视频',
  ptz: '云台',
  access: '门禁',
  events: '事件',
  metrics: '指标'
}
