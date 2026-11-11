/**
 * 设备类别常量与工具
 *
 * 大类只有摄像头 / 门禁 / 报警 / 对讲四类；后端早期数据里可能带 `other`
 * （以及厂商同步回来的未知类型），统一落到「其他」，避免界面上直接冒英文。
 *
 * @author CH
 * @since 4.0.0.42
 */

import type { DeviceCategory } from '../types/device'

export const CATEGORY_LABELS: Record<DeviceCategory, string> = {
  camera: '摄像头',
  accessControl: '门禁',
  alarm: '报警',
  intercom: '对讲',
  other: '其他'
}

/** 大类选项（表单下拉 / 筛选共用） */
export const CATEGORY_OPTIONS: Array<{ label: string; value: DeviceCategory }> = [
  { label: '摄像头', value: 'camera' },
  { label: '门禁', value: 'accessControl' },
  { label: '报警', value: 'alarm' },
  { label: '对讲', value: 'intercom' },
  { label: '其他', value: 'other' }
]

/**
 * 大类图标（ReIcon 名称）。
 *
 * 列表的「设备」列按类型换图标，一眼能分清摄像头 / 门禁 / 报警 / 对讲；
 * 未知大类（含 `other`）用 Grid 兜底。
 *
 * @param category 大类
 */
export function getCategoryIcon(category?: string): string {
  switch (category) {
    case 'camera':
      return 'VideoCamera'
    case 'accessControl':
      return 'Lock'
    case 'alarm':
      return 'Bell'
    case 'intercom':
      return 'Microphone'
    default:
      return 'Grid'
  }
}

export const SUB_CATEGORY_OPTIONS: Record<DeviceCategory, { label: string; value: string }[]> = {
  camera: [
    { label: '枪机', value: 'bullet' },
    { label: '球机', value: 'dome' },
    { label: '云台', value: 'ptz' },
    { label: '半球', value: 'hemisphere' }
  ],
  accessControl: [
    { label: '读卡器', value: 'cardReader' },
    { label: '指纹', value: 'fingerprint' },
    { label: '人脸', value: 'face' },
    { label: '密码键盘', value: 'keypad' }
  ],
  alarm: [
    { label: '烟感', value: 'smoke' },
    { label: '红外', value: 'infrared' },
    { label: '紧急按钮', value: 'panicButton' }
  ],
  intercom: [
    { label: '门口机', value: 'doorStation' },
    { label: '室内机', value: 'indoorStation' }
  ],
  other: [
    { label: '温湿度', value: 'temperatureHumidity' },
    { label: '气象', value: 'weather' },
    { label: '水质', value: 'waterQuality' },
    { label: '土壤', value: 'soil' },
    { label: '继电器', value: 'relay' }
  ]
}

export function getCategoryLabel(category: string): string {
  if (!category) return '其他'
  const label = CATEGORY_LABELS[category as DeviceCategory]
  // 未知大类统一显示「其他」，不再把英文枚举值直接抛给用户
  return label || '其他'
}

export function getSubCategoryOptions(category: string): { label: string; value: string }[] {
  return SUB_CATEGORY_OPTIONS[category as DeviceCategory] || []
}
