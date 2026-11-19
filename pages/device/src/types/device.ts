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
  createTime?: string
  updateTime?: string
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
  updateTime?: string
  deviceInfoInstallAt?: string
}

/** 设备环境指标最新快照 */
export interface DeviceMetric {
  deviceMetricId: string
  deviceInfoId: string
  deviceMetricKey: string
  deviceMetricName: string
  deviceMetricValue: string
  deviceMetricUnit?: string
  deviceMetricDataTime?: string
  deviceMetricCollectedAt?: string
}

/** 时序引擎信息（plugin.device.timeseries.engine） */
export interface DeviceSeriesEngineInfo {
  engine: string
  available: boolean
  /** 不可用原因；可用时为空串 */
  reason: string
  retentionDays: number
  defaultLimit: number
  maxLimit: number
}

/**
 * 设备时序点（传感器 / 门禁 / 车闸共用）
 *
 * key / value 的口径按分类不同，见 {@code DeviceSeriesCategory} 的枚举说明。
 * time 为后端 LocalDateTime 的 ISO 文本（不带时区）。
 */
export interface DeviceSeriesPoint {
  category: string
  deviceId: string
  channel?: string | null
  key: string
  name?: string | null
  value?: string | null
  unit?: string | null
  time?: string | null
  extra?: Record<string, string>
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
  /** 组织 ID 集合（左树选中组织时连同子孙组织一起导出，优先于 orgId） */
  orgIds?: string[]
  vendor?: string
  category?: string
  subCategory?: string
  online?: boolean
  status?: string
  ownerId?: string
  tag?: string
  /** 所属分组 ID */
  groupId?: string
  /** 分组 ID 集合（左树选中分组时连同子分组一起导出，优先于 groupId） */
  groupIds?: string[]
  /** 设备 ID 集合（左树定位到单台设备时只导出该设备） */
  ids?: string[]
  /** 仅看未分组设备 */
  ungrouped?: boolean
  sortBy?: 'updateTime' | 'createTime' | 'lastOnlineAt' | 'name'
  sortOrder?: 'asc' | 'desc'
}

/** 厂商能力位（与后端 DeviceCapability 枚举名对齐，16 位全量） */
export type DeviceCapability =
  | 'DEVICE'
  | 'DEVICE_WRITE'
  | 'CHANNEL'
  | 'MEDIA'
  | 'RECORD'
  | 'PTZ'
  | 'EVENT'
  | 'ACCESS'
  | 'ACCESS_WRITE'
  | 'ORG'
  | 'ORG_WRITE'
  | 'PERSON'
  | 'PERSON_WRITE'
  | 'CAPTURE'
  | 'METRIC'
  | 'PARKING'

/**
 * 能力支持度（与后端 DeviceCapabilityMatrix.Support 对齐）。
 *
 * <p>只有 yes / implementedUnverified 会派生成平台能力位并显示功能入口；
 * todo 与 no 一律隐藏，并在能力矩阵里给出原因。</p>
 */
export type CapabilitySupport = 'YES' | 'IMPLEMENTED_UNVERIFIED' | 'TODO' | 'NO'

/** 一个能力格的标注 */
export interface CapabilityCell {
  /** 支持度 */
  support: CapabilitySupport
  /** 该能力对应的官方接口数量（0 表示不适用） */
  apiCount: number
  /** 说明：不支持写原因，待实现写依据 */
  note: string
}

/** 单个平台的能力矩阵（GET /capability/matrix 的一行） */
export interface PlatformCapabilityMatrix {
  /** 平台标识，形如 hikvision.ezviz */
  platform: string
  /** 平台展示名 */
  title: string
  /** 能力位 → 格子；未出现的表示未声明 */
  cells: Partial<Record<DeviceCapability, CapabilityCell>>
}

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
  createTime?: string
  updateTime?: string
}

/** 平台描述 */
export interface PlatformDescriptor {
  code: string
  name: string
  defaultBaseUrl?: string
  credentialFields: CredentialFieldDescriptor[]
  /** 平台级能力位；后端已按能力矩阵派生，旧数据可能缺失 */
  capabilities?: DeviceCapability[]
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

/** 新告警入库事件（设备实时通道，webhook 推送与平台自检共用） */
export interface DeviceAlarmRealtimeEvent {
  alarmId: string
  deviceId?: string
  type?: string
  level?: string
  title?: string
  status?: string
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
  /** 云眸组编号（groupNo），云眸平台注册设备必填 */
  deviceCredentialGroupNo?: string
  deviceCredentialOfflineThreshold?: number
  deviceCredentialIsDefault?: boolean
  deviceCredentialEnabled?: boolean
  deviceCredentialRemark?: string
  /** 在离线检测开关：该凭据维度的设备是否由时间轮自动探测（默认关闭） */
  deviceCredentialOfflineDetectEnabled?: boolean
  /** 在离线检测间隔（秒） */
  deviceCredentialOfflineDetectInterval?: number
  /** 事件轮询开关：该凭据维度是否由时间轮自动拉取厂商事件（默认关闭） */
  deviceCredentialEventPollEnabled?: boolean
  /** 事件轮询间隔（秒） */
  deviceCredentialEventPollInterval?: number
  /** 设备自动同步开关：该凭据维度是否由时间轮自动拉取设备目录（默认关闭） */
  deviceCredentialDeviceSyncEnabled?: boolean
  /** 设备自动同步间隔（秒） */
  deviceCredentialDeviceSyncInterval?: number
  /** 组织自动同步开关：该凭据维度是否由时间轮自动拉取厂商侧组织树（默认关闭） */
  deviceCredentialOrgSyncEnabled?: boolean
  /** 组织自动同步间隔（秒） */
  deviceCredentialOrgSyncInterval?: number
  /** 环境指标采集开关：气象/传感器设备是否由时间轮自动采集（默认关闭） */
  deviceCredentialMetricCollectEnabled?: boolean
  /** 环境指标采集间隔（秒） */
  deviceCredentialMetricCollectInterval?: number
  /** 最近一次连通性探测时间（单条测试 / 全部检测写入） */
  deviceCredentialLastTestAt?: string
  /** 最近一次连通性探测结果：true 成功、false 失败、null/undefined 未检测 */
  deviceCredentialLastTestOk?: boolean | null
  createTime?: string
  updateTime?: string
}

/** 单套凭据的连通性探测结果（POST /provider-credential/test-all） */
export interface CredentialHealthResult {
  credentialId: string
  name: string
  vendor: string
  ok: boolean
  elapsedMs: number
  message?: string | null
}

/** 设备告警：webhook 入站 + 监听采集落库（后端查询与处理） */
export interface DeviceAlarm {
  /** 告警 ID */
  deviceAlarmId: string
  /** 来源（appKey 名称 / 厂商标识） */
  deviceAlarmSource: string
  /** 外部事件 ID（幂等键） */
  deviceAlarmExternalId: string
  /** 所属设备 ID */
  deviceAlarmDeviceId: string
  /** 通道号 */
  deviceAlarmChannelNo: number | null
  /** 告警类型 */
  deviceAlarmType: string
  /** 级别：critical / major / minor / info */
  deviceAlarmLevel: string
  /** 告警标题 */
  deviceAlarmTitle: string
  /** 告警详情 */
  deviceAlarmDetail: string
  /** 处理状态：unhandled / handling / resolved / ignored */
  deviceAlarmStatus: string
  /** 处理人 */
  deviceAlarmHandler: string
  /** 处理时间 */
  deviceAlarmHandledAt: string | null
  /** 发生时间 */
  deviceAlarmOccurredAt: string
  /** 入库时间 */
  createTime: string
}

/** webhook appKey 视图（明文 secret 仅创建接口返回一次，列表恒为空） */
export interface WebhookAppKey {
  /** 主键 */
  id: string
  /** 公开标识 */
  appKey: string
  /** 名称 */
  name: string
  /** 允许的主题（access / alarm / vehicle / attendance，逗号分隔） */
  scopes?: string
  /** 过期时间；为空表示永久有效 */
  expiresAt?: string | null
  /** 是否启用 */
  enabled?: boolean
  /** 最近使用时间 */
  lastUsedAt?: string | null
  /** 创建时间 */
  createdAt?: string
  /** 明文密钥：仅创建时返回一次 */
  secret?: string
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

/** 同步执行记录：每次厂商目录拉取 / 本地写回一行（device_sync_record） */
export interface DeviceSyncRecord {
  /** 记录 ID */
  deviceSyncRecordId: string
  /** 任务维度：凭据 ID / 厂商标识 / 设备 ID */
  deviceSyncRecordTaskId: string
  /** 厂商标识 */
  deviceSyncRecordVendor: string | null
  /** 方向：pull 拉取 / push 写回 / preview 预览 */
  deviceSyncRecordMode: string
  /** 阶段：devices / organizations / persons / device / device-delete */
  deviceSyncRecordPhase: string
  /** 总数 */
  deviceSyncRecordTotal: number | null
  /** 新增数 */
  deviceSyncRecordAdded: number | null
  /** 更新数 */
  deviceSyncRecordUpdated: number | null
  /** 删除数 */
  deviceSyncRecordRemoved: number | null
  /** 失败数 */
  deviceSyncRecordFailed: number | null
  /** 状态：running / success / partial / failed */
  deviceSyncRecordStatus: string
  /** 说明（失败原因 / 结果摘要） */
  deviceSyncRecordMessage: string | null
  /** 开始时间 */
  deviceSyncRecordStartedAt: string
  /** 结束时间 */
  deviceSyncRecordFinishedAt: string | null
}

/** 推送队列（outbox）：写回失败的设备待重试清单（device_sync_outbox） */
export interface DeviceSyncOutbox {
  /** 队列 ID */
  deviceSyncOutboxId: string
  /** 设备 ID */
  deviceSyncOutboxDeviceId: string
  /** 厂商标识 */
  deviceSyncOutboxVendor: string | null
  /** 动作：create / update / delete */
  deviceSyncOutboxAction: string
  /** 推送载荷快照（JSON，排障用） */
  deviceSyncOutboxPayload: string | null
  /** 状态：pending / sent / failed / dead */
  deviceSyncOutboxStatus: string
  /** 已重试次数 */
  deviceSyncOutboxRetry: number | null
  /** 下次重试时间 */
  deviceSyncOutboxNextAt: string | null
  /** 失败原因 */
  deviceSyncOutboxMessage: string | null
  /** 创建时间 */
  deviceSyncOutboxCreatedAt: string | null
}

/** 同步记录概览计数（records / outbox 各按状态计数） */
export interface SyncRecordsSummary {
  records: { running?: number; success?: number; partial?: number; failed?: number; total?: number }
  outbox: { pending?: number; sent?: number; failed?: number; dead?: number; total?: number }
}

/** 批量写回逐台结果 */
export interface SyncPushItem {
  /** 设备 ID */
  id: string
  /** 设备名称 */
  name?: string
  /** 是否写回成功 */
  result: boolean
  /** 结果说明 */
  message?: string
}

/** 批量写回结果（total / success / failed 汇总 + 逐台 items） */
export interface SyncPushResult {
  items: SyncPushItem[]
  total: number
  success: number
  failed: number
}
