import { http, type ReturnResult } from "@repo/utils";

/**
 * 安装软件服务
 */
export function fetchSoftServiceInstallLog(data: { installId: string }) {
  return http.request<ReturnResult<boolean>>("get", `/v1/soft/service/install/ssh/${data.installId}`);
}
