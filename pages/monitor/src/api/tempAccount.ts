import { http, unwrapResult } from '@repo/utils';

/**
 * 后端统一返回结构 { code, data, msg } 解包
 */
const unwrap = <T>(res: any): T => unwrapResult<T>(res);

const B = '/ms/monitor/temp-account';

/** 账号内的短信 */
export interface TempSmsMessage {
  phone?: string;
  from?: string;
  content?: string;
  time?: string;
  verifyCode?: string;
}

/** 账号内的邮件 */
export interface TempEmailMessage {
  id?: string;
  from?: string;
  subject?: string;
  body?: string;
  html?: string;
  createdAt?: string;
}

/** 账号的随机号码 */
export interface TempPhoneInfo {
  phone?: string;
  countryCode?: string;
  countryName?: string;
  smsUrl?: string;
}

/** 临时账号（列表视图） */
export interface TempAccount {
  id: string;
  smsProvider?: string;
  emailProvider?: string;
  email?: string;
  createdAt: number;
  smsCount?: number;
  emailCount?: number;
  phone?: TempPhoneInfo | null;
}

/** 临时账号详情（含全部短信与邮件） */
export interface TempAccountDetail extends TempAccount {
  smsMessages?: TempSmsMessage[];
  emails?: TempEmailMessage[];
}

/** 查询全部临时账号 */
export const listTempAccounts = () => http().get(`${B}/list`).then(r => unwrap<TempAccount[]>(r));

/**
 * 随机创建临时账号。
 *
 * @param type 通道类型：sms（仅号码）/ email（仅邮箱）/ both（号码+邮箱，默认）
 */
export const createTempAccount = (type: 'sms' | 'email' | 'both' = 'both') =>
  http().post(`${B}/create`).query({ type }).then(r => unwrap<TempAccountDetail>(r));

/** 删除临时账号 */
export const deleteTempAccount = (id: string) =>
  http().delete(`${B}/${id}`).then(r => unwrap<boolean>(r));

/** 查询临时账号详情（含全部短信与邮件） */
export const getTempAccount = (id: string) =>
  http().get(`${B}/${id}`).then(r => unwrap<TempAccountDetail | null>(r));

/** SSE 事件处理器 */
export interface TempAccountStreamHandlers {
  onOpen?: () => void;
  onError?: (e: Error) => void;
  onClose?: () => void;
  /** 建连就绪 */
  onReady?: (payload: Record<string, unknown>) => void;
  /** 账号新增 */
  onAccount?: (account: TempAccount) => void;
  /** 新消息（短信/邮件增量） */
  onMessage?: (payload: { id: string; sms?: TempSmsMessage[]; emails?: TempEmailMessage[] }) => void;
  /** 账号删除 */
  onRemove?: (payload: { id: string }) => void;
}

/**
 * 订阅临时账号消息流（SSE）。
 *
 * 事件名：ready（建连就绪）/ account（账号新增）/
 * message（新短信、新邮件）/ remove（账号删除）。
 */
export const subscribeTempAccountStream = (handlers: TempAccountStreamHandlers) =>
  http().get(`${B}/stream`).sse<Record<string, unknown> | string>({
    reconnect: true,
    maxReconnectAttempts: 5,
    onOpen: () => handlers.onOpen?.(),
    onError: e => handlers.onError?.(e as Error),
    onClose: () => handlers.onClose?.(),
    onMessage: e => {
      const data = e.data;
      if (typeof data !== 'object' || data === null) return;
      switch (e.event) {
        case 'ready':
          handlers.onReady?.(data as Record<string, unknown>);
          break;
        case 'account':
          handlers.onAccount?.(data as unknown as TempAccount);
          break;
        case 'message':
          handlers.onMessage?.(data as { id: string; sms?: TempSmsMessage[]; emails?: TempEmailMessage[] });
          break;
        case 'remove':
          handlers.onRemove?.(data as { id: string });
          break;
      }
    },
  });
