import { http } from "@repo/utils";

export interface TempEmailMessage {
  id: string;
  title?: string;
  content?: string;
  contentType?: string;
  to?: string;
}

export interface TempEmailMailbox {
  email: string;
  messageCount: number;
  latestTitle?: string | null;
  latestContent?: string | null;
  latestTraceId?: string | null;
}

export interface TempEmailCreateResult {
  email: string;
}

export interface TempEmailResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

export function createTempEmail(type: string = "tempmail"): Promise<TempEmailResponse<TempEmailCreateResult>> {
  return http.request("post", "/api/account/temp-email", {
    data: { type },
  });
}

export function listTempEmails(): Promise<TempEmailResponse<TempEmailMailbox[]>> {
  return http.request("get", "/api/account/temp-email/list");
}

export function getTempEmailMessages(email: string): Promise<TempEmailResponse<TempEmailMessage[]>> {
  return http.request("get", "/api/account/temp-email/messages", {
    params: { email },
  });
}

export function getTempEmailMessage(email: string, id: string): Promise<TempEmailResponse<TempEmailMessage>> {
  return http.request("get", "/api/account/temp-email/message", {
    params: { email, id },
  });
}

export function deleteTempEmail(email: string): Promise<TempEmailResponse<null>> {
  return http.request("delete", "/api/account/temp-email", {
    params: { email },
  });
}
