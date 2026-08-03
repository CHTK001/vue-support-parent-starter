/**
 * 设备领域模型
 *
 * @author CH
 * @since 4.0.0.42
 */

export type DeviceCategory = 'camera' | 'accessControl' | 'alarm' | 'intercom'

export interface DeviceInfo {
  deviceInfoId: string
  deviceInfoOrgId: string
  deviceInfoName: string
  deviceInfoVendor: string
  deviceInfoModel: string
  deviceInfoCategory: DeviceCategory
  deviceInfoSubCategory: string
  deviceInfoIp: string
  deviceInfoPort: number
  deviceInfoUsername?: string
  deviceInfoOnline: boolean
  deviceInfoSerial?: string
  deviceInfoFirmware?: string
  deviceInfoChannelCount?: number
  deviceInfoLatitude?: number
  deviceInfoLongitude?: number
  deviceInfoAddress?: string
  deviceInfoOfflineThreshold?: number
  deviceInfoCreatedAt?: string
  channels?: DeviceChannel[]
  doors?: DeviceDoor[]
}

export interface DeviceChannel {
  deviceChannelId: string
  deviceChannelDeviceId: string
  deviceChannelNo: number
  deviceChannelName: string
  deviceChannelType: string
  deviceChannelStatus: string
  deviceChannelSort: number
}

export interface DeviceDoor {
  deviceDoorNo: number
  deviceDoorName: string
  deviceDoorStatus: string
}

export interface OrgNode {
  deviceOrganizationId: string
  deviceOrganizationName: string
  children?: OrgNode[]
}

export interface TimelineItem {
  id: string
  time: string
  type: 'primary' | 'success' | 'warning' | 'danger'
  content: string
}

export interface Preset {
  devicePresetNo: number
  devicePresetName: string
}

export interface AccessEvent {
  time: string
  doorName: string
  eventType: string
  cardNo: string
  userName?: string
}

export interface DeviceEvent {
  deviceEventRecordId?: string
  deviceEventRecordDeviceId?: string
  deviceEventRecordChannelNo?: number
  deviceEventRecordEventType?: string
  deviceEventRecordDetail?: string
  deviceEventRecordOccurredAt?: string
}
