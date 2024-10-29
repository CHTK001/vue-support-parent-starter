import { http } from "@/utils/http";
/**
 * 获取天气
 */
export const fetchGetWeather = params => {
  return http.request("get", "/v2/weather/city", {
    params
  });
};
