/**
 * 系统管理模块 API 封装（@pages/system）
 *
 * 覆盖 8 个核心 Controller，调用规范：
 *   1) 全部走 http()，URL 形如 /v2/{module}/{action}
 *   2) 链式 API：.get(url).query(params) / .post(url).data(body) / .put / .delete
 *   3) 返回 Promise<ApiResult<T>>，由业务代码 .then(r => r.data) 解包
 *   4) 路径与后端 spring-api-support-common-system-starter / common-service-starter 一致
 */
import { http } from "@repo/utils";
import type {
  ApiResult,
  FeedbackIssue,
  OnlineUser,
  PageResult,
  RoleMenuUpdate,
  SysDept,
  SysDeptVO,
  SysDict,
  SysDictItem,
  SysFeedback,
  SysMenu,
  SysMenuSettingVO,
  SysRole,
  SysService,
  SysSetting,
  SysSettingVO,
  SysTenant,
  SysTenantStats,
  SysUser,
  SysLog,
  SysUserLog,
  SysUserQuery,
  SysUserUpdate,
  SysAvatarFrame,
  TenantServiceBindRequest,
} from "./types";

/* ================== 用户管理 ================== */

/** 用户分页 */
export function pageForUser(params: SysUserQuery) {
  return http()
    .get("/v2/user/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysUser>>>((r) => r.data);
}

/** 新增用户 */
export function saveUser(data: SysUserUpdate) {
  return http()
    .post("/v2/user/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysUser>>((r) => r.data);
}

/** 更新用户 */
export function updateUser(data: SysUserUpdate) {
  return http()
    .put("/v2/user/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysUser>>((r) => r.data);
}

/** 删除用户 */
export function deleteUser(sysUserId: number) {
  return http()
    .delete("/v2/user/delete")
    .query({ sysUserId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 重置用户密码（管理员操作） */
export function resetUserPassword(userId: number) {
  return http()
    .post("/v2/user/reset")
    .data({ userId } as Record<string, unknown>)
    .then<ApiResult<string>>((r) => r.data);
}

/** 重置个人密码 */
export function resetOwner() {
  return http()
    .get("/v2/user/resetOwner")
    .then<ApiResult<SysUser>>((r) => r.data);
}

/** 修改个人密码 */
export function updateOwner(data: { oldPassword: string; newPassword: string; confirmPassword: string }) {
  return http()
    .put("/v2/user/updateOwner")
    .data(data)
    .then<ApiResult<SysUser>>((r) => r.data);
}

/* ================== 头像框 ================== */

/** 头像框列表 */
export function getAvatarFrameList() {
  return http()
    .get("/v2/avatar-frame/list")
    .then<ApiResult<SysAvatarFrame[]>>((r) => r.data);
}

/* ================== 角色管理 ================== */

/** 角色分页 */
export function pageForRole(params: {
  page?: number;
  pageSize?: number;
  sysRoleName?: string;
  sysRoleCode?: string;
  sysRoleStatus?: number;
}) {
  return http()
    .get("/v2/role/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysRole>>>((r) => r.data);
}

/** 角色列表（启用/下拉用） */
export function listForRole() {
  return http()
    .get("/v2/role/list")
    .then<ApiResult<SysRole[]>>((r) => r.data);
}

/** 新增角色 */
export function saveRole(data: SysRole) {
  return http()
    .post("/v2/role/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysRole>>((r) => r.data);
}

/** 更新角色 */
export function updateRole(data: SysRole) {
  return http()
    .put("/v2/role/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除角色 */
export function deleteRole(roleId: number) {
  return http()
    .delete("/v2/role/delete")
    .query({ roleId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 获取角色的菜单 ID 集合 */
export function getRoleMenu(roleId: number) {
  return http()
    .get("/v2/role/get_menu")
    .query({ roleId })
    .then<ApiResult<number[]>>((r) => r.data);
}

/** 更新角色的菜单授权 */
export function updateRoleMenu(data: RoleMenuUpdate) {
  return http()
    .put("/v2/role/update_menu")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 菜单管理 ================== */

/** 全部菜单（条件查询，返回扁平列表） */
export function listAllMenu(params?: Record<string, unknown>) {
  return http()
    .get("/v2/menu/all")
    .query((params ?? {}) as Record<string, unknown>)
    .then<ApiResult<SysMenu[]>>((r) => r.data);
}

/** 菜单树（菜单管理用） */
export function listMenuTree(params?: Record<string, unknown>) {
  return http()
    .get("/v2/menu/list")
    .query((params ?? {}) as Record<string, unknown>)
    .then<ApiResult<SysMenuSettingVO[]>>((r) => r.data);
}

/** 菜单分页（备用） */
export function pageForMenu(params: { page?: number; pageSize?: number; sysMenuName?: string }) {
  return http()
    .get("/v2/menu/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysMenu>>>((r) => r.data);
}

/** 新增菜单 */
export function saveMenu(data: SysMenu) {
  return http()
    .post("/v2/menu/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysMenu>>((r) => r.data);
}

/** 更新菜单 */
export function updateMenu(data: SysMenu) {
  return http()
    .put("/v2/menu/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除菜单 */
export function deleteMenu(sysMenuId: number) {
  return http()
    .delete("/v2/menu/delete")
    .query({ sysMenuId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 部门管理 ================== */

/** 部门列表（树形） */
export function listDept() {
  return http()
    .get("/v2/dept/list")
    .then<ApiResult<SysDeptVO[]>>((r) => r.data);
}

/** 新增部门 */
export function saveDept(data: SysDept) {
  return http()
    .post("/v2/dept/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysDept>>((r) => r.data);
}

/** 更新部门 */
export function updateDept(data: SysDept) {
  return http()
    .put("/v2/dept/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除部门 */
export function deleteDept(deptId: number) {
  return http()
    .delete("/v2/dept/delete")
    .query({ deptId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 字典管理 ================== */

/** 字典分页 */
export function pageForDict(params: {
  page?: number;
  pageSize?: number;
  sysDictName?: string;
  sysDictCode?: string;
}) {
  return http()
    .get("/v2/dict/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysDict>>>((r) => r.data);
}

/** 字典列表（树形） */
export function listForDict() {
  return http()
    .get("/v2/dict/list")
    .then<ApiResult<SysDict[]>>((r) => r.data);
}

/** 字典子项分页 */
export function pageForDictItem(params: {
  page?: number;
  pageSize?: number;
  sysDictId?: number;
  sysDictItemLabel?: string;
}) {
  return http()
    .get("/v2/dict/item/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysDictItem>>>((r) => r.data);
}

/** 字典子项按字典 ID 查 */
export function listDictItem(sysDictId: number) {
  return http()
    .get("/v2/dict/item/list")
    .query({ sysDictId })
    .then<ApiResult<SysDictItem[]>>((r) => r.data);
}

/** 按字典编码查子项（带缓存） */
export function listDictItemByCode(sysDictCode: string) {
  return http()
    .get("/v2/dict/item/code")
    .query({ sysDictCode })
    .then<ApiResult<SysDictItem[]>>((r) => r.data);
}

/** 新增字典 */
export function saveDict(data: SysDict) {
  return http()
    .post("/v2/dict/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysDict>>((r) => r.data);
}

/** 更新字典 */
export function updateDict(data: SysDict) {
  return http()
    .put("/v2/dict/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除字典 */
export function deleteDict(sysDictId: number) {
  return http()
    .delete("/v2/dict/delete")
    .query({ sysDictId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 新增字典子项 */
export function saveDictItem(data: SysDictItem) {
  return http()
    .post("/v2/dict/item/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysDictItem>>((r) => r.data);
}

/** 更新字典子项 */
export function updateDictItem(data: SysDictItem) {
  return http()
    .put("/v2/dict/item/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除字典子项 */
export function deleteDictItem(sysDictItemId: number) {
  return http()
    .delete("/v2/dict/item/delete")
    .query({ sysDictItemId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 在线用户 ================== */

/** 在线用户列表 */
export function listOnline(params?: { username?: string; ip?: string }) {
  return http()
    .get("/v2/online/list")
    .query((params ?? {}) as Record<string, unknown>)
    .then<ApiResult<OnlineUser[]>>((r) => r.data);
}

/** 在线用户数 */
export function countOnline() {
  return http()
    .get("/v2/online/count")
    .then<ApiResult<number>>((r) => r.data);
}

/** 踢出单个用户 */
export function kickUser(userId: string) {
  return http()
    .delete(`/v2/online/kick/${userId}`)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 批量踢出 */
export function kickUsers(userIds: string[]) {
  return http()
    .delete("/v2/online/kick/batch")
    .data({ userIds })
    .then<ApiResult<number>>((r) => r.data);
}

/* ================== 系统设置 ================== */

/** 默认设置（应用启动配置） */
export function listForDefaultSetting() {
  return http()
    .get("/v2/setting/default")
    .then<ApiResult<SysSettingVO[]>>((r) => r.data);
}

/** 设置分页 */
export function pageForSetting(params: {
  page?: number;
  pageSize?: number;
  sysSettingName?: string;
  sysSettingCode?: string;
  sysSettingGroup?: string;
  sysSettingValueType?: string;
  sysSettingInSystem?: number;
}) {
  return http()
    .get("/v2/setting/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysSetting>>>((r) => r.data);
}

/** 按分组查设置 */
export function listForSetting(sysSettingGroup: string) {
  return http()
    .get("/v2/setting/list")
    .query({ sysSettingGroup })
    .then<ApiResult<SysSettingVO[]>>((r) => r.data);
}

/** 新增设置 */
export function saveSetting(data: SysSetting) {
  return http()
    .post("/v2/setting/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysSetting>>((r) => r.data);
}

/** 更新设置 */
export function updateSetting(data: SysSetting) {
  return http()
    .put("/v2/setting/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 批量更新 */
export function updateBatchSetting(data: SysSetting[]) {
  return http()
    .put("/v2/setting/updateBatch")
    .data(data as Record<string, unknown>[])
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除设置 */
export function deleteSetting(sysSettingId: number) {
  return http()
    .delete("/v2/setting/delete")
    .query({ sysSettingId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 反馈管理 ================== */

/** 反馈分页 */
export function pageForFeedback(params: { page?: number; pageSize?: number; sysFeedbackType?: string }) {
  return http()
    .get("/v2/feedback/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysFeedback>>>((r) => r.data);
}

/** 处理反馈 */
export function issueFeedback(data: FeedbackIssue) {
  return http()
    .put("/v2/feedback/issue")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 登录日志 ================== */

/** 登录日志分页 */
export function pageForUserLog(params: { page?: number; pageSize?: number; sysLogUsername?: string }) {
  return http()
    .get("/v2/user/log/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysUserLog>>>((r) => r.data);
}

/* ================== 租户管理 ================== */

/** 租户分页 */
export function pageForTenant(params: {
  page?: number;
  pageSize?: number;
  sysTenantName?: string;
  sysTenantUsername?: string;
  sysTenantPhone?: string;
  sysTenantStatus?: number;
}) {
  return http()
    .get("/v2/tenant/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysTenant>>>((r) => r.data);
}

/** 租户列表 */
export function listForTenant() {
  return http()
    .get("/v2/tenant/list")
    .then<ApiResult<SysTenant[]>>((r) => r.data);
}

/** 租户详情 */
export function getTenant(sysTenantId: string) {
  return http()
    .get("/v2/tenant/get")
    .query({ sysTenantId })
    .then<ApiResult<SysTenant>>((r) => r.data);
}

/** 新增租户 */
export function saveTenant(data: SysTenant) {
  return http()
    .post("/v2/tenant/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysTenant>>((r) => r.data);
}

/** 更新租户 */
export function updateTenant(data: SysTenant) {
  return http()
    .put("/v2/tenant/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除租户 */
export function deleteTenant(sysTenantId: string) {
  return http()
    .delete("/v2/tenant/delete")
    .query({ sysTenantId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 绑定租户服务（触发菜单重置推送） */
export function bindTenantService(data: TenantServiceBindRequest) {
  return http()
    .put("/v2/tenant/bind/service")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 更新租户状态 */
export function updateTenantStatus(sysTenantId: string, status: number) {
  return http()
    .put("/v2/tenant/status")
    .query({ sysTenantId, status })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 重置租户密码（推送给租户端） */
export function resetTenantPassword(sysTenantId: string, sysTenantPassword: string) {
  return http()
    .put("/v2/tenant/reset-password")
    .query({ sysTenantId, sysTenantPassword })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 重置租户菜单（按订阅重新计算并推送给租户端） */
export function resetTenantMenu(sysTenantId: string) {
  return http()
    .put("/v2/tenant/reset-menu")
    .query({ sysTenantId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 租户统计 */
export function tenantStats() {
  return http()
    .get("/v2/tenant/stats")
    .then<ApiResult<SysTenantStats>>((r) => r.data);
}

/** 服务列表（租户服务分配用） */
export function listForService() {
  return http()
    .get("/v2/service/list")
    .then<ApiResult<SysService[]>>((r) => r.data);
}

/** 操作日志分页列表 */
export function pageForSysLog(params: { page?: number; pageSize?: number; sysLogUsername?: string; sysLogFrom?: string; sysLogStatus?: number }) {
  return http()
    .get("/v2/log/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysLog>>>((r) => r.data);
}
