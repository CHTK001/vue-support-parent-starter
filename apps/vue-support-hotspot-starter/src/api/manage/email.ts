import { http, type ReturnResult } from "@repo/utils";

export type Email = {
  to: string;
  content: string;
};

export const fetchEmailSender = (params: Email) => {
  return http.request<ReturnResult<boolean>>("get", "/v2/email", {
    params
  });
};
