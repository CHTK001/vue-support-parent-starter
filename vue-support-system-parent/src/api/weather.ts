import { http, type ReturnResult } from "@/utils/http";

export type Weather = {
  city: string;
  day: string;
  date: string;
};

/**
 * 获取天气
 */
export const fetchGetWeather = params => {
  return http.request<ReturnResult<Boolean>>("get", "/v1/external/weather", {
    params
  });
};
