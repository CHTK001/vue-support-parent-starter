export type AccountType = "NORMAL" | "OUTLOOK_GRAPH" | "IMAP";

export type AccountStatus =
  | "ACTIVE"
  | "DISABLED"
  | "REGISTERING"
  | "REGISTER_FAILED"
  | "ERROR";

export type MailboxMode = "POP3" | "SMTP" | "TEMP";

export interface MailboxConfig {
  mode: MailboxMode;
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  from?: string;
  secure?: boolean;
  tempEmail?: string;
  tempMessages?: TempEmailMessage[];
}

export interface AccountEntity {
  id?: string;
  accountType?: AccountType;
  emailAddress?: string;
  email?: string;
  displayName?: string;
  username?: string;
  password?: string;
  status?: AccountStatus;
  registerSource?: string;
  registrationUrl?: string;
  metadata?: Record<string, unknown> | null;
  createTime?: string;
  updateTime?: string;
  // Outlook Graph 专用字段
  clientId?: string;
  tenantId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpireTime?: number;
  // 服务器配置
  smtpHost?: string;
  smtpPort?: number;
  imapHost?: string;
  imapPort?: number;
  protocol?: string;
  sslEnabled?: boolean;
  isDefault?: boolean;
  // 扩展
  groupId?: string;
  tags?: string[];
  proxyType?: string;
  proxyHost?: string;
  proxyPort?: number;
  proxyUsername?: string;
  proxyPassword?: string;
  machineCode?: string;
  lastUsedTime?: number;
  autoRefresh?: boolean;
  sortOrder?: number;
  notes?: string;
}

export interface AccountListResult {
  records: AccountEntity[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface AccountRegisterSpiDescriptor {
  name: string;
  aliases?: string[];
  order?: number;
  default?: boolean;
  implClass?: string;
}

export interface AccountRegisterRequest {
  spi?: string;
  email?: string;
  username?: string;
  password?: string;
  headed?: boolean;
  accountType?: AccountType;
  extra?: Record<string, unknown>;
}

export interface AccountRegisterResult {
  success: boolean;
  message?: string;
  username?: string;
  password?: string;
  email?: string;
  verificationCode?: string;
}

export interface TempEmailMessage {
  id: string;
  title?: string;
  content?: string;
  contentType?: string;
  to?: string;
}

// ==================== Outlook 类型 ====================

export type OutlookLoginType = "ACCESS_TOKEN" | "PASSWORD";

export interface OutlookLoginRequest {
  accountId: string;
  loginType?: OutlookLoginType;
}

export interface OutlookLoginResult {
  accountId: string;
  email: string;
  status: string;
  tokenExpiresIn?: number;
}

export interface OutlookStatusResult {
  accountId: string;
  status: "LOGGED_IN" | "NOT_LOGGED_IN" | "DISCONNECTED";
}

export interface OutlookSyncRequest {
  folder?: string;
}

export interface OutlookSyncResult {
  accountId: string;
  folder: string;
  count: number;
  emails: unknown[];
}
