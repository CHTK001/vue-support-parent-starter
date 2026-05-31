const BASE = "/api";

async function request<T>(method: string, url: string, data?: Record<string, any>): Promise<T> {
  const fullUrl = url.startsWith("http") ? url : `${BASE}${url}`;
  const opts: RequestInit = { method, headers: { "Content-Type": "application/json" } };
  if (data && method !== "GET") {
    opts.body = JSON.stringify(data);
  }
  const res = await fetch(fullUrl, opts);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export interface AccountEntity {
  id: string;
  accountType: "EMAIL" | "NORMAL" | "PHONE";
  username: string;
  password: string;
  email: string;
  status: "ACTIVE" | "DISABLED" | "REGISTERING" | "REGISTER_FAILED";
  registerSource: string;
  registrationUrl: string;
  metadata: Record<string, any>;
  createTime: string;
  updateTime: string;
}

export interface TempEmailMessage {
  id: string;
  title: string;
  content: string;
  contentType: string;
  to: string;
}

export interface RegisterRequest {
  spi?: string;
  email?: string;
  username?: string;
  password?: string;
  headed?: boolean;
}

export interface RegisterResult {
  success: boolean;
  message: string;
  username: string;
  password: string;
  email: string;
  verificationCode: string;
}

export interface SpiDescriptor {
  name: string;
  aliases: string[];
  order: number;
  default: boolean;
  implClass: string;
}

export function fetchAccountList(): Promise<{ code: number; data: AccountEntity[] }> {
  return request("GET", "/account/list");
}

export function fetchAccount(id: string): Promise<{ code: number; data: AccountEntity }> {
  return request("GET", `/account?id=${encodeURIComponent(id)}`);
}

export function createAccount(data: Partial<AccountEntity>): Promise<{ code: number; data: AccountEntity }> {
  return request("POST", "/account", data);
}

export function updateAccount(id: string, data: Partial<AccountEntity>): Promise<{ code: number; data: AccountEntity }> {
  return request("PUT", `/account?id=${encodeURIComponent(id)}`, data);
}

export function deleteAccount(id: string): Promise<{ code: number; data: { deleted: boolean } }> {
  return request("DELETE", `/account?id=${encodeURIComponent(id)}`);
}

export function createTempEmail(): Promise<{ code: number; data: { email: string } }> {
  return request("POST", "/account/temp-email");
}

export function getTempEmailMessages(email: string): Promise<{ code: number; data: TempEmailMessage[] }> {
  return request("GET", `/account/temp-email/messages?email=${encodeURIComponent(email)}`);
}

export function deleteTempEmail(email: string): Promise<{ code: number; data: { deleted: boolean } }> {
  return request("DELETE", `/account/temp-email?email=${encodeURIComponent(email)}`);
}

export function registerAccount(data: RegisterRequest): Promise<{ code: number; data: RegisterResult }> {
  return request("POST", "/account/register", data);
}

export function fetchRegisterSpiList(): Promise<{ code: number; data: SpiDescriptor[] }> {
  return request("GET", "/account/register/spi");
}