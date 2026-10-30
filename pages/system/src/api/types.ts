/**
 * 系统管理模块类型定义（@pages/system）
 *
 * 覆盖后端 spring-api-system 的 8 个核心 Controller：
 *   SysUser / SysRole / SysMenu / SysDept / SysDict / SysDictItem / SysOnline / SysSetting
 */

/** 分页返回 */
export interface PageResult<T> {
  pageNo?: number;
  pageSize?: number;
  totalPages?: number;
  total?: number;
  data?: T[];
  records?: T[];
  rows?: T[];
}

/** 统一返回结构 */
export interface ApiResult<T = unknown> {
  status?: number;
  code?: string | number;
  msg?: string;
  data?: T;
}

/** 公共审计字段 */
export interface Auditable {
  createName?: string;
  createBy?: number;
  createTime?: string;
  updateName?: string;
  updateBy?: number;
  updateTime?: string;
}

/* ================== 用户 ================== */

/** 用户查询条件 */
export interface SysUserQuery {
  page?: number;
  pageSize?: number;
  sysUserName?: string;
  sysUserPhone?: string;
  sysUserStatus?: number;
  sysDeptId?: number;
  /** 按角色 ID 筛选（角色用户列表用） */
  sysRoleId?: number;
}

/** 用户 */
export interface SysUser extends Auditable {
  sysUserId?: number;
  /** 账号 */
  sysUserUsername?: string;
  /** 名称 */
  sysUserNickname?: string;
  /** 头像 */
  sysUserAvatar?: string;
  /** 部门ID */
  sysDeptId?: number;
  /** 0:禁用 */
  sysUserStatus?: number;
  /** 手机号 */
  sysUserPhone?: string;
  /** 邮箱 */
  sysUserEmail?: string;
  /** 邮箱验证状态 0:未验证 1:已验证 */
  sysUserEmailVerified?: number;
  /** 邮箱验证通过时间 */
  sysUserEmailVerifyTime?: string;
  /** 性别 0:男 1:女 */
  sysUserSex?: number;
  /** 身份证号 */
  sysUserIdCard?: string;
  /** 生日 */
  sysUserBirthday?: string;
  /** 头像框ID */
  sysUserAvatarFrame?: number;
  /** 是否显示头像框 */
  sysUserAvatarFrameShow?: number;
  /** 系统账号 */
  sysUserInSystem?: number;
  /** 备注 */
  sysUserRemark?: string;
  /** 最后登录IP */
  sysUserLastIp?: string;
  /** 最后登录地址 */
  sysUserLastAddress?: string;
  /** 角色 ID 列表（更新时使用） */
  roleIds?: number[];
  /** 角色列表（只读） */
  userRoles?: SysRole[];
  /** 岗位 ID 列表（更新时使用） */
  postIds?: number[];
  /** 岗位列表（只读） */
  userPosts?: SysPost[];
  /** 登录次数 */
  sysUserLoginCount?: number;
  /** 最后登录时间 */
  sysUserLastLoginTime?: string;
  /** 密码最后修改时间 */
  sysUserPasswordUpdateTime?: string;
  /** 是否必须修改密码 0否 1是 */
  sysUserMustChangePassword?: number;
  /** TOTP 绑定码（不展示值） */
  sysUserTotpCode?: string;
  /** TOTP 是否已开启（派生状态） */
  totpEnabled?: boolean;
}

/** 用户新增/更新（不带密码字段） */
export interface SysUserUpdate extends SysUser {
  /** 更新时是否更新角色 */
  updateRole?: boolean;
  /** 客户端ID（前端一般不传） */
  sysClientId?: string;
  /** 登录密码（新增必填，编辑可不传表示不修改） */
  sysUserPassword?: string;
}

/* ================== 角色 ================== */

/** 角色 */
export interface SysRole extends Auditable {
  sysRoleId?: number;
  /** 角色名称 */
  sysRoleName?: string;
  /** 角色编码 */
  sysRoleCode?: string;
  /** 0:不启用 1:启用 */
  sysRoleStatus?: number;
  /** 优先级 */
  sysRoleSort?: number;
  /** 是否系统角色 */
  sysRoleInSystem?: number;
  /** 备注 */
  sysRoleRemark?: string;
  /** 数据权限范围: 1-全部 2-本部门 3-本部门及以下 4-仅本人 5-自定义 */
  sysRoleDataScope?: number;
  /** 自定义数据权限部门ID列表(逗号分隔) */
  sysRoleDataScopeDeptIds?: string;
  /** 是否只读角色 0否 1是 */
  sysRoleReadonly?: number;
  /** 数据权限范围(字符串口径): all/dept/dept_and_child/self/custom */
  sysRoleDataScopeStr?: string;
  /** 自定义数据权限部门ID列表(JSON 数组字符串) */
  sysRoleDeptIds?: string;
}

/** 角色分配菜单请求 */
export interface RoleMenuUpdate {
  roleId?: number;
  menuId?: number[];
}

/* ================== 菜单 ================== */

/** 菜单（实体） */
export interface SysMenu extends Auditable {
  sysMenuId?: number;
  /** 菜单名称（路由名） */
  sysMenuName?: string;
  /** 菜单标题（显示名） */
  sysMenuTitle?: string;
  /** 路径 */
  sysMenuPath?: string;
  /** 国际化 key */
  sysMenuI18n?: string;
  /** 权限标识 */
  sysMenuPerm?: string;
  /** 激活路径 */
  sysMenuActivePath?: string;
  /** iframe 地址 */
  sysMenuFrameSrc?: string;
  /** 组件路径 */
  sysMenuComponent?: string;
  /** 图标 */
  sysMenuIcon?: string;
  /** 右侧图标 */
  sysMenuExtraIcon?: string;
  /** 0:菜单 1:iframe 2:外链 3:按钮 */
  sysMenuType?: number;
  /** 排序 */
  sysMenuSort?: number;
  /** 允许角色编码（逗号分隔） */
  sysMenuRole?: string;
  /** 重定向 */
  sysMenuRedirect?: string;
  /** 进场动画 */
  sysMenuEnterTransition?: string;
  /** 离场动画 */
  sysMenuLeaveTransition?: string;
  /** 是否缓存 0:否 */
  sysMenuKeepAlive?: number;
  /** 标签栏隐藏 */
  sysMenuHiddenTag?: number;
  /** 标签固定 */
  sysMenuFixedTag?: number;
  /** 菜单徽标 1开启 0关闭 */
  sysMenuIsTag?: number;
  /** 徽标类型 danger/success/info/warning/primary */
  sysMenuTagType?: string;
  /** 徽标名称(留空显示圆点) */
  sysMenuTagName?: string;
  /** 是否隐藏 0:显示 */
  sysMenuHidden?: number;
  /** 单子级时是否隐藏父级 */
  sysMenuShowParent?: number;
  /** 父菜单ID */
  sysMenuPid?: number;
  /** 树路径（系统生成） */
  sysMenuTreeId?: string;
  /** 是否首页 0:否 */
  sysMenuHome?: number;
  /** 端类型 0:PC 1:小程序 */
  sysMenuEngine?: number;
  /** 是否脱离菜单控制 0:作为菜单处理 1:只注册路由不被当作菜单 */
  sysMenuRemind?: number;
  /** 菜单位置: standard标准(侧边栏) top顶部(顶栏按钮, 强制确认 remind=1 且不可修改) */
  sysMenuPosition?: string;
  /** 动态显示条件类型 ALWAYS/CLASS/SPEL/SWITCH/PROPERTY */
  sysMenuShowType?: string;
  /** 条件值：类全名 / SpEL 表达式 / 配置键 */
  sysMenuShowValue?: string;
  /** 开关型条件放行值 0:隐藏 1:放行 */
  sysMenuShowSwitch?: number;
  /** 开关型条件联动的功能键（统一策略配置 type=FEATURE 的 biz_key） */
  sysMenuShowKey?: string;
  /** 子菜单（树形） */
  children?: SysMenu[];
}

/** 菜单管理 VO（树形） */
export interface SysMenuSettingVO extends SysMenu {}

/* ================== 部门 ================== */

/** 部门 */
export interface SysDept extends Auditable {
  sysDeptId?: number;
  /** 机构名称 */
  sysDeptName?: string;
  /** 父ID */
  sysDeptPid?: number;
  /** 树路径 */
  sysDeptTreeId?: string;
  /** 机构编码 */
  sysDeptCode?: string;
  /** 自定义图标（Element 图标名 / Iconify 名） */
  sysDeptIcon?: string;
  /** 部门负责人 */
  sysDeptPrincipal?: string;
  /** 负责人联系方式 */
  sysDeptContact?: string;
  /** 排序 */
  sysDeptSort?: number;
  /** 0:启用 1:禁用 */
  sysDeptStatus?: number;
  /** 备注 */
  sysDeptRemark?: string;
  /** 数据权限类型 1-5 */
  sysDeptDataPermission?: number;
  /** 可见部门ID列表（逗号分隔） */
  sysDeptDataPermissionDeptId?: string;
  /** 负责人用户ID集合（非DB） */
  principalUserIds?: number[];
  /** 负责人名称集合（非DB） */
  principalUserNames?: string[];
  /** 部门人数（非DB） */
  memberCount?: number;
  /** 子部门 */
  children?: SysDeptVO[];
}

/** 部门 VO（带 children） */
export interface SysDeptVO extends SysDept {}

/* ================== 字典 ================== */

/** 字典 */
export interface SysDict extends Auditable {
  sysDictId?: number;
  sysDictPid?: number;
  sysDictSort?: number;
  sysDictName?: string;
  /** 0:隐藏 1:显示 */
  sysDictStatus?: number;
  /** 是否内置 */
  sysDictInSystem?: number;
  sysDictCode?: string;
  sysDictI18n?: string;
  sysDictRemark?: string;
  children?: SysDict[];
}

/** 字典子项配置项 */
export interface SysDictItemProperty {
  sysDictItemPropertyId?: number;
  sysDictItemId?: number;
  sysDictItemPropertyGroup?: string;
  sysDictItemPropertyName?: string;
  sysDictItemPropertyValue?: string;
  sysDictItemPropertySelectedType?: string;
}

/** 字典子项 */
export interface SysDictItem extends Auditable {
  sysDictItemId?: number;
  sysDictId?: number;
  sysDictPid?: number;
  /** 子项编码/存储值 */
  sysDictItemCode?: string;
  /** 子项显示名称 */
  sysDictItemName?: string;
  /** 子项图标 */
  sysDictItemIcon?: string;
  sysDictItemSort?: number;
  /** 0:禁用 1:启用 */
  sysDictItemStatus?: number;
  /** 字典编码（与 sysDictCode 关联查询时使用） */
  sysDictCode?: string;
  /** 国际化 key */
  sysDictItemI18n?: string;
  /** 备注 */
  sysDictItemRemark?: string;
  /** 扩展配置 */
  property?: SysDictItemProperty[];
}

/* ================== 在线用户 ================== */

/** 在线用户登录 IP（按登录日志聚合） */
export interface OnlineLoginIp {
  /** 登录 IP */
  ip?: string;
  /** 登录归属地 */
  address?: string;
  /** 最近登录时间 */
  lastTime?: string;
  /** 登录次数 */
  total?: number;
}

/** 在线用户单日登录情况（时间轴节点） */
export interface OnlineLoginDay {
  /** 日期 yyyy-MM-dd */
  date?: string;
  /** 登录次数（成功 + 失败） */
  total?: number;
  /** 成功次数 */
  success?: number;
  /** 失败次数 */
  fail?: number;
  /** 当日登录 IP */
  ips?: string[];
  /** 当日最近登录时间 */
  lastTime?: string;
}

/** 在线用户登录时间轴 */
export interface OnlineLoginHistory {
  username?: string;
  /** 统计窗口天数 */
  windowDays?: number;
  /** 窗口内登录次数 */
  total?: number;
  /** 窗口内成功次数 */
  success?: number;
  /** 窗口内失败次数 */
  fail?: number;
  /** 最近一次成功登录时间 */
  lastTime?: string;
  /** 全部登录 IP（最近使用倒序） */
  ips?: OnlineLoginIp[];
  /** 按天节点（日期升序，无登录的日期补零） */
  items?: OnlineLoginDay[];
}

/** 在线用户 */
export interface OnlineUser {
  userId?: string;
  username?: string;
  nickname?: string;
  /** 部门名称 */
  deptName?: string;
  ip?: string;
  address?: string;
  browser?: string;
  os?: string;
  loginTime?: string;
  lastAccessTime?: string;
  /** 登录类型（WEB / APP / GITEE 等） */
  loginType?: string;
  status?: string;
  /** 全部登录 IP（最近使用倒序，首项为当前会话 IP） */
  loginIps?: OnlineLoginIp[];
  /** 最近 30 天登录情况（只含有登录记录的日期） */
  loginDays?: OnlineLoginDay[];
}

/* ================== 系统设置 ================== */

/** 系统设置（编辑/新增） */
export interface SysSetting extends Auditable {
  sysSettingId?: number;
  sysSettingName?: string;
  sysSettingCode?: string;
  sysSettingValue?: string;
  /** 出厂默认值（与当前运行值分离，用于“恢复默认”） */
  sysSettingDefaultValue?: string;
  sysSettingValueType?: string;
  sysSettingGroup?: string;
  sysSettingSort?: number;
  sysSettingInSystem?: number;
  sysSettingRemark?: string;
  /** 是否敏感配置: 0否 1是（列表/详情返回时掩码，明文需通过解密接口获取） */
  sysSettingIsSensitive?: number;
  /** 校验规则（正则表达式，可为空） */
  sysSettingValidate?: string;
  /** 选项（select 类型使用） */
  options?: Array<{ label: string; value: string }>;
}

/** 系统设置 VO（带类型/选项） */
export interface SysSettingVO extends SysSetting {
  sysSettingOptions?: string;
}

/** 系统设置变更历史 */
export interface SysSettingHistory {
  sysSettingHistoryId?: number;
  sysSettingId?: number;
  sysSettingName?: string;
  sysSettingGroup?: string;
  sysSettingOldValue?: string;
  sysSettingNewValue?: string;
  /** CREATE-新增 UPDATE-更新 DELETE-删除 IMPORT-导入 ROLLBACK-回滚 */
  sysSettingOperation?: string;
  sysSettingOperatorId?: string;
  sysSettingOperatorName?: string;
  sysSettingRemark?: string;
  sysSettingBatchNo?: string;
  /** 操作人（新口径） */
  createBy?: string;
  createTime?: string;
}

/* ================== 反馈管理 ================== */

/** 用户反馈 */
export interface SysFeedback extends Auditable {
  sysFeedbackId?: number;
  sysFeedbackType?: string;
  sysFeedbackImages?: string;
  sysFeedbackContent?: string;
  sysFeedbackStatus?: number;
  sysFeedbackDealBy?: number;
  sysFeedbackDealName?: string;
  sysFeedbackRecoverContent?: string;
  sysFeedbackRecoverTime?: string;
  sysFeedbackRecoverImages?: string;
  sysFeedbackUserAgent?: string;
  sysFeedbackPlatform?: string;
  /** 优先级 0低 1中 2高 3紧急 */
  sysFeedbackPriority?: number;
}

/** 反馈处理请求 */
export interface FeedbackIssue {
  sysFeedbackId?: number;
  sysFeedbackRecoverContent?: string;
  sysFeedbackRecoverImages?: string;
}

/** 反馈统计 */
export interface FeedbackStatistic {
  total?: number;
  pending?: number;
  resolved?: number;
  typeStatistics?: Array<{ name?: string; type?: string; value?: number }>;
  trendStatistics?: Array<{ date?: string; count?: number; pendingCount?: number; resolvedCount?: number }>;
}

/* ================== 登录日志 ================== */

/** 登录日志 */
export interface SysUserLog extends Auditable {
  sysLogId?: number;
  sysLogUsername?: string;
  sysLogLoginType?: string;
  sysLogUa?: string;
  sysLogFingerprint?: string;
  sysLogBrowser?: string;
  sysLogSystem?: string;
  sysLogIp?: string;
  sysLogAddress?: string;
  sysLogIsp?: string;
  sysLogUrl?: string;
  sysLogAppName?: string;
  sysLogParam?: string;
  sysLogFrom?: string;
  sysLogStatus?: number;
  sysLogMessage?: string;
  sysLogCost?: number;
  sysDeptId?: number;
  sysDeptName?: string;
  sysLogRoleCodes?: string;
  sysLogRoleNames?: string;
}

/* ================== 通用 ================== */

/** 通用分页请求 */
export interface PageQuery {
  page?: number;
  pageSize?: number;
}

/* ================== 租户管理 ================== */

/** 租户 */
export interface SysTenant extends Auditable {
  /** 租户ID（雪花ID，即租户唯一编码） */
  sysTenantId?: string;
  /** 租户名称 */
  sysTenantName?: string;
  /** 租户账号（登录用） */
  sysTenantUsername?: string;
  /** 租户密码（明文，仅新增/重置时传） */
  sysTenantPassword?: string;
  /** 签名 */
  sysTenantSign?: string;
  /** 公司 */
  sysTenantCorporation?: string;
  /** 逻辑删除 0正常/1删除 */
  sysTenantDelete?: number;
  /** 状态 0正常/1禁用 */
  sysTenantStatus?: number;
  /** 联系人 */
  sysTenantContact?: string;
  /** 手机号 */
  sysTenantPhone?: string;
  /** 地址 */
  sysTenantAddress?: string;
  /** 邮箱 */
  sysTenantEmail?: string;
  /** 租户编码（兼容字段，保存时同步为 sysTenantId） */
  sysTenantCode?: string;
  /** 配置唯一ID */
  sysTenantGid?: string;
  /** 租户访问地址 */
  sysTenantHomeUrl?: string;
  /** 备注 */
  sysTenantRemark?: string;
  /** 关联服务ID列表（只读） */
  serviceIds?: number[];
  /** 关联服务列表（只读） */
  sysTenantService?: SysTenantService[];
}

/** 租户-服务关联 */
export interface SysTenantService {
  sysTenantServiceId?: number;
  sysTenantId?: string;
  sysServiceId?: number;
  /** 到期时间 */
  sysTenantServiceValidTime?: string;
}

/** 租户绑定服务请求 */
export interface TenantServiceBindRequest {
  sysTenantId?: string;
  serviceBindItems?: Array<{
    sysServiceId?: number;
    validTime?: string;
  }>;
}

/** 租户统计 */
export interface SysTenantStats {
  total?: number;
  enabled?: number;
  disabled?: number;
  subscribed?: number;
}

/* ================== 服务管理（租户菜单分配依赖） ================== */

/** 服务产品 */
export interface SysService {
  sysServiceId?: number;
  sysServiceName?: string;
  sysServiceCode?: string;
  sysServiceDesc?: string;
  sysServiceSort?: number;
  sysServiceDelete?: number;
  sysServiceStatus?: number;
  /** 关联模块ID列表（非DB） */
  sysServiceTags?: number[];
}

/* ================== 头像框 ================== */

/** 头像框 */
export interface SysAvatarFrame extends Auditable {
  sysAvatarFrameId?: number;
  /** 头像框名称 */
  sysAvatarFrameName?: string;
  /** 类型: base-基础 birthday-生日 event-活动 */
  sysAvatarFrameType?: string;
  /** 头像框图片URL */
  sysAvatarFrameImage?: string;
  /** 渐变背景色(css) */
  sysAvatarFrameColor?: string;
  /** 描述 */
  sysAvatarFrameDesc?: string;
  /** 获取途径: default-默认 birthday-生日 achievement-成就 */
  sysAvatarFrameAcquire?: string;
  /** 排序 */
  sysAvatarFrameSort?: number;
  /** 状态: 0-禁用 1-启用 */
  sysAvatarFrameStatus?: number;
}

/* ================== 系统日志（操作日志） ================== */

/** 操作日志 */
export interface SysLog extends Auditable {
  sysLogId?: number;
  /** 操作账号 */
  sysLogUsername?: string;
  /** 操作耗时（毫秒） */
  sysLogCost?: number;
  /** 操作IP地址 */
  sysLogAddress?: string;
  /** 请求URL */
  sysLogUrl?: string;
  /** 浏览器信息 */
  sysLogBrowser?: string;
  /** 操作内容 */
  sysLogContent?: string;
  /** 请求参数 */
  sysLogParam?: string;
  /** 操作模块 */
  sysLogFrom?: string;
  /** 操作状态: 0失败 1成功 */
  sysLogStatus?: number;
}

/* ================== 岗位管理 ================== */

/** 岗位 */
export interface SysPost extends Auditable {
  sysPostId?: number;
  /** 岗位名称 */
  sysPostName?: string;
  /** 岗位编码 */
  sysPostCode?: string;
  /** 排序 */
  sysPostSort?: number;
  /** 0:启用 1:禁用 */
  sysPostStatus?: number;
  /** 备注 */
  sysPostRemark?: string;
  /** 备注（别名口径） */
  remark?: string;
  /** 关联用户数（瞬态） */
  userCount?: number;
}

/** 岗位查询条件 */
export interface SysPostQuery {
  page?: number;
  pageSize?: number;
  sysPostName?: string;
  sysPostCode?: string;
  sysPostStatus?: number;
}

/* ================== 缓存管理 ================== */

/** 缓存模块 */
export interface CacheModule {
  /** 模块名称 */
  name?: string;
  /** Key 前缀 */
  keyPrefix?: string;
  /** 模块描述 */
  description?: string;
  /** Key 数量 */
  keyCount?: number;
}

/** 缓存 Key */
export interface CacheKey {
  /** Key 名 */
  key?: string;
  /** 剩余存活时间（秒，-1 表示永不过期） */
  ttl?: number;
}

/* ================== 消息管理 ================== */

/** 系统消息（管理端） */
export interface SysMessageAdmin extends Auditable {
  sysMessageId?: number;
  /** 消息标题 */
  sysMessageTitle?: string;
  /** 消息内容 */
  sysMessageContent?: string;
  /** 消息类型: system-系统通知 notice-公告 remind-提醒 */
  sysMessageType?: string;
  /** 消息级别: normal-普通 important-重要 urgent-紧急 */
  sysMessageLevel?: string;
  /** 发送时间 */
  sysMessageSendTime?: string;
  /** 发送状态: 0未读 1已读（单条视角，管理端一般不用） */
  sysMessageRead?: number;
  /** 已读人数 */
  readCount?: number;
  /** 未读人数 */
  unreadCount?: number;
  /** 目标用户 ID 列表（空则广播全部） */
  targetUserIds?: number[];
  /** 发送者ID */
  sysMessageSenderId?: number;
  /** 发送者名称 */
  sysMessageSenderName?: string;
  /** 接收者ID 0=广播 */
  sysMessageReceiverId?: number;
  /** 接收者名称 */
  sysMessageReceiverName?: string;
  /** 0草稿 1已发送 2已撤回 */
  sysMessageStatus?: number;
  /** 跳转链接 */
  sysMessageUrl?: string;
  /** 消息渠道: PLATFORM/EMAIL/SMS */
  sysMessageChannel?: string;
}

/** 消息模板 */
export interface SysMessageTemplate {
  sysMessageTemplateId?: number;
  sysMessageTemplateCode: string;
  sysMessageTemplateName?: string;
  sysMessageTemplateTitle?: string;
  sysMessageTemplateContent?: string;
  /** 消息渠道: EMAIL/SMS */
  sysMessageChannel?: string;
  /** text/html/markdown */
  sysMessageTemplateType?: string;
  sysMessageTemplateCallbackUrl?: string;
  sysMessageTemplateSort?: number;
  sysMessageTemplateRemark?: string;
  /** 0禁用 1启用 */
  sysMessageTemplateStatus?: number;
  /** 外部/运营商模板码(短信必填，如阿里云SMS_xxx) */
  sysMessageExternalCode?: string;
  /** 模板变量说明(逗号分隔变量名) */
  sysMessageParamSchema?: string;
}

/** 消息推送日志 */
export interface SysMessageLog {
  sysMessageLogId?: number;
  sysMessageLogTarget?: string;
  sysMessageTemplateId?: number;
  sysMessageLogChannel?: string;
  sysMessageLogContent?: string;
  sysMessageLogParam?: string;
  sysMessageCost?: number;
  /** SUCCESS/FAILURE */
  sysMessageCode?: string;
  sysMessageMessage?: string;
  sysMessageLogSubject?: string;
  sysMessageLogMessageId?: string;
  sysMessageBatchId?: string;
  sysMessageReadStatus?: number;
  createTime?: string;
}

/** 模板预览请求 */
export interface TemplatePreviewRequest {
  sysMessageTemplateId: number;
  params?: Record<string, unknown>;
}

/** 模板预览响应 */
export interface TemplatePreviewResponse {
  sysMessageTemplateId?: number;
  title?: string;
  content?: string;
  unresolvedParams?: string[];
  complete?: boolean;
}

/** 按模板发送请求（按模板ID） */
export interface MessageTemplateSendRequest {
  sysMessageTemplateId: number;
  target: string[];
  subject?: string;
  params?: Record<string, unknown>;
}

/** 按模板编码发送请求 */
export interface MessageByCodeSendRequest {
  templateCode: string;
  target?: string[];
  roleKeys?: string[];
  subject?: string;
  params?: Record<string, unknown>;
}

/** 发送消息请求 */
export interface SysMessageSendRequest {
  sysMessageTitle: string;
  sysMessageContent?: string;
  /** system/notice/message/warning/info */
  sysMessageType?: string;
  /** low/normal/high/urgent */
  sysMessageLevel?: string;
  /** 接收者ID，0或留空=广播 */
  sysMessageReceiverId?: number;
  sysMessageUrl?: string;
  templateCode?: string;
}

/** 消息统计 */
export interface MessageStatistic {
  /** 总数 */
  total?: number;
  /** 已读 */
  readCount?: number;
  /** 未读 */
  unreadCount?: number;
}

/* ================== IP 黑白名单 ================== */

/** IP 黑白名单 */
export interface SysIpBlackwhite extends Auditable {
  sysIpId?: number;
  /** 类型: 0白名单 1黑名单 */
  sysIpType?: number;
  /** IP 地址 / 网段（CIDR） */
  sysIpIp?: string;
  /** 0:启用 1:禁用 */
  sysIpStatus?: number;
  /** 备注 */
  sysIpRemark?: string;
}

/* ================== 错误日志 ================== */

/** 错误日志 */
export interface SysErrorLog {
  sysErrorLogId?: number;
  /** 异常类型 */
  sysErrorLogType?: string;
  /** 异常消息 */
  sysErrorLogMessage?: string;
  /** 完整异常堆栈 */
  sysErrorLogStack?: string;
  /** 请求 URL */
  sysErrorLogUrl?: string;
  /** 请求参数 */
  sysErrorLogParam?: string;
  /** 操作人 */
  sysErrorLogUsername?: string;
  /** 发生时间 */
  createTime?: string;
  /** 异常聚合Key */
  sysErrorKey?: string;
  /** 来源: js/rejection/resource/manual */
  sysErrorSource?: string;
  /** 异常消息（新口径） */
  sysErrorMessage?: string;
  /** 异常堆栈（新口径） */
  sysErrorStack?: string;
  /** 出错文件 */
  sysErrorFilename?: string;
  /** 行号 */
  sysErrorLineno?: number;
  /** 列号 */
  sysErrorColno?: number;
  /** 资源URL */
  sysErrorResourceUrl?: string;
  /** 标签名 */
  sysErrorTagName?: string;
  /** 首次发生时间(ms) */
  sysErrorFirstAt?: number;
  /** 发生次数 */
  sysErrorCount?: number;
  /** 最近上报时间(ms) */
  sysErrorReportTime?: number;
  /** 0未处理 1已处理 2已忽略 */
  sysErrorStatus?: number;
}

/** 异常日志统计 */
export interface ErrorLogStatistic {
  total: number;
  todayCount: number;
  pendingCount: number;
  handledCount: number;
  ignoredCount: number;
  handleRate: number;
  sourceStats?: Record<string, number>;
  topErrors?: Array<{ message: string; count: number; source: string }>;
}

/** 错误统计（按异常类型） */
export interface ErrorStatistic {
  /** 异常类型 */
  type?: string;
  /** 数量 */
  count?: number;
}

/* ================== JVM 系统监控 ================== */

/** 内存用量 */
export interface MemoryUsage {
  /** 初始 */
  init?: number;
  /** 已用 */
  used?: number;
  /** 已提交 */
  committed?: number;
  /** 最大 */
  max?: number;
}

/** JVM 信息 */
export interface JvmInfo {
  /** JVM 名称 */
  jvmName?: string;
  /** JVM 版本 */
  jvmVersion?: string;
  /** Java 版本 */
  javaVersion?: string;
  /** 启动时间戳(ms) */
  startTime?: number;
  /** 运行时长(ms) */
  uptime?: number;
  /** JVM 输入参数 */
  inputArguments?: string[];
  /** 堆内存 */
  heapMemory?: MemoryUsage;
  /** 非堆内存 */
  nonHeapMemory?: MemoryUsage;
  /** 各内存池详情 */
  memoryPools?: Array<{ name?: string; type?: string; usage?: MemoryUsage }>;
  /** 线程信息 */
  threadInfo?: {
    threadCount?: number;
    peakThreadCount?: number;
    daemonThreadCount?: number;
    deadlockedThreadCount?: number;
  };
  /** GC 收集器 */
  garbageCollectors?: Array<{ name?: string; collectionCount?: number; collectionTime?: number }>;
  /** Top CPU 线程 */
  topCpuThreads?: Array<{ name?: string; cpuPercent?: number; state?: string }>;
  /** 系统信息 */
  systemInfo?: { cpuUsage?: number; totalMemory?: number; freeMemory?: number };
}

/* ================== 缓存管理（新口径） ================== */

/** 缓存信息（固定 6 项：角色/字典/部门/设置/菜单/用户缓存） */
export interface SysCacheInfo {
  /** 缓存名称（角色缓存/字典缓存/部门缓存/设置缓存/菜单缓存/用户缓存） */
  cacheName: string;
  /** Redis key 前缀 */
  cacheKey: string;
  /** 描述 */
  description: string;
  keyCount?: number;
  memoryUsage?: string;
}

/* ================== 公告已读统计 ================== */

/** 公告已读统计 */
export interface AnnouncementReadStat {
  readCount: number;
  unreadCount: number;
  totalUsers: number;
}

/* ================== TOTP/2FA ================== */

/** TOTP 开启状态 */
export interface TotpStatus {
  enabled: boolean;
}

/** TOTP 绑定 URI 响应 */
export interface TotpUriResponse {
  uri: string;
}

/* ================== 服务器邮箱通道 ================== */

/** 服务器邮箱连通性探测结果（POST /v2/email/check） */
export interface EmailConnectivity {
  /** SMTP 发信通道是否握手并认证成功 */
  smtpSuccess: boolean;
  /** SMTP 探测结论（成功为服务端标识，失败为异常原因） */
  smtpMessage: string;
  /** SMTP 探测耗时（毫秒） */
  smtpCost: number;
  /** IMAP 收信通道是否握手并认证成功 */
  imapSuccess: boolean;
  /** IMAP 探测结论 */
  imapMessage: string;
  /** IMAP 探测耗时（毫秒） */
  imapCost: number;
  /** 发信配置是否齐备（决定个人中心是否出现邮箱验证入口） */
  emailVerifyEnable: boolean;
}

/* ================== Redis 监控 ================== */

/** Redis 命令统计 */
export interface RedisCommandStat {
  command?: string;
  calls?: number;
  percentage?: number;
}

/** Redis keyspace 详情 */
export interface RedisKeyspaceDetail {
  db?: string;
  keys?: number;
  expires?: number;
  avgTtl?: number;
}

/** Redis 运行信息 */
export interface RedisInfo {
  version?: string;
  mode?: string;
  port?: number;
  connectedClients?: number;
  uptimeDays?: number;
  usedMemory?: string;
  usedMemoryBytes?: number;
  usedMemoryPeakBytes?: number;
  usedMemoryRss?: string;
  usedMemoryPeak?: string;
  memFragmentationRatio?: number;
  memAllocator?: string;
  maxMemory?: string;
  maxMemoryBytes?: number;
  usedCpuPercent?: number;
  aofEnabled?: boolean;
  rdbLastStatus?: string;
  keyCount?: number;
  netInputKps?: number;
  netOutputKps?: number;
  commandStats?: RedisCommandStat[];
  keyspaceDetails?: RedisKeyspaceDetail[];
}

/* ================== 缓存监控（三栏钻取） ================== */

/** 缓存模块（带 module 标识） */
export interface CacheModuleInfo {
  /** 模块标识（SCAN 前缀用） */
  module?: string;
  /** 模块名称 */
  name?: string;
  /** Key 前缀 */
  keyPrefix?: string;
  /** 模块描述 */
  description?: string;
  /** Key 数量 */
  keyCount?: number;
  /** 缓存管理器列表 */
  cacheManagers?: string[];
}

/** 缓存统计概览 */
export interface CacheStats {
  /** 缓存实例数 */
  cacheCount?: number;
  /** 总键数 */
  totalKeys?: number;
  /** 内存占用（格式化字符串） */
  usedMemory?: string;
  /** 内存占用（字节） */
  usedMemoryBytes?: number;
  /** 命中率百分比 */
  hitRate?: number;
  /** 是否支持命中率统计 */
  hitRateAvailable?: boolean;
}

/** 缓存值详情 */
export interface CacheValueInfo {
  key?: string;
  type?: string;
  value?: string;
  ttl?: number;
  size?: number;
  /** 是否可在线编辑（仅 Spring Cache 管理的缓存可编辑） */
  editable?: boolean;
  /** 业务 JSON（去掉 Jackson 类型信封，供在线编辑） */
  plainValue?: string;
  /** 值根类型全限定名 */
  rootType?: string;
}

/* ================== 服务监控 ================== */

/** CPU 信息 */
export interface ServerCpu {
  logicalCores?: number;
  userPercent?: number;
  systemPercent?: number;
  idlePercent?: number;
  usagePercent?: number;
}

/** 内存用量 */
export interface ServerMemory {
  total?: number;
  used?: number;
  free?: number;
  usagePercent?: number;
  /** 最大堆（JVM 可选） */
  max?: number;
}

/** 磁盘分区 */
export interface ServerDisk {
  path?: string;
  usagePercent?: number;
  fsType?: string;
  total?: number;
  used?: number;
  available?: number;
  /** 剩余空间（后端 getFree 兼容字段） */
  free?: number;
}

/** 服务器信息 */
export interface ServerHost {
  hostname?: string;
  osName?: string;
  osVersion?: string;
  ip?: string;
  arch?: string;
}

/** JVM 信息（服务监控口径） */
export interface ServerJvm {
  name?: string;
  version?: string;
  startTime?: number;
  uptime?: number;
  javaHome?: string;
  projectPath?: string;
  inputArgs?: string[];
}

/** 内存池信息 */
export interface MemoryPoolInfo {
  name?: string;
  type?: string; // heap / non-heap
  init?: number;
  used?: number;
  committed?: number;
  max?: number;
}

/** GC 收集器 */
export interface GcCollector {
  name?: string;
  collectionCount?: number;
  collectionTime?: number;
}

/** Top CPU 线程 */
export interface TopThread {
  name?: string;
  state?: string;
  cpuTime?: number;
  userTime?: number;
}

/** 网络接口信息 */
export interface NetworkInterfaceInfo {
  name?: string;
  displayName?: string;
  bytesRecv?: number;
  bytesSent?: number;
  packetsRecv?: number;
  packetsSent?: number;
  speed?: number;
  /** IP 地址列表 */
  addresses?: string[];
  /** 丢包（接收/发送） */
  dropRecv?: number;
  dropSent?: number;
}

/** 服务监控完整信息 */
export interface ServerInfo {
  cpu?: ServerCpu;
  systemMemory?: ServerMemory;
  jvmMemory?: ServerMemory;
  diskPeak?: { usagePercent?: number; partitionCount?: number };
  disks?: ServerDisk[];
  server?: ServerHost;
  jvm?: ServerJvm;
  /** 系统运行时间（秒） */
  systemUptime?: number;
  /** 进程运行时间（秒） */
  processUptime?: number;
  /** 进程数 */
  processCount?: number;
  /** 活跃线程数 */
  threadCount?: number;
  /** 峰值线程数 */
  peakThreadCount?: number;
  /** 守护线程数 */
  daemonThreadCount?: number;
  /** 系统负载平均值 */
  systemLoadAverage?: number;
  /** 每核使用率（%） */
  coreUsages?: number[];
  /** JVM 内存池 */
  memoryPools?: MemoryPoolInfo[];
  /** GC 收集器 */
  gcCollectors?: GcCollector[];
  /** 已加载类数 */
  loadedClassCount?: number;
  /** 累计加载类数 */
  totalLoadedClassCount?: number;
  /** 已卸载类数 */
  unloadedClassCount?: number;
  /** 线程状态计数 */
  threadStates?: Record<string, number>;
  /** 死锁线程数 */
  deadlockedThreadCount?: number;
  /** Top CPU 线程 */
  topThreads?: TopThread[];
  /** 网络接口 */
  networkInterfaces?: NetworkInterfaceInfo[];
  /** Spring 核心参数（key → value） */
  springConfig?: Record<string, string>;
}

/** RESTful 秒级趋势点 */
export interface RestfulTrendPoint {
  /** Unix 秒 */
  second?: number;
  /** 本秒内请求数（即 QPS） */
  count?: number;
  qps?: number;
  success?: number;
  fail?: number;
  avgMs?: number;
  /** 本秒内各来源 IP 请求数（最多 8 个） */
  ips?: RestfulIpCount[];
}

/** IP 计数 */
export interface RestfulIpCount {
  ip?: string;
  count?: number;
}

/** Top IP 统计 */
export interface RestfulTopIp {
  ip?: string;
  count?: number;
  success?: number;
  fail?: number;
  avgMs?: number;
  lastTime?: number;
  topUrl?: string;
}

/** RESTful 汇总 */
export interface RestfulStatsSummary {
  total?: number;
  success?: number;
  fail?: number;
  avgMs?: number;
  windowCount?: number;
  windowSuccess?: number;
  windowFail?: number;
  windowAvgMs?: number;
  windowQps?: number;
}

/** Top URL 统计 */
export interface RestfulTopUrl {
  key?: string;
  url?: string;
  method?: string;
  count?: number;
  success?: number;
  fail?: number;
  avgMs?: number;
  /** 该接口的来源 IP 明细（最多 10 个） */
  ips?: RestfulIpCount[];
}

/** RESTful 实时统计快照 */
export interface RestfulApiStats {
  trend?: RestfulTrendPoint[];
  summary?: RestfulStatsSummary;
  topUrls?: RestfulTopUrl[];
  /** IP 排行（按请求数） */
  topIps?: RestfulTopIp[];
}

/* ================== 策略控制台 - 限流 ================== */

/** 限流规则（后端 0/1 状态口径） */
export interface RateLimitRule {
  sysRateLimitRuleId?: number;
  dimension?: "interface" | "ip" | "account";
  target?: string;
  qps?: number;
  burstSize?: number;
  /** 1 启用，0 禁用 */
  enabled?: 0 | 1;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

/** 全局限流配置 */
export interface RateLimitGlobal {
  enabled?: boolean;
  qps?: number;
  burstSize?: number;
  dimension?: "global" | string;
}

/* ================== 策略控制台 - 账号黑白名单 ================== */

/** 账号黑白名单（后端 1=黑名单、2=白名单；1=启用、0=禁用） */
export interface AccountBlackwhite {
  sysAccountBwId?: number;
  account?: string;
  type?: 1 | 2;
  status?: 0 | 1;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

/** 账号名单后端分页结构 */
export interface AccountBlackwhitePage {
  list: AccountBlackwhite[];
  total: number;
  pageNo: number;
  pageSize: number;
  pages: number;
}

/* ================== 策略控制台 - 消息头拦截 ================== */

/** 消息头匹配方式 */
export type HeaderMatchType = "CONTAINS" | "EQUALS" | "PREFIX" | "REGEX";

/** 一条消息头拦截规则（后端已把 config JSON 解析成结构化字段） */
export interface HeaderRuleRow {
  sysPolicyConfigId?: number;
  /** 消息头名，主要是 User-Agent */
  headerName: string;
  /** 1 启用，0 停用 */
  status?: 0 | 1;
  remark?: string;
  updateTime?: string;
  /** 后端能否解析这条规则；false 说明 config 坏了，需要修 */
  parsed?: boolean;
  matchType?: HeaderMatchType;
  patterns?: string[];
  /** 目前只有 BLOCK */
  action?: string;
  /** 拒绝时返回的 HTTP 状态码 */
  blockStatus?: number;
  message?: string;
}

/** 爬虫 / 自动化客户端特征预设 */
export interface HeaderPresets {
  /** 分组名 → 特征列表 */
  groups: Record<string, string[]>;
  /** 展平后的全量特征 */
  flat: string[];
}

/* ================== 策略控制台 - 命中统计 ================== */

/** 命中统计的策略类型；与后端 {@code PolicyHitCollector.TYPE_*} 一一对应 */
export type PolicyHitType =
  | "IP_BLACK"
  | "IP_WHITE"
  | "ACCOUNT_BLACK"
  | "ACCOUNT_WHITE"
  | "RATE_LIMIT"
  | "RATE_LIMIT_GLOBAL"
  | "API_ROUTE"
  | "HEADER";

/** 单个来源 IP 的命中次数 */
export interface PolicyHitIp {
  ip: string;
  count: number;
}

/** 趋势上的一个分钟桶 */
export interface PolicyHitTrendPoint {
  /** Unix 分钟（epoch/60000） */
  minute: number;
  /** 该分钟起点毫秒时间戳 */
  time: number;
  count: number;
}

/** 单条策略的命中明细 */
export interface PolicyHitDetail {
  total: number;
  firstTime: number | null;
  lastTime: number | null;
  topIps: PolicyHitIp[];
  trend: PolicyHitTrendPoint[];
}

/* ================== 策略控制台 - 热更新 ================== */

/** 热重载执行结果 */
export interface HotReloadRuntimeResult {
  reloaded?: boolean;
  enabledCount?: number;
  reloadTime?: string;
}

/** 热更新配置项复用设置实体，并补齐策略接口返回的运行时字段 */
export interface HotReloadConfig extends SysSetting {
  sysSettingConfig?: string;
  sysSettingVersion?: number;
  sysSettingStatus?: number;
  sysSettingAdmin?: number;
  sysSettingCollect?: number;
  sysSettingAppInner?: number;
}

/* ================== 统一策略配置（灰度 / 功能开关） ================== */

/**
 * 统一策略配置（sys_policy_config 一行 = 一条配置）
 *
 * 列语义随 `type` 变化：
 *   GRAY    灰度：bizKey 灰度键、weight 权重百分比、config 命中策略 JSON
 *   FEATURE 功能开关：bizKey 功能键、status 即开关状态
 *   IP / ACCOUNT / RATE_LIMIT 由各自的专用接口维护，页面不直接编辑
 */
export interface PolicyConfig {
  sysPolicyConfigId?: number;
  /** 策略类型: IP/RATE_LIMIT/ACCOUNT/GRAY/FEATURE/API_ROUTE */
  type?: string;
  /** 限流维度: interface/ip/account；非限流类型为空串 */
  dimension?: string;
  /** 名单方向: 1黑名单 2白名单；非名单类型为 0 */
  listType?: number;
  /** 业务键: 灰度键 / 功能键 */
  bizKey?: string;
  /** 宽列值 */
  bizValue?: string;
  /** 状态: 1启用 0禁用 */
  status?: number;
  /** QPS，仅 RATE_LIMIT */
  qps?: number;
  /** 突发容量，仅 RATE_LIMIT */
  burstSize?: number;
  /** 权重/百分比，仅 GRAY */
  weight?: number;
  /** 排序值，越小越靠前 */
  sort?: number;
  /** 类型特有配置(JSON) */
  config?: string;
  /** 备注 */
  remark?: string;
  createName?: string;
  createTime?: string;
  updateTime?: string;
}

/** 已注册路由（接口停用/转发的可选目标） */
export interface RegisteredRoute {
  /** 注册 key，形如 `GET /v2/user/me` */
  key: string;
  /** HTTP 方法 */
  method: string;
  /** 路径模式 */
  path: string;
  /** 处理方法，形如 `SysUserController#me` */
  handler: string;
}

/** 接口停用/转发规则的动作 */
export type ApiRouteAction = "PASS" | "DISABLE" | "FORWARD";

/** 接口停用/转发规则内容（存于 PolicyConfig.config，JSON 字符串） */
export interface ApiRouteRuleConfig {
  /** 动作：PASS 放行 / DISABLE 停用 / FORWARD 转发 */
  action: ApiRouteAction;
  /** 停用响应码，默认 503 */
  status?: number;
  /** 停用提示 */
  message?: string;
  /** 目标注册 key，仅 FORWARD 需要；必须是已注册路由 */
  targetKey?: string;
}

