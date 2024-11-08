import { http, type ReturnResult } from "@/utils/http";

export type Email = {
  to: string;
  content: string;
};

export const fetchEmailSender = (params: Email) => {
  return http.request<ReturnResult<Boolean>>("get", "/v2/email", {
    params
  });
};
