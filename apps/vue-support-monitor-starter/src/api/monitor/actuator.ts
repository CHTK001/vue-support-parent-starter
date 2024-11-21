import { http, type ReturnResult } from "@repo/utils";

/**
 * 调用actuator接口
 */
export const fetchActuatorCall = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/actuator/call", { data: params });
};
