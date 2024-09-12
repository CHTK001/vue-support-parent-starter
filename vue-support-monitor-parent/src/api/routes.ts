import { getConfig } from "@/config";
import { http, type ReturnResult } from "@/utils/http";

type Result = {
  success: boolean;
  data: Array<any>;
};

export const getAsyncRoutes = () => {
  if (!getConfig().remoteMenu) {
    return new Promise(resolve => {
      resolve({
        data: [],
        success: true
      });
    });
  }
  return http.request<ReturnResult<Result>>("get", "/v2/user/menu");
};
