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

/**
 * 提供商接入凭据（厂商自定义的 AK/SK 等）。
 *
 * 同一 (厂商, 平台类型) 可登记多套，如多个海康账号分属不同区域；
 * 每厂商至多一套 isDefault，厂商级离线阈值取默认套的阈值。
 */
export interface ProviderCredential {
  deviceCredentialId?: string
  deviceCredentialVendor: string
  /** 平台类型；SDK 直连为空串 */
  deviceCredentialPlatformType?: string
  /** 凭据名称，同厂商同平台下唯一 */
  deviceCredentialName: string
  deviceCredentialAppKey?: string
  deviceCredentialAppSecret?: string
  /** 平台 endpoint 覆盖，留空用内置默认 */
  deviceCredentialBaseUrl?: string
  deviceCredentialOfflineThreshold?: number
  deviceCredentialIsDefault?: boolean
  deviceCredentialEnabled?: boolean
  deviceCredentialRemark?: string
  deviceCredentialCreatedAt?: string
  deviceCredentialUpdatedAt?: string
}
