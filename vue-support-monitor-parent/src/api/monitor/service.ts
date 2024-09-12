import { http, type ReturnResult } from "@/utils/http";

/** 获取服务列表 */
export const fetchServiceList = uriSpec => {
  return http.request<ReturnResult<any>>("get", "/v2/service/list", {
    params: uriSpec,
    headers: {
      "x-remote-animation": "false"
    }
  });
};
