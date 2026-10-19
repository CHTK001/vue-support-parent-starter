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
  /** 进出方向原始值（进 / 出 / in / out…；厂商未回传时为空） */
  direction?: string
  /** 抓拍照片地址；厂商没抓拍或未回传时为空 */
  photoUrl?: string
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
 * 设备可以来自多套凭据，没有「默认套」，离线阈值按套生效。
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
  /** 云曜产品编码（ProductCode），云曜平台必填 */
  deviceCredentialProductCode?: string
  /** 云曜项目 ID（ProjectID），云曜平台必填 */
  deviceCredentialProjectId?: string
  /** 平台 endpoint 覆盖，留空用内置默认 */
  deviceCredentialBaseUrl?: string
  deviceCredentialOfflineThreshold?: number
  /** 后端保留字段，UI 不再使用（不需要默认套） */
  deviceCredentialIsDefault?: boolean
  deviceCredentialEnabled?: boolean
  deviceCredentialRemark?: string
  deviceCredentialCreatedAt?: string
  deviceCredentialUpdatedAt?: string
}

/** 后端分页结果（spring-support-mybatis 的 PageResult） */
export interface PageResult<T> {
  pageNo: number
  pageSize: number
  total: number
  totalPage: number
  records: T[]
}

