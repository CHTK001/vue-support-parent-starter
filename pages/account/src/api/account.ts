import axios from "axios";
import type {
  AccountEntity,
  AccountListResult,
  AccountRegisterRequest,
  AccountRegisterResult,
  AccountRegisterSpiDescriptor,
  OutlookLoginRequest,
  OutlookLoginResult,
  OutlookStatusResult,
  OutlookSyncResult,
  TempEmailMessage,
} from "./types";

const base = "/api/account";

export interface ReturnResult<E> {
  code: string | number;
  msg: string;
  message: string;
  data: E;
  headers?: any;
  success: boolean;
}

const request = async <T>(config: Parameters<typeof axios.request>[0]) => {
  const response = await axios.request<ReturnResult<T>>(config);
  return response.data;
};

export const fetchAccountList = (params?: {
  page?: number;
  size?: number;
  accountType?: string;
  status?: string;
  keyword?: string;
}) =>
  request<AccountListResult>({
    method: "get",
    url: `${base}/list`,
    params: { page: 1, size: 50, ...params },
  });

export const fetchAccountDetail = (id: string) =>
  request<AccountEntity>({
    method: "get",
    url: base,
    params: { id },
  });

export const createAccount = (data: AccountEntity) =>
  request<AccountEntity>({
    method: "post",
    url: base,
    data,
  });

export const updateAccount = (id: string, data: AccountEntity) =>
  request<AccountEntity>({
    method: "put",
    url: base,
    params: { id },
    data,
  });

export const deleteAccount = (id: string) =>
  request<{ deleted: boolean }>({
    method: "delete",
    url: base,
    params: { id },
  });

export const testAccountConnection = (data: AccountEntity) =>
  request<boolean>({
    method: "post",
    url: `${base}/test`,
    data,
  });

export const fetchAccountRegisterSpis = () =>
  request<AccountRegisterSpiDescriptor[]>({
    method: "get",
    url: `${base}/register/spi`,
  });

export const registerGithubAccount = (data: AccountRegisterRequest) =>
  request<AccountRegisterResult>({
    method: "post",
    url: `${base}/register`,
    data,
  });

export const createTempEmail = () =>
  request<{ email: string }>({
    method: "post",
    url: `${base}/temp-email`,
  });

export const fetchTempEmailMessages = (email: string) =>
  request<TempEmailMessage[]>({
    method: "get",
    url: `${base}/temp-email/messages`,
    params: { email },
  });

export const deleteTempEmail = (email: string) =>
  request<{ deleted: boolean }>({
    method: "delete",
    url: `${base}/temp-email`,
    params: { email },
  });

// ==================== Outlook API ====================

export const outlookLogin = (data: OutlookLoginRequest) =>
  request<OutlookLoginResult>({
    method: "post",
    url: `${base}/outlook/login`,
    data,
  });

export const outlookStatus = (accountId: string) =>
  request<OutlookStatusResult>({
    method: "get",
    url: `${base}/outlook/status/${accountId}`,
  });

export const outlookSync = (accountId: string, folder?: string) =>
  request<OutlookSyncResult>({
    method: "post",
    url: `${base}/outlook/sync/${accountId}`,
    params: { folder: folder || "INBOX" },
  });

export const outlookLogout = (accountId: string) =>
  request<void>({
    method: "post",
    url: `${base}/outlook/logout/${accountId}`,
  });
