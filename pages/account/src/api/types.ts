export type AccountType = "EMAIL" | "NORMAL" | "PHONE";

export type AccountStatus =
  | "ACTIVE"
  | "DISABLED"
  | "REGISTERING"
  | "REGISTER_FAILED";

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
  username?: string;
  password?: string;
  email?: string;
  status?: AccountStatus;
  registerSource?: string;
  registrationUrl?: string;
  metadata?: Record<string, unknown> | null;
  createTime?: string;
  updateTime?: string;
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
