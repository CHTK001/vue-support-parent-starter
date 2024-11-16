import { http } from "@repo/utils";
/**
 * 获取天气
 */
export const fetchGetWeather = params => {
  return http.request("get", "/v1/weather/city", {
    params
  });
};
