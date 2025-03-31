// 通用响应接口
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  success: boolean;
}

// 邮件搜索参数
export interface EmailSearchParams {
  keyword?: string;
  accountId?: string;
  folderId?: string;
  labelId?: string;
  isRead?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
  page?: number;
  pageSize?: number;
}

// 邮件搜索结果
export interface EmailSearchResult {
  data: EmailInfo[];
  total: number;
}
// 邮件信息
// 邮件信息接口
export interface EmailInfo {
  emailId: string;
  emailSubject: string;
  emailContent: string;
  emailSender: {
    emailName: string;
    emailAddress: string;
    emailAvatar?: string;
  };
  emailRecipients: {
    emailTo: Array<{ emailName: string; emailAddress: string }>;
    emailCc?: Array<{ emailName: string; emailAddress: string }>;
    emailBcc?: Array<{ emailName: string; emailAddress: string }>;
  };
  emailAttachments?: EmailAttachment[];
  emailDate: string;
  emailIsRead: boolean;
  emailIsStarred: boolean;
  emailIsImportant: boolean;
  emailLabels?: string[];
  emailFolder: string;
  emailAccountId: string;
}

// 邮件附件接口
export interface EmailAttachment {
  emailAttachmentId: string;
  emailAttachmentName: string;
  emailAttachmentSize: number;
  emailAttachmentType: string;
  emailAttachmentUrl: string;
}

// 邮箱账户接口
export interface EmailAccount {
  emailAccountId: string;
  emailAccountName: string;
  emailAccountAddress: string;
  emailAccountProvider: string;
  emailAccountColor: string;
  emailAccountAvatar?: string;
  emailAccountSignature?: string;
  emailAccountUnreadCount: number;
}

// 邮件文件夹接口
export interface EmailFolder {
  emailFolderId: string;
  emailFolderName: string;
  emailFolderIcon: string;
  emailFolderCount: number;
  emailFolderType: "system" | "custom";
}

// 邮件标签接口
export interface EmailLabel {
  emailLabelId: string;
  emailLabelName: string;
  emailLabelColor: string;
  emailLabelCount: number;
}
