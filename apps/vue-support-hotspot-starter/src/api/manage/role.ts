import { http, type ReturnResult } from "@repo/utils";

export type Role = {
  sysRoleId: number;
  sysRoleName: string;
  sysRoleCode: string;
  sysRoleInSystem: number;
  sysRoleRemark: string;
};

/** 获取角色菜单 */
export const fetchGetRoleMenu = params => {
  return http.request<ReturnResult<number[]>>("get", "/v2/role/get_menu", {
    params
  });
};
/** 更新角色菜单 */
export const fetchUpdateRoleMenu = setting => {
  return http.request<ReturnResult<Boolean>>("put", "/v2/role/update_menu", {
    data: setting
  });
};

/** 删除系统配置 */
export const fetchDeleteRole = id => {
  const params = { sysRoleId: id };
  return http.request<ReturnResult<Boolean>>("delete", "/v2/role/delete", {
    params
  });
};

/** 保存角色配置 */
export const fetchSaveRole = setting => {
  return http.request<Boolean>("post", "/v2/role/save", { data: setting });
};

/** 更新角色配置 */
export const fetchUpdateRole = setting => {
  if (!setting.sysRoleId) {
    return;
  }
  return http.request<Role>("put", "/v2/role/update", { data: setting });
};

/** 获取角色配置 */
export const fetchPageRole = params => {
  return http.request<ReturnResult<Role[]>>("get", "/v2/role/page", {
    params
  });
};
/** 获取角色 */
export const fetchListRole = params => {
  return http.request<ReturnResult<Role[]>>("get", "/v2/role/list", {
    params
  });
};
