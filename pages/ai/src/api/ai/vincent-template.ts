import { http, type ReturnResult } from "@repo/utils";

const normalizeTemplateName = (item) => {
  const rawName = item?.sysAiVincentTemplateName || item?.sysAiTemplateName || "";
  const type = item?.sysAiVincentTemplateType || item?.sysAiTemplateType || "";
  if (!rawName || /^\?+$/.test(rawName)) {
    if (type === "cover") return "封面模板";
    if (type === "poster") return "海报模板";
  }
  return rawName;
};

const normalizeTemplateRemark = (item) => {
  const rawRemark = item?.sysAiVincentTemplateRemark || item?.sysAiTemplateRemark || "";
  const type = item?.sysAiVincentTemplateType || item?.sysAiTemplateType || "";
  if (!rawRemark || /^\?+$/.test(rawRemark)) {
    if (type === "cover") return "适合封面类文生图";
    if (type === "poster") return "适合海报类文生图";
  }
  return rawRemark;
};

const normalizeTemplateItem = (item) => ({
  ...item,
  sysAiVincentTemplateName: normalizeTemplateName(item),
  sysAiTemplateName: normalizeTemplateName(item),
  sysAiVincentTemplateRemark: normalizeTemplateRemark(item),
  sysAiTemplateRemark: normalizeTemplateRemark(item),
});

/**
 * 文生图模型模板
 */
export const fetchListForModelTemplate = (params) => {
  return http.request<ReturnResult<object[]>>(
    "get",
    "/v2/ai/vincent/template/list",
    {
      params,
    },
  ).then((res) => ({
    ...res,
    data: (res?.data || []).map(normalizeTemplateItem),
  }));
};
/**
 * 文生图模型模板新增
 */
export const fetchSaveForModelTemplate = (params) => {
  return http.request<ReturnResult<object[]>>(
    "post",
    "/v2/ai/vincent/template/save",
    {
      data: params,
    },
  ).then((res) => ({
    ...res,
    data: res?.data ? normalizeTemplateItem(res.data) : res?.data,
  }));
};
/**
 * 文生图模型模板更新
 */
export const fetchUpdateForModelTemplate = (params) => {
  return http.request<ReturnResult<object[]>>(
    "put",
    "/v2/ai/vincent/template/update",
    {
      data: params,
    },
  );
};
/**
 * 文生图模型模板删除
 */
export const fetchDeleteForModelTemplate = (params) => {
  return http.request<ReturnResult<object[]>>(
    "delete",
    "/v2/ai/vincent/template/delete",
    {
      params,
    },
  );
};
