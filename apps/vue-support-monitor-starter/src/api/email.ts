import { http, type ReturnResult } from "@repo/utils";

/**
 * 邮件历史记录接口
 */
export interface SystemDataEmailHistory {
  id: number;
  settingId: number;
  messageId: string;
  subject: string;
  sender: string;
  starred?: string;
  senderEmail: string;
  recipients: string;
  ccRecipients?: string;
  bccRecipients?: string;
  content: string;
  htmlContent?: string;
  attachments?: EmailAttachment[];
  folder: string;
  isRead: boolean;
  isStarred: boolean;
  isDeleted: boolean;
  receivedDate: string;
  sentDate?: string;
  size: number;
  labels?: string[];
  tags?: string[];
  priority?: "HIGH" | "NORMAL" | "LOW";
  hasAttachments: boolean;
  preview: string;
  time: Date;
  read: boolean;
  selected?: boolean;
}

/**
 * 邮件附件接口
 */
export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  disposition?: string;
}

/**
 * 邮件拉取响应接口
 */
export interface EmailFetchResponse {
  success: boolean;
  message: string;
  totalFetched: number;
  newEmails: number;
  updatedEmails: number;
  errors?: string[];
  fetchTime: string;
}

/**
 * 邮件备份响应接口
 */
export interface EmailBackupResponse {
  success: boolean;
  message: string;
  backupId: string;
  filename: string;
  size: number;
  backupTime: string;
}

/**
 * 邮件状态更新请求接口
 */
export interface EmailStatusUpdateRequest {
  emailIds?: number[];
  id?: number;
  isRead?: boolean;
  isStarred?: boolean;
  isDeleted?: boolean;
  folder?: string;
  labels?: string[];
  read?: boolean;
}

/**
 * 邮件同步配置接口
 */
export interface EmailSyncConfig {
  enabled: boolean;
  syncInterval: number; // 同步间隔（分钟）
  maxEmailsPerSync: number;
  folders: string[];
  autoMarkAsRead: boolean;
  downloadAttachments: boolean;
  maxAttachmentSize: number; // MB
}

/**
 * 邮件文件夹接口
 */
export interface EmailFolder {
  name: string;
  fullName: string;
  type: "INBOX" | "SENT" | "DRAFTS" | "TRASH" | "SPAM" | "CUSTOM";
  messageCount: number;
  unreadCount: number;
  canSelect: boolean;
}

/**
 * 邮件详情接口
 */
export interface EmailDetail extends SystemDataEmailHistory {
  headers: Record<string, string>;
  rawContent?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string[];
}

/**
 * 分页查询邮件历史
 *
 * @param settingId 数据源配置ID
 * @param params 查询参数
 * @returns 分页结果
 */
export function getEmailHistory(
  settingId: number,
  params: {
    current?: number;
    size?: number;
    isRead?: boolean;
    isStarred?: boolean;
    label?: string;
    folder?: string;
    read?: boolean;
    starred?: boolean;
  }
): Promise<ReturnResult<SystemDataEmailHistory[]>> {
  return http.request("get", `/system/data/email/${settingId}/history`, {
    params: params,
  });
}

/**
 * 拉取邮件
 *
 * @param settingId 数据源配置ID
 * @param folderName 邮件文件夹名称，默认为INBOX
 * @param limit 拉取邮件数量限制，默认为50
 * @returns 拉取结果
 */
export function fetchEmails(
  settingId: number,
  folderName: string = "INBOX",
  command?: string,
  pageNumber?: number = 1,
  limit: number = 50
): Promise<ReturnResult<EmailFetchResponse>> {
  return http.request("post", `/system/data/email/${settingId}/fetch`, {
    params: { folderName, limit,command, pageNumber },
  });
}

/**
 * 同步邮件
 *
 * @param settingId 数据源配置ID
 * @param folderName 邮件文件夹名称，默认为INBOX
 * @returns 同步结果
 */
export function syncEmails(
  settingId: number,
  folderName: string = "INBOX"
): Promise<ReturnResult<EmailFetchResponse>> {
  return http.request("post", `/system/data/email/${settingId}/sync`, {
    data: { folderName },
  });
}

/**
 * 更新邮件状态
 *
 * @param settingId 数据源配置ID
 * @param request 更新请求
 * @returns 更新结果
 */
export function updateEmailStatus(
  settingId: number,
  request: EmailStatusUpdateRequest
): Promise<ReturnResult<string>> {
  return http.request("put", `/system/data/email/${settingId}/status`, {
    data: request,
  });
}

/**
 * 邮件云备份（前端上传邮件保存到数据库）
 *
 * @param settingId 数据源配置ID
 * @param file 邮件文件
 * @returns 备份结果
 */
export function backupEmail(
  settingId: number,
  file: File
): Promise<ReturnResult<EmailBackupResponse>> {
  const formData = new FormData();
  formData.append("file", file);

  return http.request("post", `/system/data/email/${settingId}/backup`, {
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
}
