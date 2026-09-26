/**
 * 消息推送模块类型定义（@pages/message）
 */

/** 消息提供商 */
export interface MessageProvider {
  sysMessageProviderId?: number;
  /** 提供商编码 */
  sysMessageProviderCode?: string;
  /** 提供商名称 */
  sysMessageProviderName?: string;
  /** 提供商类型：EMAIL/SMS/WECHAT/DINGDING/FEISHU */
  sysMessageProviderType?: string;
  /** 厂家编码 */
  sysMessageProviderVender?: string;
  /** 应用ID */
  sysMessageProviderAppId?: string;
  /** 应用密钥 */
  sysMessageProviderAppSecret?: string;
  /** 签名 */
  sysMessageProviderSign?: string;
  /** 端点地址 */
  sysMessageProviderEndpoint?: string;
  /** SMTP主机 */
  sysMessageProviderSmtpHost?: string;
  /** SMTP端口 */
  sysMessageProviderSmtpPort?: number;
  /** SMTP密码 */
  sysMessageProviderSmtpPassword?: string;
  /** SMTP发件人 */
  sysMessageProviderSmtpFrom?: string;
  /** Webhook地址 */
  sysMessageProviderWebhookUrl?: string;
  /** 是否启用 */
  sysMessageProviderStatus?: number;
  /** 重复消息间隔（分钟），0 表示不限制 */
  sysMessageProviderInterval?: number;
  /** 排序号 */
  sysMessageProviderSort?: number;
  /** 描述 */
  sysMessageProviderRemark?: string;
  createTime?: string;
  updateTime?: string;
}

/** 消息渠道信息（来自 MessagePush SPI 描述注解） */
export interface ChannelInfo {
  /** 渠道标识（如 EMAIL、ALIBABA-SMS、STATION） */
  channel?: string;
  /** 渠道中文名称 */
  label?: string;
  /** 渠道类型（EMAIL/SMS/STATION/DINGDING/FEISHU/DESKTOP） */
  type?: string;
  /** 渠道功能描述 */
  desc?: string;
  /** 支持能力/类型列表 */
  capabilities?: string[];
}

/** 消息模板 */
export interface MessageTemplate {
  sysMessageTemplateId?: number;
  /** 提供商ID */
  sysMessageProviderId?: number;
  /** 模板编码 */
  sysMessageTemplateCode?: string;
  /** 模板名称 */
  sysMessageTemplateName?: string;
  /** 模板标题（消息标题/邮件主题，支持 ${param} 占位符） */
  sysMessageTemplateTitle?: string;
  /** 模板类型 */
  sysMessageTemplateType?: string;
  /** 模板内容 */
  sysMessageTemplateContent?: string;
  /** 回调地址 */
  sysMessageTemplateCallbackUrl?: string;
  /** 是否启用 */
  sysMessageTemplateStatus?: number;
  /** 优先级 */
  sysMessageTemplateSort?: number;
  /** 备注 */
  sysMessageTemplateRemark?: string;
  createTime?: string;
  updateTime?: string;
}

/** 消息推送日志 */
export interface MessageLog {
  sysMessageLogId?: number;
  /** 接收人 */
  sysMessageLogTarget?: string;
  /** 模板ID */
  sysMessageTemplateId?: number;
  /** 提供商ID */
  sysMessageProviderId?: number;
  /** 渠道标识 */
  sysMessageLogChannel?: string;
  /** 发送内容 */
  sysMessageLogContent?: string;
  /** 模板参数 */
  sysMessageLogParam?: string;
  /** 耗时 */
  sysMessageCost?: number;
  /** 返回码 */
  sysMessageCode?: string;
  /** 返回消息 */
  sysMessageMessage?: string;
  /** 消息主题（邮件标题等） */
  sysMessageLogSubject?: string;
  /** 消息ID（服务商返回） */
  sysMessageLogMessageId?: string;
  /** 批次号（同一次发送共享） */
  sysMessageBatchId?: string;
  /** 追踪标识（邮件阅读追踪） */
  sysMessageTrackToken?: string;
  /** 已读状态 0 未读 / 1 已读 */
  sysMessageReadStatus?: number;
  /** 已读时间 */
  sysMessageReadTime?: string;
  createTime?: string;
}

/** 消息发送结果 */
export interface MessageResponse {
  success?: boolean;
  messageId?: string;
  errorMessage?: string;
  durationMillis?: number;
}

/** 分页返回 */
export interface PageResult<T> {
  pageNo?: number;
  pageSize?: number;
  totalPages?: number;
  total?: number;
  data?: T[];
}

/** 统一返回结构 */
export interface ApiResult<T = unknown> {
  status?: number;
  code?: number;
  msg?: string;
  data?: T;
}

/** 模板预览请求 */
export interface TemplatePreviewRequest {
  /** 模板ID */
  sysMessageTemplateId?: number;
  /** 模板参数 */
  params?: Record<string, unknown>;
}

/** 模板预览响应 */
export interface TemplatePreviewResponse {
  /** 渲染后的模板内容 */
  content?: string;
  /** 未被填充的占位符 */
  unresolvedParams?: string[];
  /** 是否完整（所有占位符已填充） */
  complete?: boolean;
}
