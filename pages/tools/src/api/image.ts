import { http, type ReturnResult } from "@repo/utils";

/** 幻影图像生成 */
export const fetchToolPhantom = (uriSpec: FormData) => {
  return http.request<ReturnResult<any>>("post", "/v2/tool/image/phantom", {
    data: uriSpec,
    headers: {
      "x-remote-animation": "false",
      "content-type": "form-data/multipart",
    },
  });
};
