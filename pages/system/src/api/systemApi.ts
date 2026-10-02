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
  CacheStats,
  FeedbackIssue,
  FeedbackStatistic,
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
  SysSettingHistory,
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
  SysMessageLog,
  TemplatePreviewRequest,
  TemplatePreviewResponse,
  MessageTemplateSendRequest,
  MessageByCodeSendRequest,
  SysMessageSendRequest,
  ErrorLogStatistic,
  AnnouncementReadStat,
  TotpStatus,
  TotpUriResponse,
  EmailConnectivity,
  RedisInfo,
  CacheModuleInfo,
  CacheValueInfo,
  ServerInfo,
  RestfulApiStats,
  RateLimitRule,
  RateLimitGlobal,
  AccountBlackwhite,
  AccountBlackwhitePage,
  HotReloadRuntimeResult,
  HotReloadConfig,
  PolicyConfig,
  PolicyHitDetail,
  HeaderRuleRow,
  HeaderPresets,
  RegisteredRoute,
} from "./types";

/** 将领域 DTO 适配为 HTTP 客户端接受的 JSON 对象，不创建运行时副本。 */
type JsonRequestObject<T extends object> = T & Record<string, unknown>;

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

/**
 * 更新角色数据权限（只写数据权限两列）
 * 数据权限属于角色配置项，管理员即可调整（系统内置角色同样适用），不走系统角色的「不允许修改」限制。
 */
export function updateRoleDataScope(data: {
  sysRoleId?: number;
  sysRoleDataScope?: number;
  sysRoleDataScopeDeptIds?: string;
}) {
  return http()
    .put("/v2/role/update_data_scope")
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
  scope?: string;
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

/* ================== 反馈管理 ================== */

/** 反馈分页 */
export function pageForFeedback(params: {
  page?: number;
  pageSize?: number;
  sysFeedbackType?: string;
  sysFeedbackPlatform?: string;
  sysFeedbackContent?: string;
  sysFeedbackPriority?: number;
  createTimeStart?: string;
  createTimeEnd?: string;
  recoverTimeStart?: string;
  recoverTimeEnd?: string;
  order?: string;
}) {
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
export function pageForUserLog(params: {
  page?: number;
  pageSize?: number;
  sysLogUsername?: string;
  sysLogStatus?: number;
}) {
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
    .query({ postId: sysPostId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 批量更新字典子项排序 */
export function updateDictItemSortBatch(list: Array<{ sysDictItemId: number; sysDictItemSort: number }>) {
  return http()
    .put("/v2/dict/item/update-sort")
    .data(list)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 批量更新字典分类排序 */
export function updateDictSortBatch(list: Array<{ sysDictId: number; sysDictSort: number }>) {
  return http()
    .put("/v2/dict/update-sort")
    .data(list)
    .then<ApiResult<boolean>>((r) => r.data);
}
/** 批量更新岗位排序 */
export function updatePostSortBatch(list: Array<{ sysPostId: number; sysPostSort: number }>) {
  return http()
    .put("/v2/post/update-sort")
    .data(list)
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
  sysMessageChannel?: string;
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
  // 返回类型是 PageResult：/v2/ip/page 原始响应多一层 {code:0,msg,data:{...}}，
  // 但 http 响应拦截器（checkApiResponse）已展平，业务侧直接就是分页体
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
    .data(data as JsonRequestObject<SysMessageSendRequest>)
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
  sysMessageTemplateType?: string;
  sysMessageChannel?: string;
  /**
   * 状态：1=启用 0=禁用；传空串表示「全部」。
   * 后端实体该字段默认值为 1，不显式传会被默认按「启用」过滤，导致禁用模板不显示。
   */
  sysMessageTemplateStatus?: number | string;
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
    .data(data as JsonRequestObject<SysMessageTemplate>)
    .then<ApiResult<SysMessageTemplate>>((r) => r.data);
}

/** 更新消息模板 */
export function updateMessageTemplate(data: SysMessageTemplate) {
  return http()
    .put("/v2/message/template/update")
    .data(data as JsonRequestObject<SysMessageTemplate>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除消息模板 */
export function deleteMessageTemplate(sysMessageTemplateId: number) {
  return http()
    .delete("/v2/message/template/delete")
    .query({ sysMessageTemplateId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 模板预览与发送 ================== */

/** 模板预览 */
export function previewMessageTemplate(data: TemplatePreviewRequest) {
  return http()
    .post("/v2/message/template/preview")
    .data(data as JsonRequestObject<TemplatePreviewRequest>)
    .then<ApiResult<TemplatePreviewResponse>>((r) => r.data);
}

/** 按模板发送消息 */
export function sendMessageByTemplate(data: MessageTemplateSendRequest) {
  return http()
    .post("/v2/message/send")
    .data(data as JsonRequestObject<MessageTemplateSendRequest>)
    .then<ApiResult<Array<{ success: boolean; errorMessage?: string; durationMillis?: number; messageId?: string }>>>((r) => r.data);
}

/** 按模板编码发送消息 */
export function sendMessageByCode(data: MessageByCodeSendRequest) {
  return http()
    .post("/v2/message/send/by-code")
    .data(data as JsonRequestObject<MessageByCodeSendRequest>)
    .then<ApiResult<Array<{ success: boolean; errorMessage?: string; durationMillis?: number; messageId?: string }>>>((r) => r.data);
}

/** 同步运营商模板（按渠道同步：EMAIL/SMS，不传则全量） */
export function syncMessageTemplate(channel?: string) {
  const url = channel ? `/v2/message/template/sync?channel=${channel}` : "/v2/message/template/sync";
  return http()
    .post(url)
    .then<ApiResult<number>>((r) => r.data);
}

/* ================== 消息推送日志 ================== */

/** 消息推送日志分页 */
export function pageForMessageLog(params: {
  page?: number;
  pageSize?: number;
  sysMessageLogTarget?: string;
  sysMessageCode?: string;
}) {
  return http()
    .get("/v2/message/log/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<SysMessageLog>>>((r) => r.data);
}

/** 清理消息推送日志 */
export function cleanMessageLog(beforeTime: string) {
  return http()
    .post("/v2/message/log/clean")
    .query({ beforeTime })
    .then<ApiResult<number>>((r) => r.data);
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

/* ================== 服务器邮箱通道 ================== */

/** 探测服务器 SMTP 发信与 IMAP 收信通道（仅管理员），返回两侧握手结论 */
export function checkEmailConnectivity() {
  return http()
    .post("/v2/email/check")
    .then<ApiResult<EmailConnectivity>>((r) => r.data);
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

/* ================== Redis 监控 ================== */

/** Redis 运行信息 */
export function getRedisInfo() {
  return http()
    .get("/v2/redis/info")
    .then<ApiResult<RedisInfo>>((r) => r.data);
}

/* ================== 缓存监控（三栏钻取） ================== */

/** 缓存统计概览 */
export function getCacheStats() {
  return http()
    .get("/v2/cache/stats")
    .then<ApiResult<CacheStats>>((r) => r.data);
}

/** 缓存模块列表 */
export function listCacheMonitorModules() {
  return http()
    .get("/v2/cache/modules")
    .then<ApiResult<CacheModuleInfo[]>>((r) => r.data);
}

/** 指定模块下的 Key 列表（返回 string[]） */
export function listCacheMonitorKeys(module: string) {
  return http()
    .get("/v2/cache/keys")
    .query({ module })
    .then<ApiResult<string[]>>((r) => r.data);
}

/** 获取单个缓存值 */
export function getCacheValue(key: string, module?: string) {
  return http()
    .get("/v2/cache/value")
    .query(module ? { key, module } : { key })
    .then<ApiResult<CacheValueInfo>>((r) => r.data);
}

/**
 * 修改缓存值（仅 Spring Cache 管理的缓存）
 *
 * value 传「业务 JSON」（不含 @class 类型信封），后端按原类型还原后写回。
 * Spring Cache 无单条 TTL，写入不改变 TTL；嵌套泛型集合会退化为通用结构。
 */
export function updateCacheValue(data: { module: string; key: string; value: string }) {
  return http()
    .put("/v2/cache/value")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除单个缓存 Key */
export function deleteCacheMonitorKey(key: string) {
  return http()
    .delete("/v2/cache/key")
    .query({ key })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 清空整个缓存模块（返回删除数量） */
export function clearCacheMonitorModule(module: string) {
  return http()
    .delete("/v2/cache/module")
    .query({ module })
    .then<ApiResult<number>>((r) => r.data);
}

/* ================== 服务监控 ================== */

/** 服务器运行信息 */
export function getServerInfo() {
  return http()
    .get("/v2/server/info")
    .then<ApiResult<ServerInfo>>((r) => r.data);
}

/** RESTful 实时统计（常规请求趋势 + QPS）——轮询专用，关进度条/静默失败 */
export function getRestfulApiStats() {
  return http()
    .get("/v2/server/api/stats")
    .loading(false)
    .noToast(true)
    .then<ApiResult<RestfulApiStats>>((r) => r.data);
}

/** Actuator 端点原始 JSON（actuator 不走 ApiResult 包装，直接取 response body） */
export function getActuatorEndpoint(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return http()
    .get(`/actuator${p === "/" ? "" : p}`)
    .then((r) => r.data as unknown);
}

/** 修改指定 logger 的日志级别（actuator loggers 写接口，返回 204） */
export function setActuatorLogger(name: string, level: string) {
  return http()
    .post(`/actuator/loggers/${encodeURIComponent(name)}`)
    .data({ configuredLevel: level === "INHERITED" ? null : level })
    .loading(false)
    .noToast(true)
    .then((r) => r.data as unknown);
}

/** 可编辑定时任务（动态调度注册中心） */
export interface ManagedScheduleTask {
  key?: string;
  label?: string;
  cron?: string;
  enabled?: boolean;
  nextTime?: string;
  lastTime?: string;
  lastStatus?: string;
}

/** 定时任务列表 */
export function getScheduleTasks() {
  return http()
    .get("/v2/schedule/tasks")
    .loading(false)
    .noToast(true)
    .then<ApiResult<ManagedScheduleTask[]>>((r) => r.data);
}

/** 更新定时任务 cron / 启停 */
export function updateScheduleTask(key: string, data: { cron?: string; enabled?: boolean }) {
  return http()
    .put(`/v2/schedule/tasks/${encodeURIComponent(key)}`)
    .data(data)
    .loading(false)
    .noToast(true)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 立即执行一次定时任务 */
export function runScheduleTask(key: string) {
  return http()
    .post(`/v2/schedule/tasks/${encodeURIComponent(key)}/run`)
    .loading(false)
    .noToast(true)
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 策略任务 - 限流 ================== */

/** 限流规则列表（按维度） */
export function listRateLimit(dimension?: RateLimitRule["dimension"]) {
  return http()
    .get("/v2/policy/ratelimit/list")
    .query({ dimension })
    .then<ApiResult<RateLimitRule[]>>((r) => r.data);
}

/** 新增限流规则 */
export function saveRateLimit(data: RateLimitRule) {
  return http()
    .post("/v2/policy/ratelimit/save")
    .data(data as JsonRequestObject<RateLimitRule>)
    .then<ApiResult<RateLimitRule>>((r) => r.data);
}

/** 更新限流规则 */
export function updateRateLimit(data: RateLimitRule) {
  return http()
    .put("/v2/policy/ratelimit/update")
    .data(data as JsonRequestObject<RateLimitRule>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除限流规则 */
export function deleteRateLimit(id: number) {
  return http()
    .delete("/v2/policy/ratelimit/delete")
    .query({ id })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 全局限流配置 */
export function getRateLimitGlobal() {
  return http()
    .get("/v2/policy/ratelimit/global")
    .then<ApiResult<RateLimitGlobal>>((r) => r.data);
}

/** 应用全局限流配置（后端返回提示文本） */
export function applyRateLimitGlobal(data: RateLimitGlobal) {
  return http()
    .post("/v2/policy/ratelimit/global/apply")
    .data(data as JsonRequestObject<RateLimitGlobal>)
    .then<ApiResult<string>>((r) => r.data);
}

/* ================== 策略任务 - 账号黑白名单 ================== */

/** 账号黑白名单分页（后端记录位于 list） */
export function pageForAccountBw(params: {
  page?: number;
  pageSize?: number;
  account?: string;
  type?: AccountBlackwhite["type"];
  status?: AccountBlackwhite["status"];
}) {
  return http()
    .get("/v2/policy/account-bw/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<AccountBlackwhitePage>>((r) => r.data);
}

/** 新增账号黑白名单 */
export function saveAccountBw(data: AccountBlackwhite) {
  return http()
    .post("/v2/policy/account-bw/save")
    .data(data as JsonRequestObject<AccountBlackwhite>)
    .then<ApiResult<AccountBlackwhite>>((r) => r.data);
}

/** 更新账号黑白名单 */
export function updateAccountBw(data: AccountBlackwhite) {
  return http()
    .put("/v2/policy/account-bw/update")
    .data(data as JsonRequestObject<AccountBlackwhite>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除账号黑白名单 */
export function deleteAccountBw(id: number) {
  return http()
    .delete("/v2/policy/account-bw/delete")
    .query({ id })
    .then<ApiResult<boolean>>((r) => r.data);
}

/* ================== 策略任务 - 热更新 ================== */

/** 热更新配置列表 */
export function listHotReload() {
  return http()
    .get("/v2/policy/hotreload/list")
    .then<ApiResult<HotReloadConfig[]>>((r) => r.data);
}

/** 保存热更新配置（有 ID 更新，无 ID 新增） */
export function saveHotReload(data: HotReloadConfig) {
  return http()
    .post("/v2/policy/hotreload/save")
    .data(data as JsonRequestObject<HotReloadConfig>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 主动热重载全部配置（清理 AOP 使用的 Redis 缓存，下一次访问按需回填） */
/** 删除热更新配置 */
export function deleteHotReload(id: number) {
  return http()
    .delete("/v2/policy/hotreload/delete")
    .query({ id })
    .then<ApiResult<boolean>>((r) => r.data);
}

export function reloadHotReload() {
  return http()
    .post("/v2/policy/hotreload/reload")
    .then<ApiResult<HotReloadRuntimeResult>>((r) => r.data);
}

/* ================== 策略任务 - 统一策略配置（灰度 / 功能开关） ================== */

/**
 * 按 type 分页查询统一策略配置。
 *
 * @param params type 必填（GRAY / FEATURE），其余为分页与过滤项
 */
export function pagePolicyConfig(params: {
  type: string;
  page?: number;
  pageSize?: number;
  bizKey?: string;
  status?: number;
}) {
  return http()
    .get("/v2/policy/config/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<PolicyConfig>>>((r) => r.data);
}

/** 新增统一策略配置 */
export function savePolicyConfig(data: PolicyConfig) {
  return http()
    .post("/v2/policy/config/save")
    .data(data as JsonRequestObject<PolicyConfig>)
    .then<ApiResult<PolicyConfig>>((r) => r.data);
}

/** 更新统一策略配置（类型与业务键不可改写，后端会强制保留原值） */
export function updatePolicyConfig(data: PolicyConfig) {
  return http()
    .put("/v2/policy/config/update")
    .data(data as JsonRequestObject<PolicyConfig>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除统一策略配置 */
export function deletePolicyConfig(id: number) {
  return http()
    .delete("/v2/policy/config/delete")
    .query({ id })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 切换统一策略配置启用状态 */
export function togglePolicyConfig(id: number, status: number) {
  return http()
    .put("/v2/policy/config/toggle")
    .query({ id, status })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 各类型配置条数统计 */
export function countPolicyConfig() {
  return http()
    .get("/v2/policy/config/count")
    .then<ApiResult<Record<string, number>>>((r) => r.data);
}

/** 功能开关在线状态（业务键 → 是否启用） */
export function listFeatureStates() {
  return http()
    .get("/v2/policy/feature/list")
    .then<ApiResult<Record<string, boolean>>>((r) => r.data);
}

/** 框架侧已注册、可被在线配置的功能点标识 */
export function listRegisteredFeatures() {
  return http()
    .get("/v2/policy/feature/registered")
    .then<ApiResult<string[]>>((r) => r.data);
}

/** 启用中的灰度配置（业务键 → 配置行） */
export function listEnabledGray() {
  return http()
    .get("/v2/policy/gray/list")
    .then<ApiResult<Record<string, PolicyConfig>>>((r) => r.data);
}

/* ==================== 接口停用 / 转发 ==================== */

/**
 * 可作为转发目标的应用内已注册路由
 *
 * <p>转发目标只能从这份列表里选：目标路径由服务端从 Spring 已注册的
 * {@code @RequestMapping} 反查，配置面写不了任意外部地址。</p>
 */
export function listApiRouteTargets(keyword?: string) {
  // 不能写 .query({ keyword })：keyword 为 undefined 时序列化器会发出字面量
  // `keyword=undefined`，后端把它当真实过滤词。要么不带参数，要么带真值。
  const q = keyword ? { keyword } : {};
  return http()
    .get("/v2/policy/api-route/targets")
    .query(q)
    .then<ApiResult<RegisteredRoute[]>>((r) => r.data);
}

/** 重新采集已注册路由并重载停用/转发策略 */
export function refreshApiRoute() {
  return http()
    .post("/v2/policy/api-route/refresh")
    .then<ApiResult<{ routeCount: number; policyCount: number }>>((r) => r.data);
}

/**
 * 全部策略的命中次数，键为 `类型|策略键`
 *
 * <p>一次取回整张映射，列表页用它填「命中次数」列，避免每行发一次请求。</p>
 */
export function policyHitCounts() {
  return http()
    .get("/v2/policy/hit/counts")
    .then<ApiResult<Record<string, number>>>((r) => r.data);
}

/** 单条策略的命中明细：累计次数、来源 IP 排行、分钟级趋势 */
export function policyHitDetail(type: string, key: string) {
  return http()
    .get("/v2/policy/hit/detail")
    .query({ type, key })
    .then<ApiResult<PolicyHitDetail>>((r) => r.data);
}

/* ================== 策略任务 - 消息头拦截 ================== */

/** 消息头拦截规则列表（后端已解析 config，前端直接展示/编辑） */
export function listHeaderRules() {
  return http()
    .get("/v2/policy/header/list")
    .then<ApiResult<HeaderRuleRow[]>>((r) => r.data);
}

/** 爬虫 / 自动化客户端的 UA 特征预设，用于「一键填入」 */
export function listHeaderPresets() {
  return http()
    .get("/v2/policy/header/presets")
    .then<ApiResult<HeaderPresets>>((r) => r.data);
}

/**
 * 重载全部消息头拦截规则
 *
 * <p>正常情况下保存/启停/删除即生效，这里用于手工改过库之后补救。</p>
 */
export function refreshHeaderRules() {
  return http()
    .post("/v2/policy/header/refresh")
    .then<ApiResult<{ policyCount: number }>>((r) => r.data);
}

/* ================== 备注 ==================
 * 后端 SysRoleController 未提供 /v2/role/copy 与 /v2/role/users 接口：
 *   - 角色复制：后端无此接口，前端 RoleManage 保留本地兜底实现；
 *   - 角色下用户分页：后端无此接口，前端 RoleManage 使用 pageForUser 兜底。
 * 因此此处不导出 copyRole / pageForRoleUsers。
 */
