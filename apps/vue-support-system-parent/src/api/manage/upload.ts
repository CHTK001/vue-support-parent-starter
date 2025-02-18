import { http, type ReturnResult } from "@repo/utils";

/**
 * 上传文件
 */
export const fetchUploadFile = (params: any) => {
  return http.request<ReturnResult<any>>("put", "/v2/file/upload", {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    data: params,
  });
};
