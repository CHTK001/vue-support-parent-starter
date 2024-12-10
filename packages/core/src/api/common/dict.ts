import { http, type ReturnResult } from "@repo/utils";

export type Dict = {
  sysDictId: number;
  sysDictName: string;
  sysDictCode: string;
  sysDictInSystem: number;
  sysDictRemark: string;
};
export type DictItem = {
  sysDictItemId: number;
  sysDictItemName: string;
  sysDictItemCode: string;
  sysDictItemInSystem: number;
  sysDictItemRemark: string;
};

/** 删除字典配置 */
export const fetchDeleteDict = (id) => {
  const params = { sysDictId: id };
  return http.request<ReturnResult<boolean>>("delete", "/v2/dict/delete", {
    params,
  });
};

/** 保存字典配置 */
export const fetchSaveDict = (setting) => {
  return http.request<boolean>("post", "/v2/dict/save", { data: setting });
};

/** 更新字典配置 */
export const fetchUpdateDict = (setting) => {
  if (!setting.sysDictId) {
    return;
  }
  return http.request<Dict>("put", "/v2/dict/update", { data: setting });
};

/** 获取字典配置 */
export const fetchPageDict = (params) => {
  return http.request<ReturnResult<Dict[]>>("get", "/v2/dict/page", {
    params,
  });
};
/** 获取字典*/
export const fetchListDict = (params) => {
  return http.request<ReturnResult<Dict[]>>("get", "/v2/dict/list", {
    params,
  });
};

/** 删除字典项配置 */
export const fetchDeleteDictItem = (id) => {
  const params = { sysDictItemId: id };
  return http.request<ReturnResult<boolean>>("delete", "/v2/dict/item/delete", {
    params,
  });
};

/** 保存字典项配置 */
export const fetchSaveDictItem = (setting) => {
  return http.request<boolean>("post", "/v2/dict/item/save", { data: setting });
};

/** 更新字典项配置 */
export const fetchUpdateDictItem = (setting) => {
  if (!setting.sysDictItemId) {
    return;
  }
  return http.request<DictItem>("put", "/v2/dict/item/update", {
    data: setting,
  });
};

/** 获取字典项配置 */
export const fetchPageDictItem = (params) => {
  return http.request<ReturnResult<DictItem[]>>("get", "/v2/dict/item/page", {
    params,
  });
};
/** 获取字典项*/
export const fetchListDictItem = (params) => {
  return http.request<ReturnResult<DictItem[]>>("get", "/v2/dict/item/list", {
    params,
  });
};
/** 获取字典项*/
export const fetchPListDictItem = (params) => {
  return http.request<ReturnResult<DictItem[]>>("get", "/v2/dict/item/pList", {
    params,
  });
};
