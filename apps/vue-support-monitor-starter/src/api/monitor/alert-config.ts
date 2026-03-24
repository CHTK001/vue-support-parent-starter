import { http, type ReturnResult } from "@repo/utils";

// 配置分页
export const fetchAlertPushConfigPage = (params: any) => {
  const { page, pageSize, pageNum, size, ...rest } = params || {};
  const query = {
    pageNum: pageNum || page || 1,
    pageSize: pageSize || size || 10,
    ...rest,
  };
  return http.request<ReturnResult<any>>("get", "/v1/gen/server/alert/push-config/page", {
    params: query,
  });
};

// 保存/更新配置
export const fetchAlertPushConfigSave = (data: any) => {
  return http.request<ReturnResult<boolean>>("post", "/v1/gen/server/alert/push-config", { data });
};

// 删除配置
export const fetchAlertPushConfigDelete = (id: number) => {
  return http.request<ReturnResult<boolean>>("delete", `/v1/gen/server/alert/push-config/${id}`);
};

// 查询配置详情
export const fetchAlertPushConfigGet = (id: number) => {
  return http.request<ReturnResult<any>>("get", `/v1/gen/server/alert/push-config/${id}`);
};

