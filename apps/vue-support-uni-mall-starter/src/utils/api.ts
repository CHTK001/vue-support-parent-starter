import type { ApiResponse } from "../entity/user";

export const ensureSuccess = <T>(
  response: ApiResponse<T>,
  fallbackMessage = "请求失败",
): T => {
  if (!response.success || response.code >= 400) {
    throw new Error(response.message || fallbackMessage);
  }
  return response.data;
};
