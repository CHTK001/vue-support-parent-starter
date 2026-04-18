import { spiderRequest } from "./spider-platform";

export interface SpiderCredential {
  id?: number;
  credentialName: string;
  credentialType: "BASIC" | "COOKIE" | "TOKEN" | "SMS_CODE";
  domain?: string;
  description?: string;
}

export interface CreateCredentialRequest {
  credentialName: string;
  credentialType: string;
  domain?: string;
  description?: string;
  plainData: string;
}

export const getCredentials = () =>
  spiderRequest<SpiderCredential[]>({
    url: "/v1/spider/credentials",
    method: "GET",
  });

export const createCredential = (data: CreateCredentialRequest) =>
  spiderRequest<any>({
    url: "/v1/spider/credentials",
    method: "POST",
    data,
  });

export const deleteCredential = (id: number) =>
  spiderRequest<any>({
    url: `/v1/spider/credentials/${id}`,
    method: "DELETE",
  });
