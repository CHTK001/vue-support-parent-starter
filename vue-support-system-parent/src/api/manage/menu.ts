import { http, type ReturnResult } from "@/utils/http";

export type Menu = {
  sysMenuId: number;
  sysMenuPid: number;
};

/** 删除系统配置 */
export const fetchDeleteMenu = id => {
  const params = { sysMenuId: id };
  return http.request<ReturnResult<Boolean>>("delete", "/v2/menu/delete", {
    params
  });
};

/** 保存角色配置 */
export const fetchSaveMenu = setting => {
  return http.request<Boolean>("post", "/v2/menu/save", { data: setting });
};

/** 更新角色配置 */
export const fetchUpdateMenu = setting => {
  if (!setting.sysMenuId) {
    return;
  }
  return http.request<Menu>("put", "/v2/menu/update", { data: setting });
};

/** 获取角色配置 */
export const fetchPageMenu = params => {
  return http.request<ReturnResult<Menu[]>>("get", "/v2/menu/page", {
    params
  });
};
/** 获取角色 */
export const fetchListMenu = params => {
  return http.request<ReturnResult<Menu[]>>("get", "/v2/menu/list", {
    params
  });
};
