import { http, type ReturnResult } from "@repo/utils";

// 模板分页
export const fetchAlertPushTemplatePage = (params: any) => {
  const { page, pageSize, pageNum, size, ...rest } = params || {};
  const query = {
    pageNum: pageNum || page || 1,
    pageSize: pageSize || size || 10,
    ...rest,
  };
  return http.request<ReturnResult<any>>("get", "/v1/gen/server/alert/push-template/page", {
    params: query,
  });
};

// 保存/更新模板
export const fetchAlertPushTemplateSave = (data: any) => {
  return http.request<ReturnResult<boolean>>("post", "/v1/gen/server/alert/push-template", { data });
};

// 删除模板
export const fetchAlertPushTemplateDelete = (id: number) => {
  return http.request<ReturnResult<boolean>>("delete", `/v1/gen/server/alert/push-template/${id}`);
};

// 查询模板详情
export const fetchAlertPushTemplateGet = (id: number) => {
  return http.request<ReturnResult<any>>("get", `/v1/gen/server/alert/push-template/${id}`);
};

// 测试发送
export const fetchAlertPushTemplateTestSend = (
  templateId: number,
  params?: { type?: string; level?: string }
) => {
  return http.request<ReturnResult<boolean>>("post", `/v1/gen/server/alert/push-template-test/send/${templateId}`,
    { params }
  );
};

