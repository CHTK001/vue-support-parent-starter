import { http, type ReturnResult } from "@/utils/http";

export type TemplateGroup = {
  sysTemplateGroupId: number;
  sysTemplateGroupName: string;
  sysTemplateGroupCode: string;
  sysTemplateGroupRemark: string;
};
export type Template = {
  sysTemplateId: number;
  sysTemplatemName: string;
  sysTemplateCode: string;
  sysTemplateRemark: string;
};

/** 删除模板配置 */
export const fetchDeleteTemplateGroup = id => {
  const params = { sysTemplateGroupId: id };
  return http.request<ReturnResult<Boolean>>("delete", "/v2/template/group/delete", {
    params
  });
};

/** 保存模板配置 */
export const fetchSaveTemplateGroup = setting => {
  return http.request<Boolean>("post", "/v2/template/group/save", { data: setting });
};

/** 更新模板配置 */
export const fetchUpdateTemplateGroup = setting => {
  if (!setting.sysTemplateGroupId) {
    return;
  }
  return http.request<TemplateGroup>("put", "/v2/template/group/update", { data: setting });
};

/** 获取模板配置 */
export const fetchPageTemplateGroup = params => {
  return http.request<ReturnResult<TemplateGroup[]>>("get", "/v2/template/group/page", {
    params
  });
};

/** 删除模板项配置 */
export const fetchDeleteTemplate = id => {
  const params = { sysTemplateId: id };
  return http.request<ReturnResult<Boolean>>("delete", "/v2/template/delete", {
    params
  });
};

/** 保存模板项配置 */
export const fetchSaveTemplate = setting => {
  return http.request<Boolean>("post", "/v2/template/save", { data: setting });
};

/** 更新模板项配置 */
export const fetchUpdateTemplate = setting => {
  if (!setting.sysTemplateId) {
    return;
  }
  return http.request<Template>("put", "/v2/template/update", {
    data: setting
  });
};

/** 获取模板项配置 */
export const fetchPageTemplate = params => {
  return http.request<ReturnResult<Template[]>>("get", "/v2/template/page", {
    params
  });
};
/** 获取模板项*/
export const fetchListTemplate = params => {
  return http.request<ReturnResult<Template[]>>("get", "/v2/template/list", {
    params
  });
};
