import { EmailAccount, EmailFolder, EmailInfo, EmailLabel, EmailSearchParams, EmailSearchResult, ApiResponse } from "../types";
import { allEmails, emailAccounts, emailDraftMessages, emailFolders, emailLabels, emailSentMessages } from "./mockData";

// 模拟延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 获取所有邮箱账户
export const fetchEmailAccounts = async (): Promise<ApiResponse<EmailAccount[]>> => {
  await delay(300);
  return {
    code: "00000",
    message: "获取成功",
    data: emailAccounts,
    success: true,
  };
};

// 获取所有文件夹
export const fetchEmailFolders = async (): Promise<ApiResponse<EmailFolder[]>> => {
  await delay(300);
  return {
    code: "00000",
    message: "获取成功",
    data: emailFolders,
    success: true,
  };
};

// 获取所有标签
export const fetchEmailLabels = async (): Promise<ApiResponse<EmailLabel[]>> => {
  await delay(300);
  return {
    code: "00000",
    message: "获取成功",
    data: emailLabels,
    success: true,
  };
};

// 搜索邮件
export const searchEmails = async (params: EmailSearchParams): Promise<ApiResponse<EmailSearchResult>> => {
  await delay(500);

  let filteredEmails = [...allEmails];

  // 按账户过滤
  if (params.accountId) {
    filteredEmails = filteredEmails.filter((email) => email.emailAccountId === params.accountId);
  }

  // 按文件夹过滤
  if (params.folderId) {
    filteredEmails = filteredEmails.filter((email) => email.emailFolder === params.folderId);
  }

  // 按标签过滤
  if (params.labelId) {
    filteredEmails = filteredEmails.filter((email) => email.emailLabels?.includes(params.labelId));
  }

  // 按已读/未读过滤
  if (params.isRead !== undefined) {
    filteredEmails = filteredEmails.filter((email) => email.emailIsRead === params.isRead);
  }

  // 按星标过滤
  if (params.isStarred !== undefined) {
    filteredEmails = filteredEmails.filter((email) => email.emailIsStarred === params.isStarred);
  }

  // 按重要性过滤
  if (params.isImportant !== undefined) {
    filteredEmails = filteredEmails.filter((email) => email.emailIsImportant === params.isImportant);
  }

  // 按关键词搜索
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filteredEmails = filteredEmails.filter((email) => email.emailSubject.toLowerCase().includes(keyword) || email.emailContent.toLowerCase().includes(keyword) || email.emailSender.emailName.toLowerCase().includes(keyword) || email.emailSender.emailAddress.toLowerCase().includes(keyword));
  }

  // 按日期排序（最新的在前）
  filteredEmails.sort((a, b) => new Date(b.emailDate).getTime() - new Date(a.emailDate).getTime());

  // 计算总数
  const total = filteredEmails.length;

  // 分页
  if (params.page !== undefined && params.pageSize !== undefined) {
    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize;
    filteredEmails = filteredEmails.slice(start, end);
  }

  return {
    code: "00000",
    message: "搜索成功",
    data: {
      data: filteredEmails,
      total,
    },
    success: true,
  };
};

// 获取单个邮件详情
export const fetchEmailDetail = async (emailId: string): Promise<ApiResponse<EmailInfo>> => {
  await delay(300);

  const email = allEmails.find((email) => email.emailId === emailId);

  if (!email) {
    return {
      code: "40004",
      message: "邮件不存在",
      data: null,
      success: false,
    };
  }

  // 标记为已读
  email.emailIsRead = true;

  return {
    code: "00000",
    message: "获取成功",
    data: email,
    success: true,
  };
};

// 标记邮件状态
export const markEmailStatus = async (emailId: string, status: { isRead?: boolean; isStarred?: boolean; isImportant?: boolean }): Promise<ApiResponse<boolean>> => {
  await delay(200);

  const email = allEmails.find((email) => email.emailId === emailId);

  if (!email) {
    return {
      code: "40004",
      message: "邮件不存在",
      data: false,
      success: false,
    };
  }

  if (status.isRead !== undefined) {
    email.emailIsRead = status.isRead;
  }

  if (status.isStarred !== undefined) {
    email.emailIsStarred = status.isStarred;
  }

  if (status.isImportant !== undefined) {
    email.emailIsImportant = status.isImportant;
  }

  return {
    code: "00000",
    message: "操作成功",
    data: true,
    success: true,
  };
};

// 移动邮件到文件夹
export const moveEmailToFolder = async (emailId: string, folderId: string): Promise<ApiResponse<boolean>> => {
  await delay(300);

  const email = allEmails.find((email) => email.emailId === emailId);

  if (!email) {
    return {
      code: "40004",
      message: "邮件不存在",
      data: false,
      success: false,
    };
  }

  email.emailFolder = folderId;

  return {
    code: "00000",
    message: "移动成功",
    data: true,
    success: true,
  };
};

// 添加或移除标签
export const updateEmailLabels = async (emailId: string, labelId: string, action: "add" | "remove"): Promise<ApiResponse<boolean>> => {
  await delay(200);

  const email = allEmails.find((email) => email.emailId === emailId);

  if (!email) {
    return {
      code: "40004",
      message: "邮件不存在",
      data: false,
      success: false,
    };
  }

  if (!email.emailLabels) {
    email.emailLabels = [];
  }

  if (action === "add" && !email.emailLabels.includes(labelId)) {
    email.emailLabels.push(labelId);
  } else if (action === "remove") {
    email.emailLabels = email.emailLabels.filter((id) => id !== labelId);
  }

  return {
    code: "00000",
    message: action === "add" ? "添加标签成功" : "移除标签成功",
    data: true,
    success: true,
  };
};

// 发送邮件
export const sendEmail = async (email: Omit<EmailInfo, "emailId" | "emailDate" | "emailIsRead" | "emailIsStarred" | "emailIsImportant">): Promise<ApiResponse<EmailInfo>> => {
  await delay(800);

  const newEmail: EmailInfo = {
    emailId: `s${allEmails.length + 1}`,
    ...email,
    emailDate: new Date().toISOString(),
    emailIsRead: true,
    emailIsStarred: false,
    emailIsImportant: false,
    emailFolder: "sent",
  };

  emailSentMessages.push(newEmail);
  allEmails.push(newEmail);

  return {
    code: "00000",
    message: "发送成功",
    data: newEmail,
    success: true,
  };
};

// 保存草稿
export const saveDraft = async (email: Omit<EmailInfo, "emailId" | "emailDate" | "emailIsRead" | "emailIsStarred" | "emailIsImportant">): Promise<ApiResponse<EmailInfo>> => {
  await delay(300);

  const newEmail: EmailInfo = {
    emailId: `d${allEmails.length + 1}`,
    ...email,
    emailDate: new Date().toISOString(),
    emailIsRead: true,
    emailIsStarred: false,
    emailIsImportant: false,
    emailFolder: "drafts",
  };

  emailDraftMessages.push(newEmail);
  allEmails.push(newEmail);

  return {
    code: "00000",
    message: "保存成功",
    data: newEmail,
    success: true,
  };
};

// 删除邮件
export const deleteEmail = async (emailId: string): Promise<ApiResponse<boolean>> => {
  await delay(300);

  const email = allEmails.find((email) => email.emailId === emailId);

  if (!email) {
    return {
      code: "40004",
      message: "邮件不存在",
      data: false,
      success: false,
    };
  }

  // 移动到垃圾箱
  email.emailFolder = "trash";

  return {
    code: "00000",
    message: "删除成功",
    data: true,
    success: true,
  };
};
