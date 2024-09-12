import { http, type ReturnResult } from "@/utils/http";

type Result = {
  success: boolean;
  data: Array<any>;
};

export const getAsyncRoutes = () => {
  return http.request<ReturnResult<Result>>("get", "/v2/user/menu");
};
