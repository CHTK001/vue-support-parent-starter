import { http, type ReturnResult } from "@repo/utils";

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

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  disposition?: string;
}

export interface EmailFetchResponse {
  success: boolean;
  message: string;
  totalFetched: number;
  newEmails: number;
  updatedEmails: number;
  errors?: string[];
  fetchTime: string;
}

export interface EmailBackupResponse {
  success: boolean;
  message: string;
  backupId: string;
  filename: string;
  size: number;
  backupTime: string;
}

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

export interface EmailSyncConfig {
  enabled: boolean;
  syncInterval: number;
  maxEmailsPerSync: number;
  folders: string[];
  autoMarkAsRead: boolean;
  downloadAttachments: boolean;
  maxAttachmentSize: number;
}

export interface EmailFolder {
  name: string;
  fullName: string;
  type: "INBOX" | "SENT" | "DRAFTS" | "TRASH" | "SPAM" | "CUSTOM";
  messageCount: number;
  unreadCount: number;
  canSelect: boolean;
}

export interface EmailDetail extends SystemDataEmailHistory {
  headers: Record<string, string>;
  rawContent?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string[];
}

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
  },
): Promise<ReturnResult<SystemDataEmailHistory[]>> {
  return http.request("get", `/system/data/email/${settingId}/history`, {
    params,
  });
}

export function fetchEmails(
  settingId: number,
  folderName: string = "INBOX",
  command?: string,
  pageNumber: number = 1,
  limit: number = 50,
  messageId?: string,
): Promise<ReturnResult<EmailFetchResponse>> {
  return http.request("post", `/system/data/email/${settingId}/fetch`, {
    params: { folderName, limit, command, pageNumber, messageId },
  });
}

export function fetchEmailsObject(
  settingId: number,
  params: any,
): Promise<ReturnResult<EmailFetchResponse>> {
  return http.request("post", `/system/data/email/${settingId}/fetch`, {
    params,
  });
}

export function syncEmails(
  settingId: number,
  folderName: string = "INBOX",
): Promise<ReturnResult<EmailFetchResponse>> {
  return http.request("post", `/system/data/email/${settingId}/sync`, {
    data: { folderName },
  });
}

export function updateEmailStatus(
  settingId: number,
  request: EmailStatusUpdateRequest,
): Promise<ReturnResult<string>> {
  return http.request("put", `/system/data/email/${settingId}/status`, {
    data: request,
  });
}

export function backupEmail(
  settingId: number,
  file: File,
): Promise<ReturnResult<EmailBackupResponse>> {
  const formData = new FormData();
  formData.append("file", file);

  return http.request("post", `/system/data/email/${settingId}/backup`, {
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
}
