import { http, type ReturnResult } from "@repo/utils";

const normalizeStyleName = (item) => {
  const rawName = item?.sysAiVincentStyleName || item?.sysAiStyleName || "";
  const code = item?.sysAiVincentStyleCode || item?.sysAiStyleCode || "";
  if (!rawName || /^\?+$/.test(rawName)) {
    if (code === "cinematic") return "电影感";
    if (code === "anime") return "动漫";
  }
  return rawName;
};

const normalizeStyleItem = (item) => ({
  ...item,
  sysAiVincentStyleName: normalizeStyleName(item),
  sysAiStyleName: normalizeStyleName(item),
});

/**
 * 文生图模型风格
 */
export const fetchListForModelStyle = (params) => {
  return http.request<ReturnResult<object[]>>(
    "get",
    "/v2/ai/vincent/style/list",
    {
      params,
    },
  ).then((res) => ({
    ...res,
    data: (res?.data || []).map(normalizeStyleItem),
  }));
};
/**
 * 文生图模型风格新增
 */
export const fetchSaveForModelStyle = (params) => {
  return http.request<ReturnResult<object[]>>(
    "post",
    "/v2/ai/vincent/style/save",
    {
      data: params,
    },
  ).then((res) => ({
    ...res,
    data: res?.data ? normalizeStyleItem(res.data) : res?.data,
  }));
};
/**
 * 文生图模型风格更新
 */
export const fetchUpdateForModelStyle = (params) => {
  return http.request<ReturnResult<object[]>>(
    "put",
    "/v2/ai/vincent/style/update",
    {
      data: params,
    },
  );
};
/**
 * 文生图模型风格删除
 */
export const fetchDeleteForModelStyle = (params) => {
  return http.request<ReturnResult<object[]>>(
    "delete",
    "/v2/ai/vincent/style/delete",
    {
      params,
    },
  );
};
