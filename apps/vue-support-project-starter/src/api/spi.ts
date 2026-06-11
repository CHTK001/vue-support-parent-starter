import { http } from "@repo/utils";

export const fetchOptionObjectsList = (params: any) => {
  return http.request<any>("get", "/v1/option/get", { params });
};
