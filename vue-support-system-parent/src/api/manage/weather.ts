import { http } from "@/utils/http";
/**
 * 获取天气
 */
export const fetchGetWeather = params => {
  return http.request("get", "/v1/weather/city", {
    params
  });
};
