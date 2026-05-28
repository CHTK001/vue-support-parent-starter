import { http } from "@repo/utils";

export interface TempEmailMessage {
  id: string;
  title: string;
  content: string;
  contentType: string;
  to: string;
}

export interface TempEmailCreateResult {
  address: string;
}

export interface TempEmailResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

/**
 * 创建临时邮箱
 */
export function createTempEmail(
  type: string = "tempmail",
): Promise<TempEmailResponse<TempEmailCreateResult>> {
  return http.request("post", "/api/temp-email/create", {
    data: { type },
  });
}

/**
 * 获取邮件列表
 */
export function getTempEmailMessages(
  address: string,
): Promise<TempEmailResponse<TempEmailMessage[]>> {
  return http.request("get", "/api/temp-email/messages", {
    params: { address },
  });
}

/**
 * 获取单个邮件详情
 */
export function getTempEmailMessage(
  address: string,
  id: string,
): Promise<TempEmailResponse<TempEmailMessage>> {
  return http.request("get", "/api/temp-email/message", {
    params: { address, id },
  });
}

/**
 * 删除临时邮箱
 */
export function deleteTempEmail(
  address: string,
): Promise<TempEmailResponse<null>> {
  return http.request("delete", "/api/temp-email/delete", {
    params: { address },
  });
}
