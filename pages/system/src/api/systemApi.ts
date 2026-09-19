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
  SysPost,
  CacheModule,
  CacheKey,
  SysMessageAdmin,
  MessageStatistic,
  SysIpBlackwhite,
  SysErrorLog,
  ErrorStatistic,
  JvmInfo,
  SysPostQuery,
  SysCacheInfo,
  SysMessageTemplate,
  SysMessageSendRequest,
  ErrorLogStatistic,
  AnnouncementReadStat,
  TotpStatus,
  TotpUriResponse,
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
    .then((r: any) => {
      console.log('saveUser raw response:', r);
      const body = r?.data ?? r;
      console.log('saveUser body:', body);
      if (body && (body.ok === false || body.success === false)) {
        throw new Error(body.msg || "新增失败");
      }
      return body;
    });
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

/** 批量删除用户 */
export function deleteUsers(sysUserIds: number[]) {
  return http()
    .delete("/v2/user/delete/batch")
    .data({ sysUserIds })
    .then<ApiResult<number>>((r) => r.data);
}

/** 批量更新用户状态 */
export function updateUsersStatus(sysUserIds: number[], sysUserStatus: number) {
  return http()
    .put("/v2/user/status/batch")
    .data({ sysUserIds, sysUserStatus })
    .then<ApiResult<number>>((r) => r.data);
}

/** 导出用户列表（按当前筛选条件，返回 Blob） */
export function exportUsers(params: SysUserQuery) {
  return http()
    .get("/v2/user/export")
    .query(params as Record<string, unknown>)
    .responseType("blob")
    .then((r) => r.data as Blob);
}

/** 下载用户导入模板（返回 Blob） */
export function downloadUserTemplate() {
  return http()
    .get("/v2/user/template")
    .responseType("blob")
    .then((r) => r.data as Blob);
}

/** 导入用户（MultipartFile 上传） */
export function importUsers(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return http()
    .post("/v2/user/import")
    .data(formData)
    .then<ApiResult<string>>((r) => r.data);
}

/** 重置用户密码（管理员操作） */
export function resetUserPassword(userId: number, password?: string) {
  return http()
    .post("/v2/user/reset")
    .query({ userId, ...(password ? { password } : {}) })
    .then<string>((r) => {
      const body = r as unknown as { data: { data: string } };
      return body.data.data;
    });
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

/** 获取个人偏好配置（云端） */
export function getUserPreference() {
  return http()
    .get("/v2/user/preference")
    .then<ApiResult<string>>((r) => r.data);
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

/** 刷新菜单缓存 */
export function refreshMenuCache() {
  return http()
    .delete("/v2/menu/cache/refresh")
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

/** 刷新字典缓存 */
export function refreshDictCache() {
  return http()
    .delete("/v2/dict/cache/refresh")
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
    .data(userIds)
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

/* ================== 设置变更历史 ================== */

/** 设置变更历史分页 */
export function pageForSettingHistory(params: {
  page?: number;
  pageSize?: number;
  settingId?: number;
  group?: string;
}) {
  return http()
    .get("/v2/setting/history/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysSettingHistory>>>((r) => r.data);
}

/** 按批次号查询变更历史 */
export function listSettingHistoryByBatch(batchNo: string) {
  return http()
    .get("/v2/setting/history/batch")
    .query({ batchNo })
    .then<ApiResult<SysSettingHistory[]>>((r) => r.data);
}

/** 导出配置（后端返回 JSON 配置字符串，非文件流） */
export function exportSetting(group?: string) {
  return http()
    .get("/v2/setting/export")
    .query({ group })
    .then<ApiResult<string>>((r) => r.data);
}

/** 导入配置（后端接收原始 JSON 字符串 body + overwrite 查询参数，非 multipart） */
export function importSetting(json: string, overwrite = false) {
  return http()
    .post("/v2/setting/import")
    .query({ overwrite })
    .data(json)
    .then<ApiResult<string>>((r) => r.data);
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

/** 反馈统计 */
export function getFeedbackStatistic() {
  return http()
    .get("/v2/feedback/statistic")
    .then<ApiResult<FeedbackStatistic>>((r) => r.data);
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

/** 导出操作日志 */
export function exportSysLog(params: Record<string, unknown>) {
  return http()
    .get("/v2/log/export")
    .query(params)
    .responseType("blob")
    .then((r) => r.data);
}

/** 导出登录日志 */
export function exportUserLog(params: Record<string, unknown>) {
  return http()
    .get("/v2/user/log/export")
    .query(params)
    .responseType("blob")
    .then((r) => r.data);
}

/* ================== 岗位管理 ================== */

/** 岗位列表（全部，下拉用） */
export function listForPost() {
  return http()
    .get("/v2/post/list")
    .then<ApiResult<SysPost[]>>((r) => r.data);
}

/** 岗位分页 */
export function pageForPost(params: SysPostQuery) {
  return http()
    .get("/v2/post/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysPost>>>((r) => r.data);
}

/** 新增岗位 */
export function savePost(data: SysPost) {
  return http()
    .post("/v2/post/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysPost>>((r) => r.data);
}

/** 更新岗位 */
export function updatePost(data: SysPost) {
  return http()
    .put("/v2/post/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除岗位 */
export function deletePost(sysPostId: number) {
  return http()
    .delete("/v2/post/delete")
    .query({ sysPostId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 缓存管理 ================== */

/** 缓存模块列表 */
export function listCacheModules() {
  return http()
    .get("/v2/cache/modules")
    .then<ApiResult<CacheModule[]>>((r) => r.data);
}

/** 指定模块下的 Key 列表 */
export function listCacheKeys(module: string) {
  return http()
    .get("/v2/cache/keys")
    .query({ module })
    .then<ApiResult<CacheKey[]>>((r) => r.data);
}

/** 删除单个 Key */
export function deleteCacheKey(key: string) {
  return http()
    .delete("/v2/cache/key")
    .query({ key })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 清空单个模块 */
export function clearCacheModule(module: string) {
  return http()
    .delete("/v2/cache/module")
    .query({ module })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 清空全部缓存 */
export function clearAllCache() {
  return http()
    .delete("/v2/cache/all")
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 消息管理（管理端） ================== */

/** 消息分页（管理员） */
export function pageForMessageAdmin(params: {
  page?: number;
  pageSize?: number;
  sysMessageTitle?: string;
  sysMessageType?: string;
  sysMessageLevel?: string;
  sysMessageStatus?: number;
  sysMessageReceiverId?: number;
}) {
  return http()
    .get("/v2/message/sys-message/admin/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysMessageAdmin>>>((r) => r.data);
}

/** 新增消息 */
export function saveMessageAdmin(data: SysMessageAdmin) {
  return http()
    .post("/v2/message/admin/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysMessageAdmin>>((r) => r.data);
}

/** 删除消息 */
export function deleteMessageAdmin(sysMessageId: number) {
  return http()
    .delete("/v2/message/admin/delete")
    .query({ sysMessageId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 消息统计 */
export function statisticMessageAdmin() {
  return http()
    .get("/v2/message/admin/statistic")
    .then<ApiResult<MessageStatistic>>((r) => r.data);
}

/* ================== IP 黑白名单 ================== */

/** IP 黑白名单分页 */
export function pageForIp(params: {
  page?: number;
  pageSize?: number;
  sysIpIp?: string;
  sysIpType?: number;
  sysIpStatus?: number;
}) {
  return http()
    .get("/v2/ip/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysIpBlackwhite>>>((r) => r.data);
}

/** 新增 IP 名单 */
export function saveIp(data: SysIpBlackwhite) {
  return http()
    .post("/v2/ip/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysIpBlackwhite>>((r) => r.data);
}

/** 更新 IP 名单 */
export function updateIp(data: SysIpBlackwhite) {
  return http()
    .put("/v2/ip/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除 IP 名单 */
export function deleteIp(sysIpId: number) {
  return http()
    .delete("/v2/ip/delete")
    .query({ sysIpId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** IP 归属地查询 */
export function lookupIp(ip: string) {
  return http()
    .get("/v2/ip/lookup")
    .query({ ip })
    .then<ApiResult<string>>((r) => r.data);
}

/* ================== 错误日志 ================== */

/** 错误日志分页 */
export function pageForErrorLog(params: {
  page?: number;
  pageSize?: number;
  sysErrorSource?: string;
  sysErrorStatus?: number;
  sysErrorMessage?: string;
  sysErrorLogType?: string;
  sysErrorLogUrl?: string;
  sysErrorLogUsername?: string;
  startTime?: string;
  endTime?: string;
}) {
  return http()
    .get("/v2/log/error-page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysErrorLog>>>((r) => r.data);
}

/** 错误日志详情 */
export function getErrorLogDetail(sysErrorLogId: number) {
  return http()
    .get("/v2/log/error-detail")
    .query({ sysErrorLogId })
    .then<ApiResult<SysErrorLog>>((r) => r.data);
}

/** 错误统计（按类型） */
export function statisticErrorLog() {
  return http()
    .get("/v2/log/error-statistic")
    .then<ApiResult<ErrorStatistic[]>>((r) => r.data);
}

/** 清理 N 天前的错误日志 */
export function cleanErrorLog(days: number) {
  return http()
    .delete("/v2/log/error/clean")
    .query({ days })
    .then<ApiResult<number>>((r) => r.data);
}

/* ================== JVM 系统监控 ================== */

/** JVM 运行时信息 */
export function getJvmInfo() {
  return http()
    .get("/v2/jvm/info")
    .then<ApiResult<JvmInfo>>((r) => r.data);
}

/* ================== 缓存管理（新口径：固定 6 项刷新） ================== */

/** 缓存信息列表（角色/字典/部门/设置/菜单/用户） */
export function listCache() {
  return http()
    .get("/v2/cache/list")
    .then<ApiResult<SysCacheInfo[]>>((r) => r.data);
}

/** 刷新指定缓存 */
export function refreshCache(cacheName: string) {
  return http()
    .delete("/v2/cache/refresh")
    .query({ cacheName })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 刷新全部缓存 */
export function refreshAllCache() {
  return http()
    .delete("/v2/cache/refresh/all")
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 消息发送/撤回/删除（管理员） ================== */

/** 发送消息 */
export function sendMessage(data: SysMessageSendRequest) {
  return http()
    .post("/v2/message/sys-message/admin/send")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 撤回消息 */
export function recallMessage(sysMessageId: number) {
  return http()
    .put("/v2/message/sys-message/admin/recall")
    .query({ sysMessageId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除消息 */
export function deleteMessage(sysMessageId: number) {
  return http()
    .delete("/v2/message/sys-message/admin/delete")
    .query({ sysMessageId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 消息模板 ================== */

/** 消息模板分页 */
export function pageForMessageTemplate(params: {
  page?: number;
  pageSize?: number;
  sysMessageTemplateName?: string;
  sysMessageTemplateCode?: string;
}) {
  return http()
    .get("/v2/message/template/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysMessageTemplate>>>((r) => r.data);
}

/** 消息模板列表（下拉用） */
export function listForMessageTemplate() {
  return http()
    .get("/v2/message/template/list")
    .then<ApiResult<SysMessageTemplate[]>>((r) => r.data);
}

/** 新增消息模板 */
export function saveMessageTemplate(data: SysMessageTemplate) {
  return http()
    .post("/v2/message/template/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<SysMessageTemplate>>((r) => r.data);
}

/** 更新消息模板 */
export function updateMessageTemplate(data: SysMessageTemplate) {
  return http()
    .put("/v2/message/template/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除消息模板 */
export function deleteMessageTemplate(sysMessageTemplateId: number) {
  return http()
    .delete("/v2/message/template/delete")
    .query({ sysMessageTemplateId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 异常日志（新口径） ================== */

/** 异常日志统计 */
export function getErrorLogStatistic() {
  return http()
    .get("/v2/log/error-statistic")
    .then<ApiResult<ErrorLogStatistic>>((r) => r.data);
}

/** 更新异常日志处理状态（0未处理 1已处理 2已忽略） */
export function updateErrorLogStatus(sysErrorLogId: number, status: number) {
  return http()
    .put("/v2/log/error/status")
    .query({ sysErrorLogId, status })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除异常日志 */
export function deleteErrorLog(sysErrorLogId: number) {
  return http()
    .delete("/v2/log/error/delete")
    .query({ sysErrorLogId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 设置回滚（新口径别名） ================== */

/** 回滚单条配置到指定历史记录 */
export function rollbackSettingHistorySingle(historyId: number) {
  return http()
    .post("/v2/setting/history/rollback/single")
    .query({ historyId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 按批次回滚配置 */
export function rollbackSettingHistoryBatch(batchNo: string) {
  return http()
    .post("/v2/setting/history/rollback/batch")
    .query({ batchNo })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 解密设置值 */
export function decryptSettingValue(settingId: number) {
  return http()
    .get("/v2/setting/decrypt")
    .query({ settingId })
    .then<ApiResult<string>>((r) => r.data);
}

/* ================== 公告已读统计 ================== */

/** 公告已读统计 */
export function getAnnouncementReadStat(announcementId: number) {
  return http()
    .get("/v2/announcement/read-stat")
    .query({ announcementId })
    .then<ApiResult<AnnouncementReadStat>>((r) => r.data);
}

/** 公告已读用户分页 */
export function pageForAnnouncementReadUsers(params: {
  announcementId: number;
  page?: number;
  pageSize?: number;
}) {
  return http()
    .get("/v2/announcement/read-users")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<{ sysUserId: number; sysUserName: string; readTime: string }>>>(
      (r) => r.data,
    );
}

/* ================== TOTP/2FA ================== */

/** 查询当前用户 TOTP 开启状态 */
export function getTotpStatus() {
  return http()
    .get("/v2/user/totp/status")
    .then<ApiResult<TotpStatus>>((r) => r.data);
}

/** 生成 TOTP 绑定 URI */
export function generateTotpUri() {
  return http()
    .get("/v2/user/totp/generateUri")
    .then<ApiResult<TotpUriResponse>>((r) => r.data);
}

/** 生成 TOTP 二维码（返回 Blob） */
export function generateTotpQrcode() {
  return http()
    .get("/v2/user/totp/generate")
    .responseType("blob")
    .then((r) => r.data as Blob);
}

/** 绑定 TOTP */
export function bindTotp(code: string) {
  return http()
    .put("/v2/user/totp/bind")
    .query({ code })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 解绑 TOTP */
export function unbindTotp() {
  return http()
    .put("/v2/user/totp/unbind")
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 校验 TOTP 验证码 */
export function verifyTotp(code: string) {
  return http()
    .get("/v2/user/totp/verify")
    .query({ code })
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 用户锁定 ================== */

/** 锁定/解锁用户 */
export function lockUser(sysUserId: number, lock: number) {
  return http()
    .put("/v2/user/lock")
    .query({ sysUserId, lock })
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 菜单按钮批量操作 ================== */

/** 批量保存菜单按钮 */
export function batchSaveMenuButtons(data: Array<Record<string, unknown>>) {
  return http()
    .post("/v2/menu/button/batch-save")
    .data(data as Record<string, unknown>[])
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 批量删除菜单按钮 */
export function batchDeleteMenuButtons(sysMenuIds: number[]) {
  return http()
    .delete("/v2/menu/button/batch-delete")
    .data(sysMenuIds as unknown as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 个人设置云端同步 ================== */

/**
 * 保存个人偏好配置（云端）
 * 后端 PUT /v2/user/preference 接收原始 JSON 字符串 body（@RequestBody String），
 * 故此处入参为已序列化的偏好 JSON 字符串。
 */
export function updateUserPreference(preference: string) {
  return http()
    .put("/v2/user/preference")
    .data(preference)
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 备注 ==================
 * 后端 SysRoleController 未提供 /v2/role/copy 与 /v2/role/users 接口：
 *   - 角色复制：后端无此接口，前端 RoleManage 保留本地兜底实现；
 *   - 角色下用户分页：后端无此接口，前端 RoleManage 使用 pageForUser 兜底。
 * 因此此处不导出 copyRole / pageForRoleUsers。
 */
