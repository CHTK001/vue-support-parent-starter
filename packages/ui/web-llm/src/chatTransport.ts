/**
 * 悬浮球对话的「目标解析 + 远端发送」注入点。
 *
 * <p>{@code @repo/web-llm} 只实现 <b>webllm 平台模型</b>的浏览器本地推理；
 * 其它平台的模型走后端 ChatClient。为不反向依赖任何业务包（pages/ai 等），
 * 这里提供两个模块级注入点，由消费方（如 {@code @pages/ai}）在启动期注入：</p>
 *
 * <ul>
 *   <li>{@link setChatModelResolver}：解析「当前对话用哪个模型」（含 platform），
 *       供悬浮球按 {@code platform === "webllm"} 分发本地/远端；</li>
 *   <li>{@link setRemoteChatHandler}：远端模型的发送实现（默认 POST
 *       {@link DEFAULT_REMOTE_CHAT_ENDPOINT}，即后端 OpenAI 兼容入口，
 *       由后端按模型路由到对应渠道/凭据）。</li>
 * </ul>
 */
import { http } from "@repo/core";
import type { ChatMessage } from "./types";

/** 当前对话目标模型（platform 用于分发：webllm=本地推理，其余=后端） */
export interface ChatModelTarget {
  /** 模型所属平台（webllm / onnx / openai / …） */
  platform: string;
  /** 模型 ID（webllm 平台即 MLC 模型 ID） */
  modelId: string;
  /** 所属供应商 id（可空） */
  providerId?: string;
}

/** 解析当前对话目标；无可用模型时返回 null（调用方回退默认 webllm 模型） */
export type ChatModelResolver = () => ChatModelTarget | null;

/** 远端对话请求 */
export interface RemoteChatRequest {
  /** 模型 ID */
  modelId: string;
  /** OpenAI 格式消息列表 */
  messages: ChatMessage[];
}

/** 远端对话发送实现：返回完整回复文本 */
export type RemoteChatHandler = (req: RemoteChatRequest) => Promise<string>;

let chatModelResolver: ChatModelResolver | null = null;
let remoteChatHandler: RemoteChatHandler | null = null;

/** 注入对话目标解析器（由业务模块在启动期调用；传 null 恢复默认） */
export function setChatModelResolver(resolver: ChatModelResolver | null): void {
  chatModelResolver = resolver;
}

/** 读取当前注入的对话目标解析器 */
export function getChatModelResolver(): ChatModelResolver | null {
  return chatModelResolver;
}

/** 注入远端对话发送实现（由业务模块在启动期调用；传 null 恢复默认） */
export function setRemoteChatHandler(handler: RemoteChatHandler | null): void {
  remoteChatHandler = handler;
}

/** 读取当前注入的远端对话发送实现 */
export function getRemoteChatHandler(): RemoteChatHandler | null {
  return remoteChatHandler;
}

/** 默认远端对话端点：后端 OpenAI 兼容入口（按 model 路由到对应渠道） */
export const DEFAULT_REMOTE_CHAT_ENDPOINT = "/v1/chat/completions";

/**
 * 默认远端发送实现：POST {@link DEFAULT_REMOTE_CHAT_ENDPOINT}，Bearer 走统一请求管线。
 *
 * @param req 对话请求
 * @returns 首个回复文本；无内容时返回空串
 */
export async function defaultRemoteChat(req: RemoteChatRequest): Promise<string> {
  const { data } = await http()
    .post(DEFAULT_REMOTE_CHAT_ENDPOINT)
    .data({ model: req.modelId, messages: req.messages });
  return data?.choices?.[0]?.message?.content ?? "";
}
