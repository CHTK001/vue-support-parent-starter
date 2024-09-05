import { http, type ReturnResult } from "@/utils/http";

export type TemplateCategory = {
  sysTemplateCategoryId: number;
  sysTemplateCategoryName: string;
  sysTemplateCategoryCode: string;
  sysTemplateCategoryRemark: string;
};
export type Template = {
  sysTemplateId: number;
  sysTemplatemName: string;
  sysTemplateCode: string;
  sysTemplateRemark: string;
};

/** 删除模板配置 */
export const fetchDeleteTemplateCategory = id => {
  const params = { sysTemplateCategoryId: id };
  return http.request<ReturnResult<Boolean>>("delete", "/v2/template/category/delete", {
    params
  });
};

/** 保存模板配置 */
export const fetchSaveTemplateCategory = setting => {
  return http.request<Boolean>("post", "/v2/template/category/save", { data: setting });
};

/** 更新模板配置 */
export const fetchUpdateTemplateCategory = setting => {
  if (!setting.sysTemplateCategoryId) {
    return;
  }
  return http.request<TemplateCategory>("put", "/v2/template/category/update", { data: setting });
};

/** 获取模板配置 */
export const fetchPageTemplateCategoryTree = params => {
  return http.request<ReturnResult<TemplateCategory[]>>("get", "/v2/template/category/tree", {
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
