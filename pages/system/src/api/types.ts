/**
 * 系统管理模块类型定义（@repo/system）
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
  code?: number;
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
  /** 性别 0:男 1:女 */
  sysUserSex?: number;
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

/** 字典子项 */
export interface SysDictItem extends Auditable {
  sysDictItemId?: number;
  sysDictId?: number;
  sysDictPid?: number;
  sysDictItemCode?: string;
  sysDictItemValue?: string;
  sysDictItemLabel?: string;
  sysDictItemSort?: number;
  /** 0:禁用 1:启用 */
  sysDictItemStatus?: number;
  /** 字典编码（与 sysDictCode 关联查询时使用） */
  sysDictCode?: string;
  /** 国际化 key */
  sysDictItemI18n?: string;
  /** 备注 */
  sysDictItemRemark?: string;
}

/* ================== 在线用户 ================== */

/** 在线用户 */
export interface OnlineUser {
  userId?: string;
  username?: string;
  nickname?: string;
  ip?: string;
  address?: string;
  browser?: string;
  os?: string;
  loginTime?: string;
  lastAccessTime?: string;
  status?: string;
}

/* ================== 系统设置 ================== */

/** 系统设置（编辑/新增） */
export interface SysSetting extends Auditable {
  sysSettingId?: number;
  sysSettingName?: string;
  sysSettingCode?: string;
  sysSettingValue?: string;
  sysSettingValueType?: string;
  sysSettingGroup?: string;
  sysSettingSort?: number;
  sysSettingInSystem?: number;
  sysSettingRemark?: string;
  /** 选项（select 类型使用） */
  options?: Array<{ label: string; value: string }>;
}

/** 系统设置 VO（带类型/选项） */
export interface SysSettingVO extends SysSetting {
  sysSettingOptions?: string;
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
}

/** 反馈处理请求 */
export interface FeedbackIssue {
  sysFeedbackId?: number;
  sysFeedbackRecoverContent?: string;
  sysFeedbackRecoverImages?: string;
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
