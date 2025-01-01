import { http, type ReturnResult } from "@repo/utils";

/** 获取服务列表 */
export const fetchToolPhantom = uriSpec => {
  return http.request<ReturnResult<any>>("post", "/v2/tool/image/phantom", {
    data: uriSpec,
    headers: {
      "x-remote-animation": "false",
      "content-type": "form-data/multipart"
    }
  });
};
