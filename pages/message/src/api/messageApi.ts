/**
 * 消息推送模块 API 封装（@pages/message）
 */
import { http } from "@repo/utils";
import type {
  ApiResult,
  ChannelInfo,
  MessageLog,
  MessageProvider,
  MessageResponse,
  MessageTemplate,
  PageResult,
  TemplatePreviewRequest,
  TemplatePreviewResponse,
} from "./types";

/** 消息发送请求（按模板） */
export interface MessageSendRequest {
  /** 接收人 */
  target?: string[];
  /** 模板ID */
  sysMessageTemplateId?: number;
  /** 消息标题 */
  subject?: string;
  /** 模板参数 */
  params?: Record<string, unknown>;
}

/** 按内容发送请求 */
export interface MessageContentSendRequest {
  /** 提供商ID */
  sysMessageProviderId?: number;
  /** 接收人 */
  target?: string[];
  /** 消息标题 */
  subject?: string;
  /** 消息内容 */
  content?: string;
  /** 消息参数 */
  params?: Record<string, unknown>;
}

/** 提供商分页查询 */
export function pageForProvider(params: {
  page?: number;
  pageSize?: number;
  sysMessageProviderName?: string;
  sysMessageProviderType?: string;
}) {
  return http()
    .get("/v2/message/provider/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<MessageProvider>>>((r) => r.data);
}

/** 提供商列表查询 */
export function listForProvider() {
  return http()
    .get("/v2/message/provider/list")
    .then<ApiResult<MessageProvider[]>>((r) => r.data);
}

/** 已注册消息渠道列表 */
export function listChannels() {
  return http()
    .get("/v2/message/channel/list")
    .then<ApiResult<ChannelInfo[]>>((r) => r.data);
}

/** 新增提供商 */
export function saveProvider(data: MessageProvider) {
  return http()
    .post("/v2/message/provider/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<MessageProvider>>((r) => r.data);
}

/** 更新提供商 */
export function updateProvider(data: MessageProvider) {
  return http()
    .put("/v2/message/provider/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除提供商 */
export function deleteProvider(sysMessageProviderId: number) {
  return http()
    .delete("/v2/message/provider/delete")
    .query({ sysMessageProviderId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 模板分页查询 */
export function pageForTemplate(params: {
  page?: number;
  pageSize?: number;
  sysMessageProviderId?: number;
  sysMessageTemplateName?: string;
  sysMessageTemplateType?: string;
}) {
  return http()
    .get("/v2/message/template/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<MessageTemplate>>>((r) => r.data);
}

/** 模板列表查询 */
export function listForTemplate() {
  return http()
    .get("/v2/message/template/list")
    .then<ApiResult<MessageTemplate[]>>((r) => r.data);
}

/** 新增模板 */
export function saveTemplate(data: MessageTemplate) {
  return http()
    .post("/v2/message/template/save")
    .data(data as Record<string, unknown>)
    .then<ApiResult<MessageTemplate>>((r) => r.data);
}

/** 更新模板 */
export function updateTemplate(data: MessageTemplate) {
  return http()
    .put("/v2/message/template/update")
    .data(data as Record<string, unknown>)
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 删除模板 */
export function deleteTemplate(sysMessageTemplateId: number) {
  return http()
    .delete("/v2/message/template/delete")
    .query({ sysMessageTemplateId })
    .then<ApiResult<boolean>>((r) => r.data);
}

/** 手动同步模板 */
export function syncTemplate(sysMessageProviderId: number) {
  return http()
    .post("/v2/message/template/sync")
    .query({ sysMessageProviderId })
    .then<ApiResult<number>>((r) => r.data);
}

/** 按模板发送消息 */
export function sendMessage(data: MessageSendRequest) {
  return http()
    .post("/v2/message/send")
    .data(data as Record<string, unknown>)
    .then<ApiResult<MessageResponse[]>>((r) => r.data);
}

/** 按内容发送消息 */
export function sendContentMessage(data: MessageContentSendRequest) {
  return http()
    .post("/v2/message/send/content")
    .data(data as Record<string, unknown>)
    .then<ApiResult<MessageResponse[]>>((r) => r.data);
}

/** 推送日志分页查询 */
export function pageForLog(params: {
  page?: number;
  pageSize?: number;
  sysMessageLogTarget?: string;
  sysMessageCode?: string;
  sysMessageProviderId?: number;
  sysMessageReadStatus?: number;
}) {
  return http()
    .get("/v2/message/log/page")
    .query(params as Record<string, unknown>)
    .then<ApiResult<PageResult<MessageLog>>>((r) => r.data);
}

/** 模板内容渲染预览 */
export function previewTemplate(data: TemplatePreviewRequest) {
  return http()
    .post("/v2/message/template/preview")
    .data(data as Record<string, unknown>)
    .then<ApiResult<TemplatePreviewResponse>>((r) => r.data);
}

/** 清理推送日志（截止时间，ISO 串，如 2026-01-01T00:00:00） */
export function cleanLog(beforeTime: string) {
  return http()
    .post("/v2/message/log/clean")
    .query({ beforeTime })
    .then<ApiResult<number>>((r) => r.data);
}
