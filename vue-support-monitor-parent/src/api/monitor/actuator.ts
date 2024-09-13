import { http, type ReturnResult } from "@/utils/http";

/**
 * 调用actuator接口
 */
export const fetchActuatorCall = (params: any) => {
  return http.request<ReturnResult<any>>("post", "/v1/actuator/call", { data: params });
};
