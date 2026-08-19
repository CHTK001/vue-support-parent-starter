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

export interface TokenInfo {
  id: string;
  accountId: string;
  token: string;
  tokenType: string;
  expiresAt: string;
  createdAt: string;
  revoked: boolean;
}

export interface GroupInfo {
  id: string;
  name: string;
  description: string;
  createdAt: string;
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

// Token 管理
export function createToken(accountId: string, tokenType?: string, ttl?: number): Promise<{ code: number; data: TokenInfo }> {
  return request("POST", "/account/token", { accountId, tokenType, ttl });
}

export function findToken(token: string): Promise<{ code: number; data: TokenInfo | null }> {
  return request("GET", `/account/token?token=${encodeURIComponent(token)}`);
}

export function listTokens(accountId: string): Promise<{ code: number; data: TokenInfo[] }> {
  return request("GET", `/account/token?accountId=${encodeURIComponent(accountId)}`);
}

export function revokeToken(token: string): Promise<{ code: number; data: { revoked: boolean } }> {
  return request("DELETE", `/account/token?token=${encodeURIComponent(token)}`);
}

// 分组管理
export function createGroup(name: string, description?: string): Promise<{ code: number; data: GroupInfo }> {
  return request("POST", "/account/group", { name, description });
}

export function listGroups(): Promise<{ code: number; data: GroupInfo[] }> {
  return request("GET", "/account/group/list");
}

export function getGroup(id: string): Promise<{ code: number; data: GroupInfo | null }> {
  return request("GET", `/account/group?id=${encodeURIComponent(id)}`);
}

export function deleteGroup(id: string): Promise<{ code: number; data: { deleted: boolean } }> {
  return request("DELETE", `/account/group?id=${encodeURIComponent(id)}`);
}

export function addMember(groupId: string, accountId: string): Promise<{ code: number; data: { added: boolean } }> {
  return request("POST", "/account/group/member", { groupId, accountId });
}

export function removeMember(groupId: string, accountId: string): Promise<{ code: number; data: { removed: boolean } }> {
  return request("DELETE", `/account/group/member?groupId=${encodeURIComponent(groupId)}&accountId=${encodeURIComponent(accountId)}`);
}

export function listMembers(groupId: string): Promise<{ code: number; data: string[] }> {
  return request("GET", `/account/group/member?groupId=${encodeURIComponent(groupId)}`);
}