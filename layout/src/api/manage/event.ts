import { http, type ReturnResult } from "@/utils/http";

export type Event = {
  event: string;
  keyword: string;
  startTime: number;
  endTime: number;
};

/**
 * 获取事件列表
 */
export const fetchPageEvent = (params: Event) => {
  return http.request<ReturnResult<Event>>("get", "/v2/event/page", {
    params
  });
};
