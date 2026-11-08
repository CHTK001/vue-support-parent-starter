/**
 * 设备领域模型
 *
 * @author CH
 * @since 4.0.0.42
 */

export type DeviceCategory = 'camera' | 'accessControl' | 'alarm' | 'intercom' | 'other'

/** 设备状态 */
export type DeviceStatus = 'normal' | 'disabled' | 'maintenance' | 'scrapped'

/** 设备来源 */
export type DeviceSource = 'local' | 'vendor'

export interface DeviceInfo {
  deviceInfoId: string
  deviceInfoOrgId: string
  deviceInfoName: string
  /** 设备编码（资产编号/厂商序列号），列表可复制 */
  deviceInfoCode?: string
  /** 厂商侧唯一标识，同步幂等键 */
  deviceInfoExternalId?: string
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
  /** 绑定的提供商凭据 ID */
  deviceInfoCredentialId?: string
  /** 负责人用户 ID */
  deviceInfoOwnerId?: string
  /** 负责人姓名 */
  deviceInfoOwnerName?: string
  /** 负责人部门 */
  deviceInfoOwnerDept?: string
  /** 负责人电话 */
  deviceInfoOwnerPhone?: string
  /** 来源：local 手工 / vendor 厂商同步 */
  deviceInfoSource?: DeviceSource
  /** 主码流地址 */
  deviceInfoStreamMainUrl?: string
  /** 子码流地址 */
  deviceInfoStreamSubUrl?: string
  /** 最后在线时间 */
  deviceInfoLastOnlineAt?: string
  /** 最后离线时间 */
  deviceInfoLastOfflineAt?: string
  /** 安装日期 */
  deviceInfoInstallAt?: string
  /** 维保到期 */
  deviceInfoWarrantyEnd?: string
  /** 区域/楼层 */
  deviceInfoArea?: string
  /** 标签，逗号分隔 */
  deviceInfoTags?: string
  /** 状态 */
  deviceInfoStatus?: DeviceStatus
  /** 备注 */
  deviceInfoRemark?: string
  deviceInfoCreatedAt?: string
  deviceInfoUpdatedAt?: string
  channels?: DeviceChannel[]
  doors?: DeviceDoor[]
}

/** 分页结果（与后端 PageResult 对齐） */
export interface PageResult<T> {
  data: T[]
  total: number
  pageNo: number
  pageSize: number
  totalPages: number
}

/** 轻设备索引（`/device/index` 返回的轻量行），不携带冗余字段 */
export interface DeviceIndexItem {
  deviceInfoId: string
  deviceInfoName?: string
  deviceInfoCode?: string
  deviceInfoOrgId?: string
  deviceInfoVendor?: string
  deviceInfoCategory?: DeviceCategory
  deviceInfoSubCategory?: string
  deviceInfoOnline?: boolean
  deviceInfoStatus?: DeviceStatus
  deviceInfoArea?: string
  deviceInfoTags?: string
  deviceInfoWarrantyEnd?: string
  deviceInfoLatitude?: number
  deviceInfoLongitude?: number
  deviceInfoUpdatedAt?: string
  deviceInfoInstalledAt?: string
}

/** 标签字典行（显示名 + 颜色） */
export interface DeviceTagOption {
  value: string
  label: string
  color?: string
  count?: number
}

/** 导入行（解析结果） */
export interface DeviceImportRow {
  /** 行号（从 1 开始） */
  row: number
  /** 动作 */
  action: 'create' | 'update' | 'skip' | 'error'
  /** 设备标识 */
  deviceId?: string
  /** 设备名称 */
  deviceName?: string
  /** 错误信息 */
  message?: string
}

/** 导入结果 */
export interface DeviceImportResult {
  total: number
  createCount: number
  updateCount: number
  skipCount: number
  errorCount: number
  rows: DeviceImportRow[]
}


/** 设备分页查询条件 */
export interface DevicePageQuery {
  pageNo?: number
  pageSize?: number
  keyword?: string
  orgId?: string
  vendor?: string
  category?: string
  subCategory?: string
  online?: boolean
  status?: string
  ownerId?: string
  tag?: string
  /** 所属分组 ID */
  groupId?: string
  /** 仅看未分组设备 */
  ungrouped?: boolean
  sortBy?: 'updatedAt' | 'createdAt' | 'lastOnlineAt' | 'name'
  sortOrder?: 'asc' | 'desc'
}

/** 厂商能力位（与后端 DeviceCapability 枚举名对齐） */
export type DeviceCapability =
  | 'DEVICE'
  | 'CHANNEL'
  | 'MEDIA'
  | 'PTZ'
  | 'EVENT'
  | 'ACCESS'
  | 'ORG'
  | 'PARKING'

/** 凭据字段描述 */
export interface CredentialFieldDescriptor {
  key: string
  label: string
  secret: boolean
  required: boolean
  placeholder?: string
}

/** 同步统计（created / updated / skipped） */
export interface SyncResult {
  created: number
  updated: number
  skipped: number
}

/** 厂商侧人员（同步到 device_person 表） */
export interface DevicePerson {
  devicePersonId?: string
  devicePersonName: string
  /** 职称 */
  devicePersonTitle?: string
  /** 手机 */
  devicePersonPhone?: string
  /** 邮箱 */
  devicePersonEmail?: string
  /** 厂商侧组织标识（挂接 device_organization） */
  devicePersonOrgId?: string
  devicePersonVendor: string
  /** 厂商侧人员唯一标识 */
  devicePersonExternalId: string
  devicePersonDeleted?: boolean
  devicePersonCreatedAt?: string
  devicePersonUpdatedAt?: string
}

/** 平台描述 */
export interface PlatformDescriptor {
  code: string
  name: string
  defaultBaseUrl?: string
  credentialFields: CredentialFieldDescriptor[]
}

/** 接入方式描述 */
export interface AuthTypeDescriptor {
  code: string
  name: string
  description?: string
}

/** 厂商描述符 */
export interface DeviceVendorDescriptor {
  vendor: string
  name: string
  authTypes: AuthTypeDescriptor[]
  platforms: PlatformDescriptor[]
  capabilities: DeviceCapability[]
  defaultOfflineThreshold: number
  docUrl?: string
  description?: string
}

/** 在线状态事件（设备实时通道） */
export interface DeviceStatusEvent {
  deviceId: string
  deviceName?: string
  vendor?: string
  online: boolean
  latitude?: number | string | null
  longitude?: number | string | null
  lastOnlineAt?: string
  lastOfflineAt?: string
  occurredAt?: string
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
  deviceOrganizationParentId?: string
  deviceOrganizationName: string
  deviceOrganizationPath?: string
  deviceOrganizationSort?: number
  deviceOrganizationDeleted?: boolean
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
 * 每厂商至多一个 isDefault，厂商级离线阈值取默认套的阈值。
 */
export interface ProviderCredential {
  deviceCredentialId?: string
  deviceCredentialVendor: string
  /** 平台类型；SDK 直连为空 */
  deviceCredentialPlatformType?: string
  /** 凭据名称，同厂商同平台下唯一 */
  deviceCredentialName: string
  deviceCredentialAppKey?: string
  deviceCredentialAppSecret?: string
  /** 后端返回的掩码，形如 sk-****abcd；编辑时回显，不回传明文 */
  deviceCredentialAppSecretMasked?: string
  /** 是否已配置 SK（后端不再回传明文） */
  deviceCredentialAppSecretConfigured?: boolean
  /** 平台 endpoint 覆盖，留空用内置默认 */
  deviceCredentialBaseUrl?: string
  /** 云曜产品编码（ProductCode），云曜平台必填 */
  deviceCredentialProductCode?: string
  /** 云曜项目 ID（ProjectID），云曜平台必填 */
  deviceCredentialProjectId?: string
  deviceCredentialOfflineThreshold?: number
  deviceCredentialIsDefault?: boolean
  deviceCredentialEnabled?: boolean
  deviceCredentialRemark?: string
  /** 在离线检测开关：该凭据维度的设备是否由时间轮自动探测（默认关闭） */
  deviceCredentialOfflineDetectEnabled?: boolean
  /** 在离线检测间隔（秒） */
  deviceCredentialOfflineDetectInterval?: number
  /** 设备自动同步开关：该凭据维度是否由时间轮自动拉取设备目录（默认关闭） */
  deviceCredentialDeviceSyncEnabled?: boolean
  /** 设备自动同步间隔（秒） */
  deviceCredentialDeviceSyncInterval?: number
  /** 组织自动同步开关：该凭据维度是否由时间轮自动拉取厂商侧组织树（默认关闭） */
  deviceCredentialOrgSyncEnabled?: boolean
  /** 组织自动同步间隔（秒） */
  deviceCredentialOrgSyncInterval?: number
  deviceCredentialCreatedAt?: string
  deviceCredentialUpdatedAt?: string
}

/** 机房拓扑的节点/边（与 ReRelationGraph 的节点契约对齐：{ id, label, group, type, size }） */
export interface TopologyNode {
  /** 节点 id（带层级前缀）：area:名称 / subnet:区域:网段 / device:id / channel:id */
  id: string
  /** 显示名 */
  label?: string
  /** 分组（区域名，同组同色 + 气泡集轮廓） */
  group?: string
  /** 节点形状（后端给 rect / circle，属于 ReRelationGraph 的形状白名单） */
  type: string
  /** 节点尺寸（直径） */
  size?: number
  /** 设备是否在线（设备与其他节点继承设备的通道才有；区域 / 网段为 null） */
  online?: boolean
}

/** 机房拓扑的边：起点 → 终点 */
export interface TopologyEdge {
  source: string
  target: string
  label?: string
}

/** 设备分组树节点 */
export interface DeviceGroupNode {
  groupId: string
  groupName: string
  groupParent?: string
  groupOrder?: number
  groupRemark?: string
  /** 分组直属设备数（-1 表示「未分组」占位节点，不展示） */
  deviceCount: number
  children?: DeviceGroupNode[]
}

/** 设备分组新建/更新请求 */
export interface DeviceGroupRequest {
  groupName: string
  groupParent?: string
  groupOrder?: number
  groupRemark?: string
}
