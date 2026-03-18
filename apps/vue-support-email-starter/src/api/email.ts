import { http } from "@repo/utils";

export interface EmailAccount {
  id?: string;
  emailAddress: string;
  displayName: string;
  smtpHost: string;
  smtpPort: number;
  imapHost: string;
  imapPort: number;
  username: string;
  password: string;
  protocol: string;
  sslEnabled: boolean;
  isDefault?: boolean;
}

export interface EmailMessage {
  id?: string;
  accountId?: string;
  messageId?: string;
  folderName?: string;
  subject: string;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses?: string[];
  contentText?: string;
  contentHtml?: string;
  hasAttachments?: boolean;
  isRead?: boolean;
  isStarred?: boolean;
  sentDate?: Date;
  receivedDate?: Date;
}

// 邮件相关API
export const emailApi = {
  // 发送邮件
  sendEmail: (data: any) => http.post("/api/email/send", data),

  // 获取邮件列表
  getEmailList: (params: {
    accountId?: string;
    folder?: string;
    page?: number;
    size?: number;
  }) => http.get("/api/email/list", params),

  // 获取邮件详情
  getEmailDetail: (id: string) => http.get(`/api/email/${id}`),

  // 删除邮件
  deleteEmail: (id: string) => http.delete(`/api/email/${id}`),

  // 搜索邮件
  searchEmails: (keyword: string) => http.get("/api/email/search", { keyword }),
};

// 账户相关API
export const accountApi = {
  // 获取账户列表
  getAccountList: () => http.get("/api/account/list"),

  // 添加账户
  addAccount: (data: EmailAccount) => http.post("/api/account/add", data),

  // 更新账户
  updateAccount: (id: string, data: EmailAccount) =>
    http.put(`/api/account/${id}`, data),

  // 删除账户
  deleteAccount: (id: string) => http.delete(`/api/account/${id}`),

  // 测试连接
  testConnection: (data: EmailAccount) => http.post("/api/account/test", data),
};

// 导入导出API
export const importExportApi = {
  // 导出到 JSON
  exportToJson: (accounts: EmailAccount[]) =>
    http.post("/api/import-export/export/json", accounts, {
      headers: { responseType: "blob" },
    }),

  // 导出到 CSV
  exportToCsv: (accounts: EmailAccount[]) =>
    http.post("/api/import-export/export/csv", accounts, {
      headers: { responseType: "blob" },
    }),

  // 从 JSON 导入
  importFromJson: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return http.post("/api/import-export/import/json", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 从 CSV 导入
  importFromCsv: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return http.post("/api/import-export/import/csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// 分组相关API
export const groupApi = {
  // 获取分组列表
  getGroupList: () => http.get("/api/group/list"),

  // 创建分组
  createGroup: (data: any) => http.post("/api/group/create", data),

  // 更新分组
  updateGroup: (id: string, data: any) => http.put(`/api/group/${id}`, data),

  // 删除分组
  deleteGroup: (id: string) => http.delete(`/api/group/${id}`),
};

// 标签相关API
export const tagApi = {
  // 获取标签列表
  getTagList: () => http.get("/api/tag/list"),

  // 创建标签
  createTag: (data: any) => http.post("/api/tag/create", data),

  // 删除标签
  deleteTag: (id: string) => http.delete(`/api/tag/${id}`),
};

// 附件相关API
export const attachmentApi = {
  // 上传附件
  uploadAttachments: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    return http.post("/api/attachment/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 获取附件列表
  getAttachments: (emailId: string) =>
    http.get(`/api/attachment/list/${emailId}`),

  // 下载附件
  downloadAttachment: (emailId: string, attachmentId: string) =>
    http.get(`/api/attachment/download/${emailId}/${attachmentId}`, {
      headers: { responseType: "blob" },
    }),

  // 删除附件
  deleteAttachment: (attachmentId: string) =>
    http.delete(`/api/attachment/${attachmentId}`),
};
