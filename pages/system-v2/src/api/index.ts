/**
 * 系统管理 v2 API 层
 * 直接复用后端现有接口，前端做数据格式转换
 */
import { http, type ReturnResult } from "@repo/utils";
import {
  adaptRole, adaptRoleList,
  adaptMenuList,
  adaptDeptList,
  adaptUser, adaptUserList,
  adaptDictList, adaptDictDataList,
  adaptPostList,
  adaptNoticeList,
  adaptLoginLogList,
  adaptOperLogList,
} from "./adapter";

// ========== 用户管理 ==========
export const apiUser = {
  page: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/user/page", { params })
      .then(r => ({ ...r, data: adaptUserList(r.data) })),
  list: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/user/list", { params })
      .then(r => ({ ...r, data: adaptUserList(r.data) })),
  save: (data: any) =>
    http.request<ReturnResult<any>>("post", "/v2/user/save", { data }),
  update: (data: any) =>
    http.request<ReturnResult<any>>("put", "/v2/user/update", { data }),
  delete: (id: number | string) =>
    http.request<ReturnResult<boolean>>("delete", "/v2/user/delete", {
      params: { userId: id },
    }),
  resetPwd: (data: any) =>
    http.request<ReturnResult<any>>("put", "/v2/user/resetPwd", { data }),
};

// ========== 角色管理 ==========
export const apiRole = {
  page: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/role/page", { params })
      .then(r => ({ ...r, data: adaptRoleList(r.data) })),
  list: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/role/list", { params })
      .then(r => ({ ...r, data: adaptRoleList(r.data) })),
  save: (data: any) =>
    http.request<ReturnResult<any>>("post", "/v2/role/save", { data }),
  update: (data: any) =>
    http.request<ReturnResult<any>>("put", "/v2/role/update", { data }),
  delete: (id: number | string) =>
    http.request<ReturnResult<boolean>>("delete", "/v2/role/delete", {
      params: { roleId: id },
    }),
  getMenu: (params: any) =>
    http.request<ReturnResult<number[]>>("get", "/v2/role/get_menu", { params }),
  updateMenu: (data: any) =>
    http.request<ReturnResult<boolean>>("put", "/v2/role/update_menu", { data }),
};

// ========== 菜单管理 ==========
export const apiMenu = {
  list: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/menu/list", { params })
      .then(r => ({ ...r, data: adaptMenuList(r.data) })),
  tree: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/menu/tree", { params })
      .then(r => ({ ...r, data: adaptMenuList(r.data) })),
  save: (data: any) =>
    http.request<ReturnResult<any>>("post", "/v2/menu/save", { data }),
  update: (data: any) =>
    http.request<ReturnResult<any>>("put", "/v2/menu/update", { data }),
  delete: (id: number | string) =>
    http.request<ReturnResult<boolean>>("delete", "/v2/menu/delete", {
      params: { menuId: id },
    }),
};

// ========== 部门管理 ==========
export const apiDept = {
  list: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/dept/list", { params })
      .then(r => ({ ...r, data: adaptDeptList(r.data) })),
  tree: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/dept/tree", { params })
      .then(r => ({ ...r, data: adaptDeptList(r.data) })),
  save: (data: any) =>
    http.request<ReturnResult<any>>("post", "/v2/dept/save", { data }),
  update: (data: any) =>
    http.request<ReturnResult<any>>("put", "/v2/dept/update", { data }),
  delete: (id: number | string) =>
    http.request<ReturnResult<boolean>>("delete", "/v2/dept/delete", {
      params: { deptId: id },
    }),
};

// ========== 字典管理 ==========
export const apiDict = {
  page: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/dict/type/page", { params })
      .then(r => ({ ...r, data: adaptDictList(r.data) })),
  list: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/dict/type/list", { params })
      .then(r => ({ ...r, data: adaptDictList(r.data) })),
  save: (data: any) =>
    http.request<ReturnResult<any>>("post", "/v2/dict/type/save", { data }),
  update: (data: any) =>
    http.request<ReturnResult<any>>("put", "/v2/dict/type/update", { data }),
  delete: (id: number | string) =>
    http.request<ReturnResult<boolean>>("delete", "/v2/dict/type/delete", {
      params: { dictId: id },
    }),
};

// ========== 字典项管理 ==========
export const apiDictData = {
  page: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/dict/data/page", { params })
      .then(r => ({ ...r, data: adaptDictDataList(r.data) })),
  list: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/dict/data/list", { params })
      .then(r => ({ ...r, data: adaptDictDataList(r.data) })),
  save: (data: any) =>
    http.request<ReturnResult<any>>("post", "/v2/dict/data/save", { data }),
  update: (data: any) =>
    http.request<ReturnResult<any>>("put", "/v2/dict/data/update", { data }),
  delete: (id: number | string) =>
    http.request<ReturnResult<boolean>>("delete", "/v2/dict/data/delete", {
      params: { dictCode: id },
    }),
};

// ========== 岗位管理 ==========
export const apiPost = {
  page: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/post/page", { params })
      .then(r => ({ ...r, data: adaptPostList(r.data) })),
  list: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/post/list", { params })
      .then(r => ({ ...r, data: adaptPostList(r.data) })),
  save: (data: any) =>
    http.request<ReturnResult<any>>("post", "/v2/post/save", { data }),
  update: (data: any) =>
    http.request<ReturnResult<any>>("put", "/v2/post/update", { data }),
  delete: (id: number | string) =>
    http.request<ReturnResult<boolean>>("delete", "/v2/post/delete", {
      params: { postId: id },
    }),
};

// ========== 通知公告 ==========
export const apiNotice = {
  page: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/notice/page", { params })
      .then(r => ({ ...r, data: adaptNoticeList(r.data) })),
  list: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/notice/list", { params })
      .then(r => ({ ...r, data: adaptNoticeList(r.data) })),
  save: (data: any) =>
    http.request<ReturnResult<any>>("post", "/v2/notice/save", { data }),
  update: (data: any) =>
    http.request<ReturnResult<any>>("put", "/v2/notice/update", { data }),
  delete: (id: number | string) =>
    http.request<ReturnResult<boolean>>("delete", "/v2/notice/delete", {
      params: { noticeId: id },
    }),
};

// ========== 登录日志 ==========
export const apiLoginLog = {
  page: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/loginlog/page", { params })
      .then(r => ({ ...r, data: adaptLoginLogList(r.data) })),
  delete: (id: number | string) =>
    http.request<ReturnResult<boolean>>("delete", "/v2/loginlog/delete", {
      params: { infoId: id },
    }),
  clean: () =>
    http.request<ReturnResult<boolean>>("delete", "/v2/loginlog/clean"),
};

// ========== 操作日志 ==========
export const apiOperLog = {
  page: (params?: any) =>
    http.request<ReturnResult<any[]>>("get", "/v2/operlog/page", { params })
      .then(r => ({ ...r, data: adaptOperLogList(r.data) })),
  delete: (id: number | string) =>
    http.request<ReturnResult<boolean>>("delete", "/v2/operlog/delete", {
      params: { operId: id },
    }),
  clean: () =>
    http.request<ReturnResult<boolean>>("delete", "/v2/operlog/clean"),
};